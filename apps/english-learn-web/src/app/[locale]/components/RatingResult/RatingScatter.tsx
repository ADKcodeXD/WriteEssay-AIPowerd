import { Card, CardHeader, CardBody } from "@heroui/react"
import { useLocale, useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useRef, useEffect } from 'react'
import scoreData from '@/assets/scoreIelts.json'
import * as echarts from 'echarts'
import dark from '@/assets/dark'
import shine from '@/assets/shine'

export const localeMap: Record<string, string> = {
  ja: 'Japan',
  'zh-CN': 'China',
  en: 'Global',
}

export const scoreMap: any = {
  ielts: {
    excellent: 9,
    good: 7,
    average: 6,
    notbad: 5,
    poor: 4,
    bad: 3,
    noneSense: 0,
  },
}

export const ScoreDistribution = ({ score }: { score: number }) => {
  const chartRef = useRef(null)
  const locale = useLocale()
  const t = useTranslations()
  const { theme } = useTheme()
  const getDistributionData = () => {
    if (locale === 'en') {
      const totalDistribution = scoreData.reduce(
        (acc, country) => {
          Object.entries(country).forEach(([key, value]) => {
            if (key !== 'Nationality') {
              acc[key] = (acc[key] || 0) + parseFloat(value as string)
            }
          })
          return acc
        },
        {} as Record<string, number>
      )

      const total = Object.values(totalDistribution).reduce((sum, value) => sum + value, 0)
      Object.keys(totalDistribution).forEach((key) => {
        totalDistribution[key] = (totalDistribution[key] / total) * 100
      })

      return totalDistribution
    } else {
      const countryData = scoreData.find(
        (country) =>
          country.Nationality.toLowerCase() === localeMap[locale as keyof typeof localeMap]
      )
      return countryData || scoreData[0] // Default to first country if not found
    }
  }

  useEffect(() => {
    if (chartRef.current) {
      const chart = echarts.init(chartRef.current, theme === 'dark' ? dark : shine)

      const distributionData = getDistributionData()

      const scoreCategories = [
        'Below 4',
        '4',
        '4.5',
        '5',
        '5.5',
        '6',
        '6.5',
        '7',
        '7.5',
        '8',
        '8.5',
        '9',
      ]

      const option = {
        grid: {
          top: '8%',
          right: '3%',
          bottom: '2%',
          left: '3%',
          containLabel: true,
        },
        tooltip: {
          trigger: 'axis',
          formatter: function (params: any) {
            const dataIndex = params[0].dataIndex
            const score = scoreCategories[dataIndex]
            const percentage = params[0].value.toFixed(2)
            return t('score-tooltip', { score, percentage })
          },
          axisPointer: {
            type: 'shadow',
          },
          confine: true,
        },
        xAxis: {
          type: 'category',
          data: scoreCategories,
          axisLine: { show: false },
          axisTick: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
        },
        series: [
          {
            data: Object.entries(distributionData)
              .filter(([key]) => key !== 'Nationality')
              .sort(([a], [b]) => {
                if (a === 'Below 4') return -1
                if (b === 'Below 4') return 1
                return parseFloat(a) - parseFloat(b)
              })
              .map(([key, value]) => ({
                value: parseFloat(value as string),
                itemStyle: {
                  color:
                    parseFloat(key) === score || (key === 'Below 4' && score < 4)
                      ? '#ff4d4f' // 高亮颜色
                      : '#1890ff', // 默认颜色
                  borderRadius: [8, 8, 0, 0], // 添加这一行来使柱子顶部变圆
                },
                emphasis: {
                  itemStyle: {
                    color:
                      parseFloat(key) === score || (key === 'Below 4' && score < 4)
                        ? '#ff7875'
                        : '#40a9ff',
                    borderRadius: [8, 8, 0, 0],
                  },
                },
                label: {
                  show: parseFloat(key) === score || (key === 'Below 4' && score < 4),
                  position: 'top',
                  formatter: t('youarehere'),
                  color: '#ff4d4f',
                  fontSize: 10,
                },
              })),
            type: 'bar',
            barWidth: '75%', // 可以调整这个值来改变柱子的宽度
          },
        ],
      }

      chart.setOption(option)
      return () => {
        chart.dispose()
      }
    }
  }, [locale, score, chartRef])

  // 计算当前分数的占比
  const cumulativePercentage = Object.entries(getDistributionData())
    .filter(([key]) => key !== 'Nationality')
    .reduce((sum, [key, value]) => {
      if ((score < 4 && key === 'Below 4') || (score >= 4 && parseFloat(key) <= score)) {
        return sum + parseFloat(value as string)
      }
      return sum
    }, 0)

  const topPercentage = cumulativePercentage.toFixed(2)

  return (
    <Card isPressable className="p-2 flex flex-col h-[240px] min-w-[300px] flex-1">
      <CardHeader className="flex flex-col items-start">
        <p className="text-lg text-foreground">{t('score-distribution')}</p>
        <p className="text-sm text-foreground-400">{t('score-distribution-desc')}</p>
      </CardHeader>
      <CardBody>
        <div className="relative w-full h-[192px] mt-4">
          <div ref={chartRef} className="w-full h-full" />
        </div>
        <p className="text-sm text-foreground-400">
          {t('your-score-top', { country: t(localeMap[locale]), percentage: topPercentage })}
        </p>
      </CardBody>
    </Card>
  )
}
