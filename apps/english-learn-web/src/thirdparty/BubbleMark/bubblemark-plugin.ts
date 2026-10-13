import { Editor, Mark, getMarkRange } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import tippy, { Instance as TippyInstance, Props as TippyOptions } from 'tippy.js'
import 'tippy.js/animations/scale.css'
import '@/assets/tippyAnimation.scss'

export interface BubbleMarkPluginProps {
  editor: Editor
  element: HTMLElement
  pluginKey?: PluginKey | string
  tippyOptions?: Partial<TippyOptions>
  shouldShow?: (props: { marks: any[]; text: string }) => boolean
  onUpdate?: (
    markInfo: {
      mark: Mark
      text: string
      pos: number
      start: number
      end: number
    } | null
  ) => void
}

export const BubbleMarkPluginKey = new PluginKey('bubbleMark')

export const BubbleMarkPlugin = (options: BubbleMarkPluginProps) => {
  const {
    editor,
    element,
    pluginKey = BubbleMarkPluginKey,
    tippyOptions = {},
    shouldShow,
    onUpdate,
  } = options

  let tippyInstance: TippyInstance | null = null
  let currentMarkInfo: any = null

  return new Plugin({
    key: typeof pluginKey === 'string' ? new PluginKey(pluginKey) : pluginKey,

    view: (view: EditorView) => {
      const handler = (event: MouseEvent) => {
        // 检查点击的目标是否是 tippy 相关元素
        const target = event.target as HTMLElement
        if (
          target.closest('.tippy-box') || // 检查是否点击了 tippy 弹窗
          target.closest('.tippy-content') || // 检查是否点击了 tippy 内容
          element.contains(target) || // 检查是否点击了目标元素
          target.classList.contains('enhanced-content-area') ||
          target === element
        ) {
          return // 如果点击了这些元素中的任何一个，就不处理
        }

        if (!view.dom.contains(target) || !view.state.selection.empty) {
          tippyInstance?.hide()
          return
        }
        const pos = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })

        if (!pos) {
          tippyInstance?.hide()
          return
        }

        const { doc } = view.state
        const resolvedPos = doc.resolve(pos.pos)
        const marks = [...resolvedPos.marks(), ...(resolvedPos.nodeAfter?.marks || []), ...(resolvedPos.nodeBefore?.marks || [])]
        const text = doc.textBetween(resolvedPos.start(), resolvedPos.end())

        // 如果有mark节点
        if (marks.some(mark => mark.type.name === 'enhancedText') && (!shouldShow || shouldShow({ marks, text }))) {
          const mark = marks.find(mark => mark.type.name === 'enhancedText')!
          const range = getMarkRange(resolvedPos, mark.type, mark.attrs)
          if (!range) { tippyInstance?.hide(); return }
          const startPos = range.from
          const endPos = range.to

          const markInfo = {
            mark,
            text: doc.textBetween(startPos, endPos),
            pos: pos.pos,
            start: startPos,
            end: endPos,
          }

          // 检查是否点击了不同的mark（即使tag相同）
          if (JSON.stringify(markInfo) === JSON.stringify(currentMarkInfo)) {
            return
          }

          // 如果是不同的mark，先隐藏当前tippy
          tippyInstance?.hide()

          currentMarkInfo = markInfo
          onUpdate?.(markInfo as any)

          const coords = view.coordsAtPos(pos.pos)

          if (!tippyInstance) {
            tippyInstance = tippy(element, {
              trigger: 'manual',
              placement: 'top',
              animation: 'slide-in',
              duration: 200,
              animateFill: true,
              allowHTML: true,
              theme: 'custom-tippy',
              appendTo: () => document.body,
              popperOptions: {
                modifiers: [
                  {
                    name: 'preventOverflow',
                    options: {
                      boundary: 'viewport',
                      padding: 8,
                    },
                  },
                  {
                    name: 'flip',
                    options: {
                      fallbackPlacements: ['bottom', 'right', 'left'],
                    },
                  },
                ],
              },
              getReferenceClientRect: () =>
                ({
                  width: 0,
                  height: 0,
                  top: coords.top,
                  bottom: coords.bottom,
                  left: coords.left,
                  right: coords.right,
                  x: coords.left,
                  y: coords.top,
                }) as any,
              ...tippyOptions,
            })
          } else {
            tippyInstance.setProps({
              getReferenceClientRect: () =>
                ({
                  width: 0,
                  height: 0,
                  top: coords.top,
                  bottom: coords.bottom,
                  left: coords.left,
                  right: coords.right,
                  x: coords.left,
                  y: coords.top,
                }) as any,
            })
          }
          tippyInstance?.show()
        } else {
          tippyInstance?.hide()
          currentMarkInfo = null
          onUpdate?.(null)
        }
      }

      document.addEventListener('mouseup', handler)

      return {
        update: (updatedView: EditorView, previousState: any) => {
          if (!updatedView.state.doc.eq(previousState.doc) || !updatedView.state.selection.empty) {
            tippyInstance?.hide()
            currentMarkInfo = null
          }
        },
        destroy: () => {
          document.removeEventListener('mouseup', handler)
          tippyInstance?.destroy()
        },
      }
    },
  })
}
