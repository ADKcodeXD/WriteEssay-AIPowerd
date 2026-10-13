'use client'
import '@/assets/tiptap.scss'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import BubbleMenuCustom from './EssayComponents/BubbleMenu'
import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useMemo } from 'react'
import { MisspelledWord, checkSpelling } from './EssayComponents/MistakeSpellNode'
import { debounce } from 'lodash-es'
import { useTranslations } from 'next-intl'
import { EssayFeedbackPartial, Grade } from '@repo/entity-ts-definition'
import { Button, Tooltip } from '@heroui/react'
import ContinueMenu from './EssayComponents/ContinueMenu'
import SentenceLine, { processTextWithMarks, TooltipContent } from './EssayComponents/SentenceLine'
import { TimerProvider } from '../context/TimerContext'
import { SwitchTransition, CSSTransition } from 'react-transition-group'
import { BubbleMark } from '@/thirdparty/BubbleMark/BubbleMark'
import WordLimit from './EssayComponents/WordLimit'
import TimerDisplay from './EssayComponents/TimerDisplay'
import { useEditorAutoSave, useEditorHeight, useProcessAndWords } from '@/hooks/useEditorFunction'
import { IoMdSave } from 'react-icons/io'
import { MdUndo, MdRedo } from 'react-icons/md'
import { SelectionHighlight } from './EssayComponents/SelectionHighlight'

const limit = 5000

// 使用React.memo包装可能的子组件，添加适当的类型定义
interface BubbleMarkWrapperProps {
  editor: any
  children: (params: any) => React.ReactNode
}

const BubbleMarkWrapper = React.memo(({ editor, children }: BubbleMarkWrapperProps) => (
  <BubbleMark
    editor={editor}
    className="mark-bubble"
    shouldShow={({ marks }: { marks: any[] }) => {
      return marks.some((mark) => {
        return mark.type.name === 'enhancedText'
      })
    }}
    tippyOptions={{
      interactive: true,
      placement: 'top',
    }}
  >
    {children}
  </BubbleMark>
))

interface StatusBarProps {
  messageRef: React.RefObject<HTMLSpanElement>
  saveMessage: string
  timerRef: React.RefObject<{ getTime: () => number }>
  process: number
  grade?: Grade
  totalWords: number
  taskType?: number
  bottomStatus: React.RefObject<HTMLDivElement>
}

const StatusBar = React.memo(
  ({
    messageRef,
    saveMessage,
    timerRef,
    process,
    grade,
    totalWords,
    taskType,
    bottomStatus,
  }: StatusBarProps) => (
    <div className="items-center flex flex-wrap gap-2 font-mono text-sm text-foreground-500" ref={bottomStatus}>
      <TimerDisplay ref={timerRef} />
      <WordLimit process={process} grade={grade} words={totalWords} taskType={taskType || 2} />
      <SwitchTransition>
        <CSSTransition
          key={saveMessage}
          nodeRef={messageRef}
          timeout={1000}
          classNames="fade-up-in"
        >
          <span ref={messageRef} className="text-xs text-foreground-500">
            {saveMessage}
          </span>
        </CSSTransition>
      </SwitchTransition>
    </div>
  )
)

interface TiptapProps {
  grade?: Grade | undefined
  title?: string
  editable?: boolean
  content: string
  height?: number
  onUpdateContent?: (content?: string) => void
  taskType?: number
}

const Tiptap = forwardRef<
  {
    updateContentAndMark: (text: string, result: EssayFeedbackPartial) => void
    getWritingTime: () => number
  },
  TiptapProps
>(({ grade, content, height, taskType, title, onUpdateContent, editable = true }, ref) => {
  const t = useTranslations()
  const editorRef = useRef<any>(null)
  const timerRef = useRef<{ getTime: () => number }>(null as any)

  // 替换useCallback为普通函数，使用debounce但不包裹在useCallback中
  const checkSpellingDebounced = useMemo(() => debounce((editor: any) => {
    checkSpelling(editor)
  }, 1000), [])
  useEffect(() => () => checkSpellingDebounced.cancel(), [checkSpellingDebounced])

  // 使用useMemo缓存extensions配置以避免不必要的重新创建
  const extensions = useMemo(
    () => [
      StarterKit,
      MisspelledWord,
      SentenceLine,
      SelectionHighlight,
      CharacterCount.configure({
        limit,
      }),
      Placeholder.configure({
        placeholder: t('placeholder-editor'),
      }),
    ],
    [t]
  )

  // 替换useCallback为普通函数
  function onUpdateCallback({ editor }: { editor: any }) {
    const { state } = editor
    checkSpellingDebounced(editor)
    onUpdateContent && onUpdateContent(state.doc.textBetween(0, state.doc.content.size, '\n', '\n'))
  }

  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    editable,
    content: { type: 'doc', content: content.split('\n').map(text => ({
      type: 'paragraph', content: text ? [{ type: 'text', text }] : [],
    })) },
    onUpdate: onUpdateCallback,
  })

  const { calcHeight, topMenuRef, bottomStatus } = useEditorHeight(height || 200)
  const { process, totalWords } = useProcessAndWords(editor, grade, taskType)
  const { saveMessage, messageRef, saveContent } = useEditorAutoSave(editor, title || '')

  // 替换useCallback为普通函数
  function tooltipContentRenderer(params: any) {
    return (
      <TooltipContent
        content={params?.mark?.attrs?.content}
        type={params?.mark?.attrs?.type}
        onClickReplace={(content: string) => {
          if (!editor?.isEditable || editor.state.doc.textBetween(params.start, params.end) !== params.text) return
          editor
            ?.chain()
            .focus()
            .setTextSelection({ from: params.start, to: params.end })
            .unsetMark('enhancedText')
            .insertContent({ type: 'text', text: content })
            .run()
        }}
      />
    )
  }

  // 替换useCallback为普通函数
  function handleSaveContent() {
    if (!editor) return
    saveContent(
      editor.state.doc.textBetween(0, editor.state.doc.content.size, '\n', '\n') as string
    )
  }

  useImperativeHandle(
    ref,
    () => ({
      updateContentAndMark(text: string, result: EssayFeedbackPartial) {
        if (editor) {
          const htmlContent = processTextWithMarks(text, result)
          editor.commands.setContent(htmlContent, true)
        }
      },
      getWritingTime: () => {
        return timerRef.current?.getTime() || 0
      },
    }),
    [editor]
  )

  useEffect(() => {
    editor?.setEditable(editable, false)
  }, [editor, editable])

  // 渲染优化：只有在editor存在时才渲染内部组件
  if (!editor) {
    return (
      <TimerProvider>
        <div
          className="rounded-md px-2 pb-2 flex flex-col"
          style={{ boxShadow: '0 0 2px --foreground-500' }}
        >
          <div style={{ height: height || 200 }}></div>
        </div>
      </TimerProvider>
    )
  }

  return (
    <TimerProvider>
      <div
        className="rounded-md px-2 pb-2 flex flex-col"
        style={{ boxShadow: '0 0 2px --foreground-500' }}
      >
        <div className="flex gap-2" ref={topMenuRef}>
          {editable && <>
            <Button isIconOnly size="sm" variant="light" aria-label={t('editor-undo')}
              isDisabled={!editor.can().undo()} onPress={() => editor.chain().focus().undo().run()}><MdUndo size={18} /></Button>
            <Button isIconOnly size="sm" variant="light" aria-label={t('editor-redo')}
              isDisabled={!editor.can().redo()} onPress={() => editor.chain().focus().redo().run()}><MdRedo size={18} /></Button>
          </>}
          <Tooltip content={t('savetolocal')}>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              className="mr-2"
              onClick={handleSaveContent}
              aria-label={t('savetolocal')}
            >
              <IoMdSave size={18} />
            </Button>
          </Tooltip>
        </div>

        <BubbleMenuCustom editor={editor} title={title || ''} />

        <BubbleMarkWrapper editor={editor}>{tooltipContentRenderer}</BubbleMarkWrapper>

        <EditorContent
          ref={editorRef}
          editor={editor}
          height={height}
          className="overflow-auto"
          style={{ height: `${calcHeight || height}px` }}
        />

        {editable && <ContinueMenu editor={editor} title={title} grade={grade} />}

        <StatusBar
          messageRef={messageRef}
          saveMessage={saveMessage}
          timerRef={timerRef}
          process={process}
          grade={grade}
          totalWords={totalWords}
          taskType={taskType}
          bottomStatus={bottomStatus}
        />
      </div>
    </TimerProvider>
  )
})

Tiptap.displayName = 'Tiptap'

export default Tiptap
