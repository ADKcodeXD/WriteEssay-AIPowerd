'use client'
import { getEssayDetail } from '@/api/essay'
import {
  AiRateParams,
  EssayFeedbackPartial,
  EssayListVO,
  Grade,
  LocaleCode,
  Score,
  Tables,
} from '@repo/entity-ts-definition'
import React, { memo, useEffect, useRef, useState, useMemo } from 'react'
import Loading from '../../components/Loading'
import { useLocale, useTranslations } from 'next-intl'
import {
  Accordion,
  AccordionItem,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Image,
  Link,
  Progress,
  Textarea,
} from '@heroui/react'
import { FaCheckCircle, FaImage, FaTimes } from 'react-icons/fa'
import { IoTimerOutline } from 'react-icons/io5'
import { EssayTags } from '../../components/Card/EssayCard'
import EssayEditor from '../../components/EssayEditor'
import RatingSettingModal from '../../components/RatingSettingModal'
import EmptyContent from '../../components/EmptyContent'
import RatingModal from '../../components/RatingModal'
import { caclateWordByInput, formatRelativeTime, maxScoreMap } from '@/utils'
import { useUpload } from '@/hooks/useUpload'
import { useRateLog } from '@/hooks/useRateLog'
import { useStore } from '../../context/StoreContext'
import { useRouter } from '@/i18n/routing'

// 将RateLogItem抽离为单独的组件，减少主组件的渲染负担
const RateLogItem = memo(
  ({
    item,
    index,
    locale,
    openResultModal,
  }: {
    item: Tables<'ratelog'>
    index: number
    locale: string
    openResultModal: (item: Tables<'ratelog'>) => void
  }) => {
    const t = useTranslations()

    // 安全地访问嵌套属性
    const model =
      item.record_input && typeof item.record_input === 'object'
        ? (item.record_input as any).model
        : ''
    const content =
      item.record_input && typeof item.record_input === 'object'
        ? (item.record_input as any).content
        : ''
    const overallScore =
      item.record_output && typeof item.record_output === 'object'
        ? (item.record_output as any).score?.overall
        : ''

    return (
      <Card
        key={item.id}
        isPressable
        className="w-full my-2 p-0 shadow-none border-solid border-foreground-200 border-1"
      >
        <CardHeader className="p-2 flex justify-between">
          #{index + 1}
          <Chip size="sm" variant="solid" color="primary" className="text-xs">
            {model}
          </Chip>
        </CardHeader>
        <CardBody className="p-2 text-sm">
          <div className="flex items-center flex-wrap text-xs text-foreground-800">
            <div>Overall Band:{overallScore}</div>
            {content && (
              <p className="ml-2">
                {t('words')}: {caclateWordByInput(content)}
              </p>
            )}
          </div>
        </CardBody>
        <CardFooter className="text-sm flex justify-between p-2 text-foreground-400">
          <div className="flex items-center">
            {formatRelativeTime(item.created_at || '', locale)}
          </div>
          <Link size="sm" className="cursor-pointer text-xs" onClick={() => openResultModal(item)}>
            {t('view-detail')}
          </Link>
        </CardFooter>
      </Card>
    )
  }
)

// 将ScoreProgress抽离为单独的组件
const ScoreProgress = memo(
  ({ label, value, maxValue }: { label: string; value: number; maxValue: number }) => {
    const t = useTranslations()

    return (
      <Progress
        label={t(label)}
        size="sm"
        value={value || 0}
        maxValue={maxValue || 9}
        color="warning"
        formatOptions={{ style: 'decimal' }}
        showValueLabel={true}
        className="max-w-md"
      />
    )
  }
)

const WritePageContent = memo(({ params }: { params: { id: string } }) => {
  const locale = useLocale()
  const t = useTranslations()
  const router = useRouter()

  const [essayDetail, setEssayDetail] = useState<EssayListVO | null>()
  const [ratingParams, setRatingParams] = useState<AiRateParams>()
  const [currentRatingResult, setCurrentRatingResult] = useState<{
    result: EssayFeedbackPartial | null
    input: AiRateParams | null
  } | null>(null)

  const id = parseInt(params.id?.toString() || '') as number
  const isCustom = isNaN(id)

  const { rateLogList, currentRateLog, setCurrentRateLog, fetchRateLogList } = useRateLog(
    id,
    isCustom
  )
  const { fileInputRef, handleUpload, isUploading, onUploadFile, fileList, removeFile } =
    useUpload()

  const [essayContainerHeight, setEssayContainerHeight] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const { userStore } = useStore()

  const container = useRef<HTMLDivElement | null>(null)
  const topArea = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<any>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const labelList = useMemo(
    () => ['taskAchievement', 'coherence', 'lexicalResource', 'grammaticalRangeAccuracy'],
    []
  )

  const rulesMap = useMemo(
    () =>
      ({
        ielts2: (
          <div className="text-xs">
            <p className="my-4">{t('ielts2-1')}</p>
            <p className="my-4">{t('ielts2-2')}</p>
            <p className="my-4">{t('ielts2-3')}</p>
            <p className="my-4">{t('ielts2-4')}</p>
          </div>
        ),
      }) as Record<string, React.ReactNode>,
    [t]
  )

  // 获取规则内容的安全方法
  const getRuleContent = (grade: string | undefined | null, taskType?: number | null) => {
    if (!grade) return null
    const key = `${grade}${taskType || ''}`
    return rulesMap[key] || null
  }

  // 优化高度计算，减少不必要的计算和DOM访问
  const updateEssayContainerHeight = () => {
    if (!container.current || !topArea.current) return

    const containerHeight = container.current.clientHeight
    const topAreaHeight = topArea.current.clientHeight
    const viewportHeight = window.innerHeight
    const isMobile = window.matchMedia('(max-width: 768px)').matches

    let newHeight = containerHeight - topAreaHeight

    if (isMobile && containerHeight > viewportHeight * 0.75) {
      newHeight = viewportHeight * 0.75 - topAreaHeight
    }

    // 移除阈值检查，确保任何高度变化都能得到响应
    setEssayContainerHeight(newHeight)
  }

  const handleGradeChange = (key: any) => {
    setRatingParams((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        grade: key as Grade,
      }
    })
    setEssayDetail((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        article_grade: key as Grade,
      }
    })
  }

  // 使用memo缓存文件列表渲染，避免不必要的重新渲染
  const renderFileList = useMemo(
    () => (
      <div className="image-container flex flex-wrap gap-2 mt-2">
        {fileList.map((url) => (
          <div className="relative" key={url}>
            <Image src={url} alt="uploaded" className="h-24" isZoomed />
            <Button
              isIconOnly
              size="sm"
              className="absolute top-0 right-0 z-10"
              onClick={() => removeFile(url)}
            >
              <FaTimes />
            </Button>
          </div>
        ))}
      </div>
    ),
    [fileList, removeFile]
  )

  const fetchEssayDetail = async () => {
    if (isCustom) {
      setEssayDetail({
        article_source: 'custom',
        article_grade: 'ielts',
        article_tasktype: 2,
        article_title: '',
      } as any)
      setRatingParams({
        model: 'gemini-3.8-flash',
        grade: 'ielts',
        title: '',
        content: '',
        taskType: 2,
        locale: locale as LocaleCode,
      })
      return
    }
    const { data } = await getEssayDetail(id)
    setEssayDetail(data)
    setRatingParams({
      model: 'gemini-3.8-flash',
      article_id: data?.id,
      grade: data?.article_grade as any,
      title: data?.article_title || '',
      content: '',
      taskType: data?.article_tasktype ? (data.article_tasktype as 1 | 2) : 2,
      locale: locale as LocaleCode,
    })
  }

  const setTaskType = (key: any) => {
    setRatingParams((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        taskType: key as 1 | 2,
      }
    })
    setEssayDetail((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        article_tasktype: key as 1 | 2,
      }
    })
  }

  const getWritingTime = () => {
    if (!editorRef.current) return 0
    return editorRef.current?.getWritingTime() || 0
  }

  const openResultModal = (ratingResult: Tables<'ratelog'>) => {
    setCurrentRatingResult({
      result: ratingResult.record_output as any,
      input: ratingResult.record_input as any,
    })
    setIsRatingModalOpen(true)
  }

  const closeRatingModal = (isNew: boolean = false) => {
    setIsRatingModalOpen(false)
    setCurrentRatingResult(null)
    if (isNew) {
      fetchRateLogList()
    }
  }

  const onViewInEditor = (inputText: string, result: EssayFeedbackPartial) => {
    if (editorRef.current) {
      editorRef.current.updateContentAndMark(inputText, result)
      setIsRatingModalOpen(false)
    }
  }

  const startRating = () => {
    if (userStore.userInfo) {
      setIsRatingModalOpen(true)
    } else {
      router.push('/login', { locale })
    }
  }

  // 处理标题变更，减少不必要的状态更新
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setRatingParams((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        title: newTitle,
      }
    })
  }

  // 处理内容变更，减少不必要的状态更新
  const handleContentChange = (text?: string) => {
    setRatingParams((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        content: text || '',
      }
    })
  }

  useEffect(() => {
    fetchEssayDetail()
  }, [params.id])

  useEffect(() => {
    // 每次在组件挂载或重新渲染时都创建新的ResizeObserver
    // 这确保了observer总是使用最新的updateEssayContainerHeight函数
    const observer =
      typeof window !== 'undefined' ? new ResizeObserver(updateEssayContainerHeight) : null

    if (topArea.current && observer) {
      observer.observe(topArea.current)
    }

    // 添加窗口大小变化的监听，确保编辑区能响应窗口大小变化
    window.addEventListener('resize', updateEssayContainerHeight)

    // 初始化时手动触发一次高度计算
    updateEssayContainerHeight()

    return () => {
      if (observer) {
        observer.disconnect()
      }
      window.removeEventListener('resize', updateEssayContainerHeight)
    }
  }, [updateEssayContainerHeight]) // 保持依赖为空数组，但确保内部使用最新的状态和函数

  useEffect(() => {
    if (!isRatingModalOpen) {
      setCurrentRatingResult(null)
    }
  }, [isRatingModalOpen])

  // 优化fileList依赖，减少不必要的状态更新
  useEffect(() => {
    if (fileList.length > 0) {
      setRatingParams((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          imageList: fileList,
          taskType: 1,
        }
      })
      setEssayDetail((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          article_tasktype: 1,
        }
      })
    }
  }, [fileList])

  useEffect(() => {
    if (currentRateLog) {
      onViewInEditor(currentRateLog.record_input.content, currentRateLog.record_output as any)
    } else if (rateLogList && rateLogList.length) {
      setCurrentRateLog(rateLogList[0])
    }
  }, [currentRateLog, rateLogList])

  return (
    <>
      {essayDetail ? (
        <div className="w-full flex h-full justify-end max-md:flex-col max-md:overflow-auto max-md:h-fit">
          <div className="flex-1 flex items-center justify-center max-md:w-full">
            <div
              className="p-4 w-full max-w-screen-md h-full flex flex-col min-h-[75vh]"
              ref={container}
            >
              <div className="essay-info flex flex-col" ref={topArea}>
                {!isCustom && (
                  <>
                    <div className="flex gap-2 items-center">
                      <Chip variant="bordered" color="warning" className="inline-flex">
                        {t(essayDetail.article_grade)}
                      </Chip>
                      <Chip
                        variant="faded"
                        color={essayDetail.article_tasktype === 1 ? 'primary' : 'secondary'}
                        className="inline-flex"
                        v-if="essayDetail.article_tasktype"
                      >
                        Task-{essayDetail.article_tasktype}
                      </Chip>
                      {essayDetail.isWrited || rateLogList.length > 0 ? (
                        <Chip
                          startContent={<FaCheckCircle size={14} />}
                          variant="solid"
                          color="success"
                        >
                          {t('done')}
                        </Chip>
                      ) : (
                        <Chip
                          startContent={<IoTimerOutline size={14} />}
                          variant="bordered"
                          color="default"
                        >
                          {t('uncompelely')}
                        </Chip>
                      )}
                    </div>
                    <p className="text-large font-bold my-2">
                      {essayDetail.article_shortcut &&
                        essayDetail.article_shortcut[
                          locale as keyof typeof essayDetail.article_shortcut
                        ]}
                    </p>
                    <p className="my-2 break-words font-mono text-medium text-foreground-900 first-letter:text-xl">
                      {essayDetail.article_title}
                    </p>
                    <EssayTags tags={essayDetail.article_tag || []} />
                  </>
                )}
                {isCustom && (
                  <div className="my-2 text-medium text-foreground-900 w-full flex-col flex">
                    <div className="flex gap-2">
                      <Dropdown placement="bottom-start">
                        <DropdownTrigger>
                          <Chip
                            variant="bordered"
                            color="warning"
                            className="inline-flex mb-2 cursor-pointer"
                          >
                            {t(essayDetail.article_grade)}
                          </Chip>
                        </DropdownTrigger>
                        <DropdownMenu
                          aria-label="grade Actions"
                          variant="flat"
                          selectedKeys={[essayDetail.article_grade || '']}
                          onAction={handleGradeChange}
                        >
                          <DropdownItem key="ielts">
                            <p className="font-semibold">{t('ielts')}</p>
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                      <Dropdown placement="bottom-start">
                        <DropdownTrigger>
                          <Chip
                            variant="faded"
                            color={essayDetail.article_tasktype === 1 ? 'primary' : 'secondary'}
                            className="inline-flex"
                          >
                            Task-{essayDetail.article_tasktype}
                          </Chip>
                        </DropdownTrigger>
                        <DropdownMenu
                          aria-label="grade Actions"
                          variant="flat"
                          selectedKeys={[essayDetail.article_tasktype || 1]}
                          onAction={setTaskType}
                        >
                          <DropdownItem key={1}>
                            <p className="font-semibold">Task-1</p>
                          </DropdownItem>
                          <DropdownItem key={2}>
                            <p className="font-semibold">Task-2</p>
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>

                    <Textarea
                      variant="faded"
                      label={t('essay-topic')}
                      minRows={1}
                      maxRows={6}
                      rows={2}
                      placeholder={t('inputyouwant')}
                      description={t('custommise')}
                      className="w-full"
                      onChange={handleTitleChange}
                    />
                    <div className="oper-list">
                      <Button
                        color="primary"
                        variant="ghost"
                        startContent={<FaImage />}
                        size="sm"
                        isLoading={isUploading}
                        onClick={handleUpload}
                      >
                        {t('uploadImage')}
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={onUploadFile}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                    </div>
                    {renderFileList}
                  </div>
                )}
                <Divider className="my-2 opacity-50" />
              </div>
              <div className="mt-2 flex-1">
                <EssayEditor
                  ref={editorRef}
                  height={essayContainerHeight}
                  content={ratingParams?.content || ''}
                  title={essayDetail.article_title || ''}
                  taskType={essayDetail.article_tasktype || 2}
                  onUpdateContent={handleContentChange}
                  grade={essayDetail.article_grade as Grade}
                />
              </div>
            </div>
          </div>

          <div className="p-4 flex flex-col w-96 h-full justify-between max-md:w-full max-md:h-fit">
            <div className="flex flex-col">
              <Accordion variant="splitted" className="m-0 p-0 w-full" isCompact>
                <AccordionItem aria-label={t('writing-rules')} title={t('writing-rules')}>
                  {getRuleContent(essayDetail.article_grade, essayDetail.article_tasktype)}
                </AccordionItem>
                {!isCustom &&
                  ((
                    <AccordionItem aria-label={t('record')} title={t('record')}>
                      {rateLogList && rateLogList.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto p-2">
                          {rateLogList.map((item, index) => (
                            <RateLogItem
                              key={item.id}
                              item={item}
                              index={index}
                              locale={locale}
                              openResultModal={openResultModal}
                            />
                          ))}
                        </div>
                      ) : (
                        <EmptyContent />
                      )}
                    </AccordionItem>
                  ) as any)}
              </Accordion>
              {currentRateLog && (
                <Card className="mt-4">
                  <CardHeader>{t('shang-ci-ping-fen-cheng-ji')}</CardHeader>
                  <CardBody className="flex flex-col gap-1">
                    {labelList.map((item) => (
                      <ScoreProgress
                        key={item}
                        label={item}
                        value={currentRateLog.record_output?.score?.[item as keyof Score] || 0}
                        maxValue={maxScoreMap(currentRateLog.grade as Grade) || 9}
                      />
                    ))}
                  </CardBody>
                  <CardFooter>
                    <Link
                      size="sm"
                      className="cursor-pointer text-xs"
                      onClick={() =>
                        onViewInEditor(
                          currentRateLog.record_input.content,
                          currentRateLog.record_output as any
                        )
                      }
                    >
                      {t('view-detail')}
                    </Link>
                  </CardFooter>
                </Card>
              )}
            </div>

            <div className="justify-end self-end flex flex-col items-end max-md:mt-4">
              <Button variant="solid" color="primary" onClick={startRating}>
                {t('start-rating')}
              </Button>
              <Link size="sm" className="cursor-pointer mt-2" onClick={() => setIsModalOpen(true)}>
                {t('rating-setting')}
              </Link>
            </div>
          </div>

          <RatingSettingModal
            open={isModalOpen}
            ratingSetting={ratingParams}
            setRatingParams={setRatingParams}
            onClose={() => setIsModalOpen(false)}
          />
          {essayDetail && (
            <RatingModal
              open={isRatingModalOpen}
              ratingSetting={ratingParams}
              setRatingParams={setRatingParams}
              getWritingTime={getWritingTime}
              articleMeta={essayDetail}
              outSourceRatingResult={currentRatingResult}
              onClose={closeRatingModal}
              onViewInEditor={onViewInEditor}
            />
          )}
        </div>
      ) : (
        <Loading />
      )}
    </>
  )
})

// Ensure that WritePageContent is wrapped with memo
export default function page({ params }: { params: { id: string } }) {
  return <WritePageContent params={params} />
}
