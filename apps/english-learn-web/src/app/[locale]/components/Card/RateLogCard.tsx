import { formatRelativeTime, getColorByScore } from '@/utils'
import { Card, CardBody, CardFooter, CardHeader, Chip, Link } from "@heroui/react"
import { RateLog } from '@repo/entity-ts-definition'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import { GiStarShuriken } from 'react-icons/gi'
import { MdOutlineAbc, MdOutlineArticle, MdOutlineTaskAlt } from 'react-icons/md'
import ViewRecordModal from '../RatingResult/ViewRecordModal'

export default function RateLogCard({ rateLog }: { rateLog?: RateLog }) {
  const textColor = getColorByScore(rateLog?.record_output?.score?.overall || 0, true)
  const t = useTranslations()

  const [viewRecordModalOpen, setViewRecordModalOpen] = useState(false)
  const [resultReport, setResultReport] = useState<{
    result: any
    input: any
  } | null>(null)

  const viewReport = () => {
    setResultReport({
      result: rateLog?.record_output,
      input: rateLog?.record_input,
    })
    setViewRecordModalOpen(true)
  }

  return (
    <Card className="w-full h-40 max-md:h-72" isPressable>
      <p
        className={`w-24 flex flex-col items-center text-5xl font-bold absolute top-1/2 transform -translate-y-1/2 left-6 ${textColor} border-2 rounded-xl p-4 border-foreground-500`}
      >
        <span className={`text-xs ${textColor}`}>{t('overall')}</span>
        {rateLog?.record_output?.score?.overall || 0}
      </p>
      <CardHeader className="inline pl-40 text-start line-clamp-2 py-2">
        {rateLog?.record_input?.grade && (
          <Chip variant="bordered" color="warning" size="sm" className="mx-1">
            {t(rateLog?.record_input?.grade || '')}
          </Chip>
        )}
        {rateLog?.record_input?.taskType && (
          <Chip
            variant="faded"
            color={rateLog?.record_input?.taskType === 1 ? 'primary' : 'secondary'}
            size="sm"
            className="mx-1"
          >
            {t('task')}-{rateLog?.record_input?.taskType}
          </Chip>
        )}
        {!rateLog?.record_input?.article_id && (
          <Chip variant="dot" color="secondary" size="sm" className="mx-1">
            {t('custom')}
          </Chip>
        )}
        {rateLog?.record_input?.title && (
          <span className="text-xs text-foreground-600 text-start max-md:line-clamp-2">
            {t('title')}: {rateLog?.record_input?.title}
          </span>
        )}
      </CardHeader>
      <CardBody className="flex gap-2 pl-40 py-1 flex-1">
        <span className="text-xs text-foreground-600 text-start line-clamp-2">
          {t('your-essay')}: {rateLog?.record_input?.content}
        </span>
      </CardBody>
      <CardFooter className="flex justify-between gap-2 pl-40 py-2 max-md:flex-col max-md:items-start">
        <div className="max-md:grid max-md:grid-cols-1 gap-2 flex flex-wrap">
          <Chip
            size="sm"
            startContent={<MdOutlineTaskAlt />}
            className={`text-xs ${getColorByScore(rateLog?.record_output?.score?.taskAchievement || 0, true)}`}
          >
            {t('taskAchievement')}: {rateLog?.record_output?.score?.taskAchievement || 0}
          </Chip>
          <Chip
            size="sm"
            startContent={<GiStarShuriken />}
            className={`text-xs ${getColorByScore(rateLog?.record_output?.score?.lexicalResource || 0, true)}`}
          >
            {t('lexicalResource')}: {rateLog?.record_output?.score?.lexicalResource || 0}
          </Chip>
          <Chip
            size="sm"
            startContent={<MdOutlineAbc />}
            className={`text-xs ${getColorByScore(rateLog?.record_output?.score?.grammaticalRangeAccuracy || 0, true)}`}
          >
            {t('grammaticalRangeAccuracy')}:{' '}
            {rateLog?.record_output?.score?.grammaticalRangeAccuracy || 0}
          </Chip>
          <Chip
            size="sm"
            startContent={<MdOutlineArticle />}
            className={`text-xs ${getColorByScore(rateLog?.record_output?.score?.coherence || 0, true)}`}
          >
            {t('coherence')}: {rateLog?.record_output?.score?.coherence || 0}
          </Chip>
        </div>

        <div className="flex gap-2">
          <span className="text-xs text-foreground-400">
            {t('completed-at')}: {formatRelativeTime(rateLog?.created_at || new Date())}
          </span>
          <Link
            className="cursor-pointer text-xs"
            href={`/write/${rateLog?.record_input?.article_id || 'custom'}?rateLogId=${rateLog?.id}`}
          >
            {t('view-detail')}
          </Link>
          <Link className="cursor-pointer text-xs" onClick={viewReport}>
            {t('view-report')}
          </Link>
        </div>
      </CardFooter>
      {resultReport && (
        <ViewRecordModal
          open={viewRecordModalOpen}
          onClose={() => setViewRecordModalOpen(false)}
          ratingResult={resultReport}
        />
      )}
    </Card>
  )
}
