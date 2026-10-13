import React, { useEffect, useState } from 'react'
import RateLogCard from '../../components/Card/RateLogCard'
import { useStore } from '../../context/StoreContext'
import { PageQueryParams, RateLog } from '@repo/entity-ts-definition'
import { Pagination, Skeleton } from "@heroui/react"
import EmptyContent from '../../components/EmptyContent'
import { useTranslations } from 'next-intl'
export default function History() {
  const t = useTranslations()
  const { dashboardStore } = useStore()
  const [rateLogs, setRateLogs] = useState<RateLog[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pageParams, setPageParams] = useState({
    page: 1,
    pageSize: 10,
    orderAccrodBy: 'date',
    sortType: 'desc',
  })

  const totalPage = Math.ceil(count / pageParams.pageSize)

  useEffect(() => {
    setLoading(true)
    dashboardStore
      .fetchMyRateLog(pageParams as PageQueryParams)
      .then(() => {
        setRateLogs((dashboardStore.myRateLog?.rows as any) || [])
        setCount(dashboardStore.myRateLog?.count || 0)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [pageParams, dashboardStore])

  return (
    <div className="w-full h-full max-h-screen flex flex-col">
      <p className="text-xl font-bold mb-1">{t('record')}</p>
      <p className="text-xs text-foreground-500 mb-2">
        {t('view-detail')}
        <span className="text-foreground-500">
          {t('total-essays')}: {count}
          {t('times')}
        </span>
      </p>
      <div className="ratelist flex flex-col gap-4">
        {rateLogs.length > 0 &&
          !loading &&
          rateLogs.map((rateLog) => <RateLogCard rateLog={rateLog} key={rateLog.id} />)}
        {loading && <Skeleton className="w-full h-[100px] rounded-lg" />}
        {rateLogs.length === 0 && !loading && (
          <EmptyContent title={t('no-content')} description={t('nodata-sub')} />
        )}
        <Pagination
          total={totalPage}
          page={pageParams.page}
          initialPage={1}
          showShadow
          className="my-2 self-end"
          onChange={(page) => setPageParams({ ...pageParams, page })}
        />
      </div>
    </div>
  )
}
