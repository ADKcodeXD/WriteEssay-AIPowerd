import { limitMap } from '@/utils'
import { CircularProgress, Tooltip } from "@heroui/react"
import { Grade } from '@repo/entity-ts-definition'
import { useTranslations } from 'next-intl'
import { memo, useMemo } from 'react'
import { BsSpellcheck } from 'react-icons/bs'

const WordLimit = memo(
  ({
    grade,
    words,
    process,
    taskType,
  }: {
    grade?: Grade | undefined
    words: number
    process: number
    taskType: number
  }) => {
    const t = useTranslations()
    const processLabel = useMemo(() => {
      if (process > 0 && process < 30) return 'danger'
      else if (process > 30 && process < 60) return 'warning'
      else if (process > 60 && process < 100) return 'primary'
      else return 'success'
    }, [process])

    return (
      <Tooltip content={t('variety-article')} showArrow>
        <div className="mr-4 flex items-center">
          <span className="dot rounded-full w-2 h-2 bg-secondary-600 mr-1"></span>
          <BsSpellcheck className="mr-2" />
          {words} / {limitMap[`${grade}${taskType || ''}` || 'ielts1']} {t('words')}
          <CircularProgress
            size="sm"
            className="h-6 ml-2"
            aria-label="process"
            value={process}
            color={processLabel}
            showValueLabel={true}
          />
        </div>
      </Tooltip>
    )
  }
)

export default WordLimit
