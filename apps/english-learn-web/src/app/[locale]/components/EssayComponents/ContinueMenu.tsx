import { Button, Listbox, ListboxItem } from '@heroui/react'
import { Editor, FloatingMenu } from '@tiptap/react'
import React, { useState, useCallback, useRef, useEffect, Key } from 'react'
import { continueWriteApi } from '@/api/aiproxy'
import { Grade } from '@repo/entity-ts-definition'
import Loading from '../Loading'
import { FaFillDrip, FaRecycle } from 'react-icons/fa6'
import { BsArrowLeft } from 'react-icons/bs'
import { MdDoubleArrow } from 'react-icons/md'
import '@/assets/tippyAnimation.scss'
import { useTranslations } from 'next-intl'
import { useStore } from '@/app/[locale]/context/StoreContext'

const ContinuePannel = ({
  text,
  onRegenerate,
  onFillInEssay,
}: {
  text: string
  onRegenerate: () => any
  onFillInEssay: () => any
}) => {
  const t = useTranslations()
  return (
    <div className="flex flex-col gap-2 p-2">
      {text ? (
        <>
          <p className="text-sm text-foreground-500 break-all">{text}</p>
          <div className="flex gap-2 justify-end">
            <Button size="sm" startContent={<FaRecycle />} onPress={onRegenerate}>
              {t('regenerate')}
            </Button>
            <Button size="sm" color="primary" startContent={<FaFillDrip />} onPress={onFillInEssay}>
              {t('fill-in-essay')}
            </Button>
          </div>
        </>
      ) : (
        <p>{t('no-recommation')}</p>
      )}
    </div>
  )
}

const ContinueMenu = React.memo(
  ({ editor, title, grade }: { editor: Editor; title?: string; grade?: Grade }) => {
    const { userStore } = useStore()
    const t = useTranslations()
    const [loading, setIsLoading] = useState(false)
    const [currentOper, setCurrentOper] = useState<Key>('')
    const [continueState, setContinueState] = useState({
      text: '',
      isContinuing: false,
    })
    const listboxRef = useRef<HTMLUListElement>(null)
    const insertion = useRef<{ pos: number; doc: any } | null>(null)
    const generation = useRef(0)
    const [error, setError] = useState('')

    const shouldShow = useCallback(({ editor, state }: any) => {
      const { selection } = state
      const { $head } = selection
      const endPosition = state.doc.content.size - 1
      const hasContent = endPosition > 0
      const isAtEndOfDocument = $head.pos >= endPosition

      const isAtWordBoundary = () => {
        const textBefore = state.doc.textBetween(Math.max(0, $head.pos - 1), $head.pos)
        const textAfter = state.doc.textBetween(
          $head.pos,
          Math.min(state.doc.content.size, $head.pos + 1)
        )
        return (
          /\s/.test(textBefore) || textBefore === '' || /\s/.test(textAfter) || textAfter === ''
        )
      }

      const lastCharIsSlash = $head.pos > 0 && state.doc.textBetween($head.pos - 1, $head.pos) === '/'

      return (
        selection.empty && editor.isEditable && hasContent && isAtEndOfDocument && editor.isFocused && isAtWordBoundary() && lastCharIsSlash
      )
    }, [])

    const continueWrite = async (isCache?: boolean) => {
      if (!userStore.userInfo?.id) { setError(t('error-code-401')); return }
      const { state } = editor
      const { $head } = state.selection
      const currentPosition = $head.pos
      const requestId = ++generation.current
      insertion.current = { pos: currentPosition, doc: state.doc }
      setError('')
      try {
        setIsLoading(true)
        let textBefore = state.doc.textBetween(Math.max(0, currentPosition - 1500), currentPosition, '\n')
        const prompt = textBefore.trim().replace(/\/$/, '')
        const continuation = await continueWriteApi({
          context: prompt,
          title: title || '',
          grade: grade || 'ielts',
          isCache: isCache || false,
        })
        if (requestId !== generation.current) return
        if (continuation.code !== 200 || !continuation.data?.continueContent) throw new Error('No continuation')
        setContinueState({
          text: continuation.data?.continueContent || '',
          isContinuing: true,
        })
      } catch {
        if (requestId === generation.current) setError(t('editor-request-failed'))
      } finally {
        if (requestId === generation.current) setIsLoading(false)
      }
    }

    const regenerate = useCallback(async () => {
      continueWrite(false)
    }, [continueWrite])

    const fillInEssay = useCallback(async () => {
      const saved = insertion.current
      if (!saved || !editor.state.doc.eq(saved.doc) || editor.state.doc.textBetween(saved.pos - 1, saved.pos) !== '/') {
        setError(t('editor-selection-changed'))
        return
      }
      editor.chain().focus().insertContentAt({ from: saved.pos - 1, to: saved.pos },
        { type: 'text', text: continueState.text }).run()

      setContinueState({
        text: '',
        isContinuing: false,
      })
    }, [editor, continueState.text])

    const handleAction = (key: Key) => {
      setCurrentOper(key)
      setIsLoading(true)
      try {
        switch (key) {
          case 'continueWrite':
            continueWrite()
            break
          default:
            break
        }
      } catch (error) {}
    }

    const reset = () => {
      generation.current++
      insertion.current = null
      setError('')
      setCurrentOper('')
      setIsLoading(false)
      setContinueState({
        text: '',
        isContinuing: false,
      })
      document.removeEventListener('keydown', handleKeyDown)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' && listboxRef.current) {
        event.preventDefault()
        const firstItem = listboxRef.current.querySelector('[role="option"]') as HTMLElement
        if (firstItem) {
          firstItem.focus()
        }
      } else if (event.key === 'ArrowUp' && listboxRef.current) {
        const activeElement = document.activeElement
        const listboxItems = listboxRef.current.querySelectorAll('[role="option"]')
        const firstItem = listboxItems[0] as HTMLElement

        if (activeElement === firstItem) {
          event.preventDefault()
          editor.commands.focus()
        }
      }
    }

    useEffect(() => () => {
      generation.current++
      document.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
      <FloatingMenu
        editor={editor}
        shouldShow={shouldShow}
        tippyOptions={{
          placement: 'bottom-start',
          onHide: reset,
          onShow: () => {
            document.addEventListener('keydown', handleKeyDown)
          },
          animation: 'slide-in',
        }}
      >
        <div className="flex flex-col gap-2 shadow-lg rounded-lg p-1 bg-background border border-solid border-foreground-200 min-w-36">
          {currentOper === '' && !loading && (
            <Listbox aria-label="Actions" onAction={handleAction} ref={listboxRef}
              disabledKeys={!userStore.userInfo?.id ? ['continueWrite'] : []}>
              <ListboxItem
                key="continueWrite"
                startContent={<MdDoubleArrow />}
                description="Continue writing with AI"
                autoFocus={true}
              >
                {t('Continuewrite')}
              </ListboxItem>
            </Listbox>
          )}
          {currentOper && (
            <div className="h-8 flex">
              <Button
                variant="light"
                size="sm"
                startContent={<BsArrowLeft />}
                onPress={reset}
              >
                {t('back')}
              </Button>
            </div>
          )}
          {loading ? (
            <div className="w-36 h-12">
              <Loading />
            </div>
          ) : (
            <>
              {error && <p role="alert" className="text-sm text-danger px-2">{error}</p>}
              {currentOper === 'continueWrite' && (
                <ContinuePannel
                  text={continueState.text}
                  onRegenerate={regenerate}
                  onFillInEssay={fillInEssay}
                />
              )}
            </>
          )}
        </div>
      </FloatingMenu>
    )
  }
)

export default ContinueMenu
