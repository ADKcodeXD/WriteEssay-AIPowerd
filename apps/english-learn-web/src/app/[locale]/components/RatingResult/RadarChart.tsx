import React from 'react'
import { Score } from '@repo/entity-ts-definition'
import { Card, CardBody, CardHeader } from "@heroui/react"
import { RadarChartPure } from '../Graph/RadarChart'
import { useTranslations } from 'next-intl'
export const RadarChart: React.FC<{ score: Score | undefined }> = ({ score }) => {
  const t = useTranslations()
  return (
    <Card isPressable className="p-2 flex flex-col h-[240px] flex-1">
      <CardHeader className="flex flex-col items-start">
        <p className="text-lg text-foreground">{t('ability-chart')}</p>
      </CardHeader>
      <CardBody className="p-0 flex items-center justify-center">
        {score && (
          <RadarChartPure
            scoreList={[
              score.taskAchievement,
              score.coherence,
              score.lexicalResource,
              score.grammaticalRangeAccuracy,
            ]}
          />
        )}
      </CardBody>
    </Card>
  )
}
