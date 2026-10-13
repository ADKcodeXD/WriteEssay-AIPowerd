import { limitMap } from '@/utils'
import { Editor } from '@tiptap/react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useState } from 'react'
import { toast } from 'react-toastify'

export const useEditorHeight = (height: number) => {
  const [calcHeight, setCalcHeight] = useState(0)
  const bottomStatus = useRef<HTMLDivElement | null>(null)
  const topMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!height) return // 如果传入的height为0，直接返回

    const calculate = () => {
      if (bottomStatus.current && topMenuRef.current) {
        const newHeight =
          height - bottomStatus.current.clientHeight - topMenuRef.current.clientHeight - 24

        // 只在高度有显著变化时才更新
        if (Math.abs(newHeight - calcHeight) > 10) {
          setCalcHeight(newHeight)
        }
      }
    }

    calculate()

    // 添加一个短暂延迟，确保DOM完全渲染
    const timer = setTimeout(calculate, 100)
    return () => clearTimeout(timer)
  }, [height, calcHeight])

  return { calcHeight, topMenuRef, bottomStatus }
}

export const useEditorAutoSave = (editor: Editor | null, title: string) => {
  const t = useTranslations()
  const [saveMessage, setSaveMessage] = useState('')
  const [isNeedSave, setIsNeedSave] = useState(false)
  const messageRef = useRef(null)
  const autoSaveKey = useMemo(() => `essay-autosave-${title}`, [title])
  const saveContent = useCallback((content: string, needTooltip = false) => {
    try {
      const now = new Date()
      localStorage.setItem(autoSaveKey, content)
      localStorage.setItem(`${autoSaveKey}-time`, now.toISOString())
      const message = t('last-saved', { time: now.toLocaleTimeString() })
      setSaveMessage(message)
      setIsNeedSave(false)
      if (needTooltip) toast.success(message)
    } catch {
      setSaveMessage(t('editor-save-failed'))
    }
  }, [autoSaveKey, t])

  useEffect(() => {
    if (!editor) return
    try {
      const saved = localStorage.getItem(autoSaveKey)
      const savedTime = localStorage.getItem(`${autoSaveKey}-time`)
      // A loaded essay/report takes precedence over an unrelated local draft.
      if (saved && !editor.getText().trim()) {
        editor.commands.setContent({
          type: 'doc', content: saved.split('\n').map(text => ({
            type: 'paragraph', content: text ? [{ type: 'text', text }] : [],
          })),
        }, true)
        if (savedTime) setSaveMessage(t('loaded-from', { time: new Date(savedTime).toLocaleTimeString() }))
      }
    } catch { setSaveMessage(t('editor-save-failed')) }
    let timer: ReturnType<typeof setTimeout> | undefined
    let dirty = false
    const persist = () => {
      if (!dirty) return
      saveContent(editor.getText({ blockSeparator: '\n' }))
      dirty = false
    }
    const update = () => {
      dirty = true
      setIsNeedSave(true)
      clearTimeout(timer)
      timer = setTimeout(persist, 1000)
    }
    editor.on('update', update)
    window.addEventListener('pagehide', persist)
    return () => {
      clearTimeout(timer)
      persist()
      editor.off('update', update)
      window.removeEventListener('pagehide', persist)
    }
  }, [editor, autoSaveKey, saveContent, t])
  return { saveMessage, messageRef, isNeedSave, setIsNeedSave, saveContent }
}

export const useProcessAndWords = (
  editor: Editor | null,
  grade: string = 'ielts',
  taskType: number = 2
) => {
  const totalWords = editor?.storage.characterCount.words() || 0

  const process = useMemo(() => {
    return (
      (editor?.storage.characterCount.words() / limitMap[`${grade}${taskType || ''}` || 'ielts']) *
        100 || 0
    )
  }, [editor, grade, totalWords, taskType])

  return { process, totalWords }
}
