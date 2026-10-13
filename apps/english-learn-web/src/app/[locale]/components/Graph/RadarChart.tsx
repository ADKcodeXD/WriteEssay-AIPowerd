'use client'
import * as echarts from 'echarts'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useRef, useEffect, memo } from 'react'
import { colors } from "@heroui/theme"

export const RadarChartPure = memo(
  ({ scoreList, height }: { scoreList: any[]; height?: number }) => {
    const radarRef = useRef<HTMLDivElement>(null)
    const { theme } = useTheme() as { theme: 'light' | 'dark' }
    const t = useTranslations()
    useEffect(() => {
      if (radarRef.current && scoreList.length > 0) {
        const chart = echarts.init(radarRef.current)
        const foregroundColor = colors[theme].foreground[500]
        const lineColors = [
          colors[theme].primary[100],
          colors[theme].primary[200],
          colors[theme].primary[300],
          colors[theme].primary[400],
          colors[theme].primary[500],
          colors[theme].primary[600],
        ]

        const option = {
          tooltip: {
            trigger: 'axis',
            confine: true,
          },
          radar: {
            indicator: [
              { name: t('taskAchievement'), max: 9 },
              { name: t('coherence'), max: 9 },
              { name: t('lexicalResource'), max: 9 },
              { name: t('grammaticalRangeAccuracy'), max: 9 },
            ],
            shape: 'circle',
            radius: '75%',
            center: ['50%', '50%'],
            splitLine: {
              lineStyle: {
                color: lineColors.reverse(),
              },
            },
            splitArea: {
              show: false,
            },
            axisLine: {
              lineStyle: {
                color: colors[theme].primary[200],
                opacity: 0.2,
              },
            },
            axisName: {
              color: foregroundColor,
              fontSize: 10,
              padding: [3, 5],
              formatter: (name: string) => {
                const words = name.split(' ')
                if (words.length === 1) return name
                const midIndex = Math.ceil(words.length / 2)
                return words.slice(0, midIndex).join(' ') + '\n' + words.slice(midIndex).join(' ')
              },
            },
          },
          series: [
            {
              name: 'Score',
              type: 'radar',
              tooltip: {
                trigger: 'item',
                borderColor: colors[theme].primary[300],
                backgroundColor: (colors[theme].content1 as any).DEFAULT,
                textStyle: {
                  color: colors[theme].foreground[500],
                },
              },
              lineStyle: {
                width: 2,
                color: colors[theme].primary[400],
              },
              data: [
                {
                  value: scoreList,
                  name: t('xiao-fen-fen-bu'),
                  areaStyle: {
                    color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.8, [
                      {
                        offset: 0,
                        color: colors[theme].primary[200] + 'cc', // 内圈，80% 透明度
                      },
                      {
                        offset: 0.5,
                        color: colors[theme].primary[300] + '99', // 中间，60% 透明度
                      },
                      {
                        offset: 1,
                        color: colors[theme].primary[700] + '', // 外圈，20% 透明度
                      },
                    ]),
                  },
                },
              ],
              symbol: 'circle',
              symbolSize: 5,
              label: {
                show: true,
                formatter: '{c}',
                color: colors[theme].foreground[700],
              },
            },
          ],
        }

        chart.setOption(option)

        return () => {
          chart.dispose()
        }
      }
    }, [radarRef, scoreList, theme])

    return <div ref={radarRef} style={{ height: `${height || 226}px` }} className="w-full" />
  }
)
