'use client'
import { Editor, Mark } from '@tiptap/core'
import Typo from 'typo-js'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import tippy from 'tippy.js'
import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Listbox, ListboxItem } from '@heroui/react'
import { getTranslator } from '@/i18n'

let dictionary: any = null

const initDictionary = () => {
  try {
    if (typeof window !== 'undefined' && !dictionary) {
      dictionary = new (Typo as any)('en_US', false, false, { dictionaryPath: '/dictionaries' })
    }
  } catch (error) {
    // 有bug 不打印
  }
}

const TooltipContent = React.memo(
  ({
    tips,
    range,
    onClickAction,
  }: {
    tips: string
    range: string
    onClickAction: (tip: string, from: number, to: number) => void
  }) => {
    const tipsArray = JSON.parse(tips)
    const rangeArray = JSON.parse(range)
    const t = getTranslator()
    return (
      <div className="p-2 bg-content1 text-foreground rounded-lg shadow-lg border-solid border-1 border-foreground-200">
        <p className="text-xs text-foreground-400">{t('word-advice')}</p>
        <Listbox
          color="secondary"
          onAction={(key) => {
            onClickAction(key as string, parseInt(rangeArray.from), parseInt(rangeArray.to))
          }}
        >
          {tipsArray &&
            tipsArray?.map((tip: string) => (
              <ListboxItem key={tip} className="text-sm" color="secondary">
                {tip}
              </ListboxItem>
            ))}
        </Listbox>
      </div>
    )
  }
)

export const MisspelledWord = Mark.create({
  name: 'misspelledWord',
  inclusive: false,
  excludes: 'misspelledWord',

  addAttributes() {
    return {
      word: {
        default: null,
      },
      tips: {
        default: [],
      },
      from: {
        default: 0,
      },
      to: {
        default: 0,
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span.misspelled' }]
  },

  renderHTML({ mark }) {
    return [
      'span',
      {
        class: 'misspelled',
        'data-tippy-content': JSON.stringify(mark.attrs.tips),
        'data-node-type': 'misspelledWord',
        'data-tippy-range': JSON.stringify({ from: mark.attrs.from, to: mark.attrs.to }),
      },
      0,
    ]
  },

  addCommands() {
    return {
      setMisspelledWord:
        (attributes: any) =>
        ({ tr, dispatch }: any) => {
          if (dispatch) {
            tr.addMark(
              attributes.from,
              attributes.to,
              this.type.create({
                word: attributes.word,
                tips: attributes.tips,
                from: attributes.from,
                to: attributes.to,
              })
            )
          }
          return true
        },
      unsetMisspelledWord:
        ({ from, to }: any) =>
        ({ tr, dispatch }: any) => {
          if (dispatch) {
            tr.removeMark(from, to, this.type)
          }
          return true
        },
    } as any
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('misspelledWordTooltip'),
        props: {
          handleDOMEvents: {
            mousedown: (view: any, event: MouseEvent) => {
              const target = event.target as HTMLElement
              if (
                target.hasAttribute('data-tippy-content') &&
                target.hasAttribute('data-node-type') &&
                target.getAttribute('data-node-type') === 'misspelledWord'
              ) {
                document.querySelectorAll('[data-tippy-root]').forEach((el) => {
                  ;(el as any)._tippy?.hide()
                })
                let tippyInstance = tippy(target as Element, {
                  content: () => {
                    const tooltipContent = document.createElement('div')
                    return tooltipContent
                  },
                  placement: 'top',
                  trigger: 'manual',
                  arrow: true,
                  interactive: true,
                  allowHTML: true,
                  appendTo: () => document.body,
                  animation: 'scale',
                  duration: 200,
                  onCreate: (instance) => {
                    const originalDoc = view.state.doc
                    const from = view.posAtDOM(target, 0)
                    const to = from + (target.textContent?.length || 0)
                    const { popper } = instance
                    const root = createRoot(popper)
                    root.render(
                      <TooltipContent
                        tips={target.getAttribute('data-tippy-content') || 'null'}
                        range={target.getAttribute('data-tippy-range') || 'null'}
                        onClickAction={(tip) => {
                          if (!view.state.doc.eq(originalDoc)) { instance.hide(); return }
                          view.dispatch(
                            view.state.tr.replaceWith(from, to, view.state.schema.text(tip))
                          )
                          instance.hide()
                        }}
                      />
                    )
                    ;(instance as any).popperRoot = root
                  },
                  onHidden: (instance) => {
                    const customInstance = instance as any
                    if (customInstance.popperRoot) {
                      customInstance.popperRoot.unmount()
                      delete customInstance.popperRoot
                    }
                    instance.destroy()
                  },
                })
                tippyInstance.show()
              } else if (!(target as any)._tippy) {
                document.querySelectorAll('[data-tippy-root]').forEach((el) => {
                  ;(el as any)._tippy?.hide()
                })
              }
            },
          },
        },
      }),
    ]
  },
})

const spellingWorkers = new WeakMap<Editor, Worker>()
const spellingRequests = new WeakMap<Editor, number>()

export function checkSpelling(editor: Editor) {
  if (editor.isDestroyed || !editor.isEditable) return
  let worker = spellingWorkers.get(editor)
  if (!worker) {
    worker = new Worker(new URL('./spellCheckWorker.ts', import.meta.url))
    spellingWorkers.set(editor, worker)
    editor.on('destroy', () => { worker?.terminate(); spellingWorkers.delete(editor) })
  }
  const doc = editor.state.doc
  const requestId = (spellingRequests.get(editor) || 0) + 1
  spellingRequests.set(editor, requestId)
  const words: { word: string; from: number; to: number }[] = []
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return
    for (const match of node.text.matchAll(/[A-Za-z]+(?:['’][A-Za-z]+)*/g)) {
      const from = pos + (match.index || 0)
      words.push({ word: match[0], from, to: from + match[0].length })
    }
  })
  worker.onmessage = ({ data }) => {
    if (editor.isDestroyed || data.requestId !== spellingRequests.get(editor) || !editor.state.doc.eq(doc)) return
    const mark = editor.schema.marks.misspelledWord
    const tr = editor.state.tr.removeMark(0, editor.state.doc.content.size, mark)
    for (const result of data.results) {
      if (!result.correct) tr.addMark(result.from, result.to, mark.create(result))
    }
    // Decoration-only changes must not steal focus, trigger autosave or schedule another check.
    tr.setMeta('preventUpdate', true).setMeta('addToHistory', false)
    editor.view.dispatch(tr)
  }
  worker.postMessage({ requestId, words })
}

export function getSpellingSuggestions(word: string) {
  if (!dictionary) {
    initDictionary()
  }
  if (!dictionary) return []
  return dictionary.suggest(word) || []
}
