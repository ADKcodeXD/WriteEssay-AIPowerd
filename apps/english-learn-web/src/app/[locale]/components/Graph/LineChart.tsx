'use client'

import { useEffect, useRef, memo } from 'react'
import * as echarts from 'echarts'
import { colors } from "@heroui/theme"
import { useTheme } from 'next-themes'

interface LineChartProps {
  data: Array<{
    xAxis?: string[] // X轴数据
    series: number[] // Y轴数据
    name?: string // 图表名称
  }>
  width?: string // 图表宽度
  height?: string // 图表高度
}

export const LineChartPure = memo(({ data, width = '100%', height = '226px' }: LineChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts>()
  const { theme } = useTheme() as { theme: 'light' | 'dark' }

  useEffect(() => {
    if (!chartRef.current) return

    if (chartInstance.current) {
      chartInstance.current.dispose()
    }

    chartInstance.current = echarts.init(chartRef.current)

    // Define series colors based on theme
    const seriesColors = [
      colors[theme].primary[theme === 'light' ? 200 : 500],
      colors[theme].success[theme === 'light' ? 200 : 500],
      colors[theme].warning[theme === 'light' ? 200 : 500],
      colors[theme].danger[theme === 'light' ? 200 : 500],
      colors[theme].secondary[theme === 'light' ? 200 : 500],
    ]

    // 配置项
    const options = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: (colors[theme].content1 as any).DEFAULT,
        borderColor: colors[theme].foreground[300],
        textStyle: {
          color: colors[theme].foreground[500],
        },
        padding: [8, 12],
        borderRadius: 8,
        borderWidth: 1,
        confine: true, // 确保提示框在图表区域内
        extraCssText: 'box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);',
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        axisLine: {
          lineStyle: {
            color: colors[theme].foreground[300],
          },
        },
        axisLabel: {
          color: colors[theme].foreground[500],
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: colors[theme].foreground[300],
          },
        },
        axisLabel: {
          color: colors[theme].foreground[500],
        },
        splitLine: {
          show: false,
          lineStyle: {
            color: colors[theme].foreground[300],
          },
        },
      },
      series: data.map((item, index) => {
        return {
          name: item.name || `系列 ${index + 1}`,
          type: 'line',
          data: item.series,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3,
            color: seriesColors[index % seriesColors.length],
          },
          itemStyle: {
            color: seriesColors[index % seriesColors.length],
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: seriesColors[index % seriesColors.length] + '40',
              },
              {
                offset: 1,
                color: seriesColors[index % seriesColors.length] + '10',
              },
            ]),
          },
        } as any
      }),
      grid: {
        left: '3%',
        right: '4%',
        bottom: '2%', // 增加底部空间，从 10% 改为 15%
        containLabel: true,
      },
    }

    // 设置配置项
    chartInstance.current.setOption(options)

    // 响应式处理
    const handleResize = () => {
      chartInstance.current?.resize()
    }
    window.addEventListener('resize', handleResize)

    // 清理函数
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [data, theme]) // 添加 theme 作为依赖

  return <div ref={chartRef} style={{ width, height }} />
})
