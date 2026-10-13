import { Button, Card, CardBody, CardFooter, CardHeader, Link } from "@heroui/react"
import { getMyStatistics } from '@/api/aiproxy'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { EssayStatistics } from '@repo/entity-ts-definition'
import { MdAutoGraph, MdHistoryEdu, MdTimer } from 'react-icons/md'
import { FaRankingStar } from 'react-icons/fa6'
import { formatRelativeTime, formatShortTime, formatTimeByFormat } from '@/utils'
import Loading from '../../components/Loading'
import { RadarChartPure } from '../../components/Graph/RadarChart'
import { LineChartPure } from '../../components/Graph/LineChart'
import ViewRecordModal from '../../components/RatingResult/ViewRecordModal'

const Dashboard = ({
  statistics,
  onGradeChange,
}: {
  statistics?: EssayStatistics
  onGradeChange: (grade: string) => void
}) => {
  const gradeList = ['ielts']
  const locale = useLocale()
  const t = useTranslations()
  const [currentGrade, setCurrentGrade] = useState('ielts')
  const [resultReport, setResultReport] = useState<any>(null)
  const [viewRecordModalOpen, setViewRecordModalOpen] = useState(false)

  const cardList = [
    {
      title: t('total-essays'),
      value: `${statistics?.totalEssays}${t('times')}`,
      color: 'text-primary-600',
      icon: <MdHistoryEdu size={16} className="text-primary-600" />,
    },
    {
      title: t('highest-score'),
      value: `${statistics?.highestScore}${t('points')}`,
      color: 'text-yellow-500',
      icon: <FaRankingStar size={16} className="text-yellow-500" />,
    },
    {
      title: t('average-score'),
      value: `${statistics?.averageOverallScore.toFixed(2)}${t('points')}`,
      color: 'text-secondary-600',
      icon: <MdAutoGraph size={16} className="text-secondary-600" />,
    },
    {
      title: t('average-duration'),
      value: formatShortTime(parseInt(statistics?.averageTime.toString() || '0')),
      color: 'text-success-600',
      icon: <MdTimer size={16} className="text-success-600" />,
    },
  ]

  const lineChartData = useMemo(() => {
    return statistics?.echartsData.series.map((item) => {
      return {
        series: item.data,
        name: t(item.key),
      }
    })
  }, [statistics])

  const radarChartData = useMemo(() => {
    return [
      statistics?.averageSubScores.taskAchievement.toFixed(2),
      statistics?.averageSubScores.coherence.toFixed(2),
      statistics?.averageSubScores.lexicalResource.toFixed(2),
      statistics?.averageSubScores.grammaticalRangeAccuracy.toFixed(2),
    ]
  }, [statistics])

  const viewReport = (essay: any) => {
    setResultReport({
      result: essay.record_output,
      input: essay.record_input,
    })
    setViewRecordModalOpen(true)
  }

  useEffect(() => {
    onGradeChange && onGradeChange(currentGrade)
  }, [currentGrade])

  return (
    <div className="w-full h-full max-h-screen flex flex-col">
      {statistics && (
        <>
          <div className="chip-tab mb-2">
            {gradeList.map((grade) => (
              <Button
                color="primary"
                variant={currentGrade === grade ? 'solid' : 'bordered'}
                key={grade}
                className="cursor-pointer"
                radius="full"
                size="sm"
                onClick={() => setCurrentGrade(grade)}
              >
                {t(grade)}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2">
            {cardList.map((card) => {
              return (
                <Card isPressable className={`h-28 ${card.color}`} key={card.title}>
                  <CardHeader className="text-xs flex gap-2">
                    {card.icon}
                    {card.title}
                  </CardHeader>
                  <CardBody className="flex">
                    <p className="text-4xl font-bold">{card.value}</p>
                  </CardBody>
                </Card>
              )
            })}
          </div>
          <div className="my-4 grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Card isPressable>
              <CardHeader>{t('recent-trend')}</CardHeader>
              <CardBody>
                <LineChartPure data={lineChartData as any} />
              </CardBody>
            </Card>
            <Card isPressable>
              <CardHeader className="flex flex-col items-start">
                <p>{t('ability-chart')}</p>
                <p className="text-xs text-foreground-400">{t('ability-chart-desc')}</p>
              </CardHeader>
              <CardBody>
                <RadarChartPure scoreList={radarChartData} />
              </CardBody>
            </Card>
          </div>
          {statistics.lastEssay && (
            <div className="flex flex-col">
              <p className="text-2xl first-letter:text-4xl text-foreground">
                {formatRelativeTime(statistics.lastEssay?.created_at || new Date(), locale)}
                <span className="text-foreground-800 ml-2">
                  {t('last-essay')}
                  <span className="text-warning-500 font-bold text-4xl mx-2">
                    {(statistics.lastEssay?.record_output as any)?.score?.overall}
                  </span>
                  {t('points')}
                </span>
              </p>
              <span className="text-foreground-400">{t('article-content')}</span>
              <Card className="mt-4" isPressable>
                <CardBody>
                  <p className="line-clamp-2">
                    {(statistics.lastEssay?.record_input as any)?.content}
                  </p>
                </CardBody>
                <CardFooter className="flex justify-end text-sm p-2">
                  <Link onClick={() => viewReport(statistics.lastEssay)}>{t('view-report')}</Link>
                </CardFooter>
              </Card>
            </div>
          )}
          {statistics.highestScoreEssay && (
            <div className="flex flex-col my-2">
              <p className="text-2xl first-letter:text-4xl text-foreground">
                <span className="text-foreground-800">
                  {t('best-score')}
                  <span className="text-warning-500 font-bold text-4xl mx-2">
                    {(statistics.highestScoreEssay?.record_output as any)?.score?.overall}
                  </span>
                  {t('points')}
                </span>
                <span className="text-foreground-600 text-xl ml-2">
                  {t('completed-at')}
                  {formatTimeByFormat(
                    statistics.highestScoreEssay?.created_at || new Date(),
                    locale
                  )}
                </span>
              </p>
              <span className="text-foreground-400">{t('article-content')}</span>
              <Card className="mt-4" isPressable>
                <CardBody>
                  <p className="line-clamp-2">
                    {(statistics.highestScoreEssay?.record_input as any)?.content}
                  </p>
                </CardBody>
                <CardFooter className="flex justify-end text-sm p-2">
                  <Link onClick={() => viewReport(statistics.highestScoreEssay)}>
                    {t('view-report')}
                  </Link>
                </CardFooter>
              </Card>
            </div>
          )}
        </>
      )}
      {!statistics && <Loading />}
      {resultReport && (
        <ViewRecordModal
          open={viewRecordModalOpen}
          onClose={() => setViewRecordModalOpen(false)}
          ratingResult={resultReport}
        />
      )}
    </div>
  )
}

export default Dashboard
