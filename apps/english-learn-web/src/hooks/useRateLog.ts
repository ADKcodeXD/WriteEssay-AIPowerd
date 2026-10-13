import { getRateLogById, getRateLogByArticleId } from '@/api/aiproxy'
import { useStore } from '@/app/[locale]/context/StoreContext'
import { AiRateParams, EssayFeedbackPartial, Tables } from '@repo/entity-ts-definition'
import { useState, useEffect } from 'react'

export type RateLogType = Tables<'ratelog'> & {
  record_output: EssayFeedbackPartial
  record_input: AiRateParams
}

export function useRateLog(articleId: number, isCustom: boolean) {
  const { userStore } = useStore()
  const [rateLogList, setRateLogList] = useState<RateLogType[]>([])
  const [currentRateLog, setCurrentRateLog] = useState<RateLogType | null>(null)

  const searchParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  )

  const rateLogId = searchParams.get('rateLogId')

  const fetchRateLogList = async () => {
    if (isCustom) return
    const { data } = await getRateLogByArticleId(articleId)
    setRateLogList(data)
  }

  const fetchSingleRateLog = async (logId: string) => {
    const { data } = await getRateLogById(parseInt(logId))
    if (data) {
      setCurrentRateLog(data)
      return data
    }
    return null
  }

  useEffect(() => {
    if (rateLogId) {
      fetchSingleRateLog(rateLogId)
    }
  }, [rateLogId])

  useEffect(() => {
    if (!userStore.userInfo || !userStore.userInfo?.user_uuid) return
    fetchRateLogList()
  }, [userStore.userInfo])

  return {
    rateLogList,
    currentRateLog,
    setCurrentRateLog,
    fetchRateLogList,
    fetchSingleRateLog,
  }
}
