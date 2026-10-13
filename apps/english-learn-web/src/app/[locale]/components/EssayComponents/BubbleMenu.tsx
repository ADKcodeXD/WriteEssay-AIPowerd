'use client'
import { Button, Card, CardBody, CardHeader } from '@heroui/react'
import { BubbleMenu, Editor } from '@tiptap/react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { MdOutlineGTranslate, MdClose, MdContentCopy } from 'react-icons/md'
import { TbPencilStar } from 'react-icons/tb'
import { polish, tranlate } from '@/api/aiproxy'
import { useLocale, useTranslations } from 'next-intl'
import { LocaleCode } from '@repo/entity-ts-definition'
import { useStore } from '../../context/StoreContext'

type Range = { from: number; to: number; text: string }
type Result = { text: string; explain?: string }
export default function BubbleMenuCustom({ editor, title }: { editor: Editor; title: string }) {
  const t = useTranslations()
  const locale = useLocale()
  const { userStore } = useStore()
  const [operation, setOperation] = useState<'' | 'translate' | 'polish'>('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [source, setSource] = useState('')
  const [copied, setCopied] = useState(false)
  const [target, setTarget] = useState(locale)
  const range = useRef<Range | null>(null)
  const abort = useRef<(() => void) | null>(null)
  const generation = useRef(0)

  const reset = useCallback(() => {
    generation.current++
    abort.current?.()
    abort.current = null
    range.current = null
    setOperation('')
    setLoading(false)
    setResult(null)
    setError('')
    setCopied(false)
  }, [])

  useEffect(() => {
    const changed = () => {
      const selected = range.current
      if (!selected) return
      const { from, to } = editor.state.selection
      if (from !== selected.from || to !== selected.to ||
          editor.state.doc.textBetween(from, to, '\n') !== selected.text) reset()
    }
    editor.on('selectionUpdate', changed)
    editor.on('update', changed)
    const dismiss = (event: KeyboardEvent) => { if (event.key === 'Escape') reset() }
    document.addEventListener('keydown', dismiss)
    return () => {
      editor.off('selectionUpdate', changed)
      editor.off('update', changed)
      document.removeEventListener('keydown', dismiss)
      generation.current++
      abort.current?.()
    }
  }, [editor, reset])

  async function run(action: 'translate' | 'polish', language = target) {
    abort.current?.()
    const token = ++generation.current
    const { from, to } = editor.state.selection
    const text = editor.state.doc.textBetween(from, to, '\n')
    if (!text.trim()) return
    range.current = { from, to, text }
    setSource(text)
    setOperation(action)
    setLoading(true)
    setResult(null)
    setError('')
    setCopied(false)
    try {
      let response
      if (action === 'translate') {
        const controller = new AbortController()
        abort.current = () => controller.abort()
        response = await tranlate({ content: text, locale: language as LocaleCode }, controller.signal)
      } else {
        const pending = polish({ content: text, title, locale: locale as LocaleCode })
        abort.current = pending.abort
        response = await pending.promise
      }
      if (token !== generation.current) return
      if (response.code !== 200) throw new Error('Request failed')
      const output = action === 'translate' ? response.data : response.data?.polished
      if (typeof output !== 'string' || !output.trim()) throw new Error('Empty result')
      setResult({ text: output, explain: action === 'polish' ? response.data?.explain : undefined })
    } catch (cause) {
      if (token === generation.current && (cause as Error).name !== 'AbortError') setError(t('editor-request-failed'))
    } finally {
      if (token === generation.current) { setLoading(false); abort.current = null }
    }
  }

  function replace() {
    const selected = range.current
    if (!selected || !result || !editor.isEditable) return
    if (selected.to > editor.state.doc.content.size ||
        editor.state.doc.textBetween(selected.from, selected.to, '\n') !== selected.text) {
      setError(t('editor-selection-changed'))
      return
    }
    const replacement = result.text
    reset()
    // Insert plain text nodes, so AI output containing HTML stays literal.
    editor.chain().focus().setTextSelection({ from: selected.from, to: selected.to })
      .unsetMark('enhancedText')
      .insertContent(!replacement.includes('\n') ? { type: 'text', text: replacement } : replacement.split('\n').map(text => ({
        type: 'paragraph', content: text ? [{ type: 'text', text }] : [],
      }))).run()
  }

  async function copy() {
    try { await navigator.clipboard.writeText(result?.text || ''); setCopied(true) }
    catch { setError(t('editor-copy-failed')) }
  }

  return (
    <BubbleMenu editor={editor}
      shouldShow={({ state }) => !state.selection.empty && Boolean(state.doc.textBetween(state.selection.from, state.selection.to).trim())}
      tippyOptions={{ duration: 120, interactive: true, placement: 'top', maxWidth: 'none', onHidden: reset }}
    >
      <Card className="editor-selection-menu" onMouseDown={event => {
        if (!(event.target as HTMLElement).closest('input,select,textarea,[role="combobox"]')) event.preventDefault()
      }}>
        {!operation ? <CardBody className="flex flex-row gap-1 p-1.5">
          <Button size="sm" variant="light" startContent={<MdOutlineGTranslate />} isDisabled={!userStore.userInfo?.id}
            onPress={() => void run('translate')}>{t('translate')}</Button>
          {editor.isEditable && <Button size="sm" variant="light" startContent={<TbPencilStar />} isDisabled={!userStore.userInfo?.id}
            onPress={() => void run('polish')}>{t('polish')}</Button>}
          {!userStore.userInfo?.id && <span className="text-xs self-center px-2">{t('error-code-401')}</span>}
        </CardBody> : <>
          <CardHeader className="flex justify-between gap-3 px-3 py-2">
            <span className="font-medium text-sm">{t(operation)}</span>
            <Button size="sm" isIconOnly variant="light" aria-label={t('editor-close')} onPress={reset}><MdClose /></Button>
          </CardHeader>
          <CardBody className="gap-3 pt-0 px-3 pb-3">
            <p className="text-xs text-foreground-500 whitespace-pre-wrap max-h-20 overflow-auto">{source}</p>
            {operation === 'translate' && <label className="flex items-center justify-between gap-3 text-xs text-foreground-500">
              {t('editor-target-language')}
              <select aria-label={t('editor-target-language')} className="rounded-lg bg-content2 text-foreground px-3 py-2" value={target} onChange={event => {
                if (!event.target.value) return
                setTarget(event.target.value)
                void run('translate', event.target.value)
              }}>
              <option value="zh-CN">简体中文</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              </select>
            </label>}
            <div aria-live="polite" aria-busy={loading}>
              {loading && <p className="text-sm text-foreground-500 py-3">{t('editor-working')}</p>}
              {error && <p role="alert" className="text-sm text-danger">{error}</p>}
              {result && <div className="max-h-60 overflow-auto space-y-3">
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{result.text}</p>
                {result.explain && <p className="text-xs text-foreground-500 leading-relaxed">{result.explain}</p>}
              </div>}
            </div>
            <div className="flex gap-2 justify-end">
              {error && <Button size="sm" variant="flat" onPress={() => void run(operation)}>{t('editor-retry')}</Button>}
              {result && <Button size="sm" variant="light" startContent={<MdContentCopy />} onPress={() => void copy()}>
                {t(copied ? 'editor-copied' : 'editor-copy')}
              </Button>}
              {result && operation === 'polish' && editor.isEditable &&
                <Button size="sm" color="primary" onPress={replace}>{t('replace')}</Button>}
            </div>
          </CardBody>
        </>}
      </Card>
    </BubbleMenu>
  )
}
