import { limitMap } from '@/utils'
import {
  Button,
  CircularProgress,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'
import { AiRateParams, EssayFeedbackPartial, EssayListVO } from '@repo/entity-ts-definition'
import { useTranslations } from 'next-intl'
import React, { useState, useEffect, useRef, memo } from 'react'
import { FaCheckCircle, FaRegCheckCircle } from 'react-icons/fa'
import { RiErrorWarningLine } from 'react-icons/ri'
import { IoCloseCircleOutline } from 'react-icons/io5'
import { rateEssay } from '@/api/aiproxy'
import { CSSTransition, SwitchTransition } from 'react-transition-group'
import '@/assets/anime.scss'
import { RatingResult } from './RatingResult/RatingResultReport'
import { toast } from 'react-toastify'

const LoadingAnimation = memo(
  ({ successStatus, onSuccess }: { successStatus: boolean; onSuccess: () => void }) => {
    const t = useTranslations()
    const tips = [t('ai-reading'), t('ai-analyzing'), t('ai-evaluating'), t('ai-generating')]
    const refs = tips.map(() => useRef(null))
    const [currentTip, setCurrentTip] = useState(0)
    const [progress, setProgress] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentTip((prevTip) => (prevTip + 1) % tips.length)
      }, 3000)

      return () => clearInterval(interval)
    }, [tips.length])

    useEffect(() => {
      if (successStatus && !isLoading) {
        setIsLoading(true)

        const showProgress = () => {
          setProgress(33)
          setTimeout(() => {
            setProgress(66)
            setTimeout(() => {
              setProgress(100)
              setTimeout(() => {
                onSuccess()
                setIsLoading(false)
              }, 1000)
            }, 400)
          }, 400)
        }

        showProgress()
      }
    }, [successStatus, onSuccess])

    return (
      <div className="flex flex-col items-center justify-center">
        <div className="relative">
          <CircularProgress
            className="self-center"
            classNames={{
              svg: 'w-36 h-36 drop-shadow-md',
              indicator: `transition-all duration-1000 ease-in-out ${successStatus ? 'stroke-success' : 'stroke-secondary'}`,
              track: `transition-all duration-1000 ease-in-out ${successStatus ? 'stroke-success/10' : 'stroke-secondary/10'}`,
              value: 'text-3xl font-semibold',
            }}
            strokeWidth={4}
            value={successStatus ? progress : undefined}
            isIndeterminate={!successStatus}
            showValueLabel={progress !== 100}
            label={
              successStatus && (
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-100 ${
                    progress === 100 ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <FaCheckCircle className="text-success text-4xl" />
                </div>
              )
            }
          ></CircularProgress>
        </div>

        <p className="text-sm text-foreground-300 mt-2">
          {t('rating-wait-message', { averageTime: '30-60' })}
        </p>

        <div className="tips mt-2 h-6 overflow-hidden text-xs text-foreground-200">
          <SwitchTransition>
            <CSSTransition
              key={currentTip}
              nodeRef={refs[currentTip]}
              timeout={1000}
              classNames="fade-down-in"
            >
              <div ref={refs[currentTip]}>{tips[currentTip]}</div>
            </CSSTransition>
          </SwitchTransition>
        </div>
      </div>
    )
  }
)

const CheckItem = memo(
  ({
    status,
    description,
    action,
  }: {
    status: 'success' | 'danger' | 'warning'
    description: string
    action?: () => void
  }) => {
    const t = useTranslations()

    return (
      <div className={`text-${status} flex items-center my-2`}>
        {status === 'success' && <FaRegCheckCircle />}
        {status === 'warning' && <RiErrorWarningLine />}
        {status === 'danger' && <IoCloseCircleOutline />}
        <span>{description}</span>
        {action && status === 'danger' && (
          <Link onPress={action} size="sm">
            {t('modify')}
          </Link>
        )}
      </div>
    )
  }
)

export default function RatingModal({
  open,
  onClose,
  ratingSetting,
  setRatingParams,
  articleMeta,
  outSourceRatingResult,
  getWritingTime,
  onViewInEditor,
}: {
  open: boolean
  onClose: any
  ratingSetting?: AiRateParams
  articleMeta?: EssayListVO
  setRatingParams?: any
  outSourceRatingResult?: {
    result: EssayFeedbackPartial | null
    input: AiRateParams | null
  } | null
  getWritingTime?: () => number
  onViewInEditor?: (inputText: string, result: EssayFeedbackPartial) => void
}) {
  const t = useTranslations()
  const [status, setStatus] = useState<'prepare' | 'pending' | 'success'>('prepare')
  const [ratingResult, setRatingResult] = useState<any>(null)
  const [loadingSuccess, setLoadingSuccess] = useState<boolean>(false)
  const [isNew, setIsNew] = useState<boolean>(false)

  const minCount = React.useMemo(
    () => limitMap[`${articleMeta?.article_grade}${articleMeta?.article_tasktype || ''}`],
    [articleMeta?.article_grade, articleMeta?.article_tasktype]
  )

  const wordCount = React.useMemo(
    () => ratingSetting?.content?.trim().split(' ').filter(Boolean).length || 0,
    [ratingSetting?.content]
  )

  const checkList = React.useMemo(
    () => [
      {
        key: 'grade',
        status: ratingSetting?.grade === articleMeta?.article_grade ? 'success' : 'danger',
        desc: {
          success: t('grade-match'),
          danger: t('grade-mismatch', { grade: t(articleMeta?.article_grade) }),
        },
        action: () => {
          setRatingParams({
            ...ratingSetting,
            grade: articleMeta?.article_grade,
          })
        },
      },
      {
        key: 'word',
        status: wordCount < 30 ? 'danger' : wordCount < minCount ? 'warning' : 'success',
        desc: {
          success: t('word-count-sufficient'),
          warning: t('word-count-warning', { current: wordCount, required: minCount }),
          danger: t('word-count-insufficient'),
        },
      },
    ],
    [ratingSetting, articleMeta, wordCount, minCount, t, setRatingParams]
  )

  async function startRating() {
    try {
      setStatus('pending')
      const writingTime = getWritingTime && getWritingTime()
      const { data } = await rateEssay({ ...ratingSetting, useTime: writingTime } as AiRateParams)
      setRatingResult({
        result: data,
        input: { ...ratingSetting, useTime: writingTime },
      })
      setLoadingSuccess(true)
    } catch (error) {
      setStatus('prepare')
      toast.error((error as Error).message)
      onError()
    } finally {
      setIsNew(true)
    }
  }

  function onSuccess() {
    setStatus('success')
  }

  function onError() {
    setStatus('prepare')
    setLoadingSuccess(false)
  }

  function handleViewInEditor() {
    if (onViewInEditor && ratingResult) {
      onViewInEditor(ratingResult?.input?.content || '', ratingResult?.result || {})
    }
    onClose(isNew)
  }

  const nodeRef = useRef(null)

  useEffect(() => {
    if (outSourceRatingResult) {
      setRatingResult(outSourceRatingResult)
      setStatus('success')
    }
  }, [outSourceRatingResult])

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open])

  function reset() {
    setRatingResult(null)
    setStatus('prepare')
    setLoadingSuccess(false)
    setIsNew(false)
  }

  function renderContent() {
    switch (status) {
      case 'prepare':
        return (
          <div className="h-full items-center justify-center">
            {checkList.map((item) => {
              const description = item.desc[item.status as keyof typeof item.desc] || ''

              return (
                <CheckItem
                  key={item.key}
                  status={item.status as 'success' | 'danger' | 'warning'}
                  description={description}
                  action={item.action}
                />
              )
            })}
          </div>
        )
      case 'pending':
        return (
          <div className="h-full items-center justify-center">
            <LoadingAnimation successStatus={loadingSuccess} onSuccess={onSuccess} />
          </div>
        )
      case 'success':
        return <RatingResult essayFeedBack={ratingResult.result} essayInput={ratingResult.input} />
      default:
        return null
    }
  }

  function renderFooter() {
    switch (status) {
      case 'prepare':
        return (
          <div>
            <Button onPress={onClose} size="sm" variant="solid" className="mr-2">
              {t('back-to-rewrite')}
            </Button>
            <Button
              size="sm"
              variant="solid"
              color="primary"
              isDisabled={wordCount < 30}
              onPress={startRating}
            >
              {t('start-rating')}
            </Button>
          </div>
        )
      case 'pending':
        return <p className="text-foreground-300 text-sm">{t('rating-in-progress')}</p>
      case 'success':
        return (
          <div className="flex items-center justify-center w-full">
            <Button
              onPress={handleViewInEditor}
              size="sm"
              variant="solid"
              className="mr-2"
              color="success"
            >
              {t('vieineditor')}
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Modal
      backdrop="blur"
      isOpen={open}
      onClose={() => onClose(isNew)}
      size="5xl"
      isDismissable={false}
      hideCloseButton={status === 'pending'}
      isKeyboardDismissDisabled={true}
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              {status === 'prepare' && t('rating-preparation')}
              {status === 'pending' && t('rating-in-progress')}
              {status === 'success' && t('rating-result')}
            </ModalHeader>
            <ModalBody>
              <div className="check min-h-[60vh] max-h-[80vh] flex flex-col">
                <SwitchTransition>
                  <CSSTransition
                    key={status}
                    nodeRef={nodeRef}
                    timeout={400}
                    classNames="fade-down-in"
                  >
                    <div
                      ref={nodeRef}
                      className="flex flex-col items-center justify-center min-h-[60vh] max-h-[80vh]"
                    >
                      {renderContent()}
                    </div>
                  </CSSTransition>
                </SwitchTransition>
              </div>
            </ModalBody>
            <ModalFooter>{renderFooter()}</ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
