'use client'
import {
  CircularProgress,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Progress,
  Accordion,
  AccordionItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Chip,
} from "@heroui/react"
import React from 'react'
import { useTranslations } from 'next-intl'
import {
  AiRateParams,
  EssayFeedbackPartial,
  Grade,
  RatingDeepReason,
  Score,
  ScoreReason,
} from '@repo/entity-ts-definition'
import { MdOutlineAbc, MdOutlineArticle, MdOutlineTaskAlt } from 'react-icons/md'
import { GiStarShuriken } from 'react-icons/gi'
import { caclateWordByInput, formatShortTime } from '@/utils'
import { RadarChart } from './RadarChart'
import EmptyContent from '../EmptyContent'
import { ScoreDistribution, scoreMap } from './RatingScatter'

const RatingCardList: {
  title: string
  scoreKey: keyof Score
  tips: string
  icon: React.ReactNode
}[] = [
  {
    title: 'taskAchievement',
    scoreKey: 'taskAchievement',
    tips: 'taskAchievement-tips',
    icon: <MdOutlineTaskAlt className="text-xl" />,
  },
  {
    title: 'lexicalResource',
    scoreKey: 'lexicalResource',
    tips: 'lexicalResource-tips',
    icon: <GiStarShuriken className="text-xl" />,
  },
  {
    title: 'grammaticalRangeAccuracy',
    scoreKey: 'grammaticalRangeAccuracy',
    tips: 'grammaticalRangeAccuracy-tips',
    icon: <MdOutlineAbc className="text-xl" />,
  },
  {
    title: 'coherence',
    scoreKey: 'coherence',
    tips: 'coherence-tips',
    icon: <MdOutlineArticle className="text-xl" />,
  },
]

const getScoreColor = (score: number, maxScore: number, needStroke: boolean = true) => {
  const percentage = (score / maxScore) * 100
  if (percentage <= 30) return needStroke ? 'stroke-gray-400' : 'bg-danger-400'
  if (percentage <= 50) return needStroke ? 'stroke-secondary' : 'bg-secondary'
  if (percentage <= 70) return needStroke ? 'stroke-primary' : 'bg-primary'
  if (percentage <= 85) return needStroke ? 'stroke-success' : 'bg-success'
  if (percentage <= 90) return needStroke ? 'stroke-warning' : 'bg-warning'
  return needStroke ? 'stroke-pink-400' : 'bg-pink-400'
}

const getWordColor = (score: number, maxWord: number) => {
  const percentage = (score / maxWord) * 100
  if (percentage <= 30 && percentage > 0) return 'stroke-danger'
  else if (percentage <= 60 && percentage > 30) return 'stroke-warning'
  else if (percentage <= 90 && percentage > 60) return 'stroke-primary'
  return 'stroke-success'
}

const getTimeColor = (time: number, maxTime: number) => {
  const percentage = (time / maxTime) * 100
  if (percentage <= 30 && percentage > 0) return 'stroke-success'
  else if (percentage <= 60 && percentage > 30) return 'stroke-primary'
  else if (percentage <= 80 && percentage > 60) return 'stroke-warning'
  return 'stroke-danger'
}

export const RatingResult = ({
  essayFeedBack,
  essayInput,
}: {
  essayFeedBack: EssayFeedbackPartial
  essayInput?: AiRateParams
}) => {
  const t = useTranslations()

  const circleList: any[] = [
    {
      maxValue: 9,
      totalLabel: t('overall'),
      descLabel: t('overall'),
      inputValueKey: 'overall',
      colorFunc: getScoreColor,
    },
    {
      maxValue: 250,
      totalLabel: t('words'),
      descLabel: t('word'),
      inputValueKey: 'words',
      colorFunc: getWordColor,
    },
    {
      maxValue: 40 * 60,
      totalLabel: t('time'),
      unit: t('time'),
      descLabel: t('total-duration'),
      inputValueKey: 'useTime',
      colorFunc: getTimeColor,
    },
  ]

  const getCelebrationText = (score: number, grade: Grade = 'ielts') => {
    if (score === scoreMap[grade].excellent) return t(`${grade}-excellent`)
    else if (score > scoreMap[grade].good) return t(`${grade}-good`)
    else if (score > scoreMap[grade].average) return t(`${grade}-average`)
    else if (score > scoreMap[grade].notbad) return t(`${grade}-notbad`)
    else if (score > scoreMap[grade].poor) return t(`${grade}-poor`)
    else if (score > scoreMap[grade].bad) return t(`${grade}-bad`)
    else return t(`${grade}-noneSense`)
  }

  const words = essayInput?.content ? caclateWordByInput(essayInput?.content) : 0

  return (
    <div className="flex flex-col w-full h-full overflow-auto overflow-x-hidden">
      <div className="info mb-4">
        <p className="text-lg text-foreground font-bold">
          {getCelebrationText(essayFeedBack.score?.overall || 0)}
        </p>
        <p className="text-sm text-foreground-400 my-1">
          {t('report-language')}:
          <Chip variant="solid" color="success" className="ml-2" size="sm">
            {t(essayInput?.locale)}
          </Chip>
        </p>
      </div>
      <div className="flex items-center justify-center gap-2.5 mb-4">
        {circleList.map((item) => {
          let val
          let label
          switch (item.inputValueKey) {
            case 'overall':
              val = essayFeedBack.score?.overall
              label = essayFeedBack.score?.overall?.toFixed(1)
              break
            case 'words':
              val = words
              label = words
              break
            case 'useTime':
              val = essayInput?.useTime
              label = formatShortTime(essayInput?.useTime || 0).toString()
              break
          }
          return (
            <div
              className="flex flex-col items-center justify-center mx-4"
              key={item.inputValueKey}
            >
              <CircularProgress
                classNames={{
                  svg: 'w-40 h-40 drop-shadow-md',
                  indicator: item.colorFunc(val || 0, item.maxValue),
                  track: 'stroke-foreground/10',
                }}
                value={val || 0}
                maxValue={item.maxValue}
                strokeWidth={4}
                showValueLabel={false}
                className="relative"
                label={
                  <div className="flex absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  text-center items-center">
                    <div
                      className={`${item.inputValueKey === 'useTime' ? 'text-md' : 'text-3xl'} font-bold mb-4 text-foreground`}
                    >
                      {label}
                    </div>
                    <div className="flex text-xs text-foreground-400 absolute bottom-0 text-center justify-center w-full">
                      <div className="text-xs break-keep">
                        /
                        {item.inputValueKey === 'useTime'
                          ? formatShortTime(item.maxValue)
                          : item.maxValue}
                      </div>
                      <span className="text-xs ml-1">
                        {item.inputValueKey === 'useTime' ? '' : item.totalLabel}
                      </span>
                    </div>
                  </div>
                }
                size="lg"
              />
              <p className="text-sm text-foreground-400">{item.descLabel}</p>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <ScoreDistribution score={essayFeedBack.score?.overall || 0} />
        </div>
        <div className="flex flex-col">
          <RadarChart score={essayFeedBack.score} />
        </div>
      </div>
      <Accordion variant="splitted" className="my-2">
        <AccordionItem key="input" title={t('view-original')} className="my-2">
          <p className="text-md font-bold mb-2">
            {t('essay-topic')}: {essayInput?.title}
          </p>
          <p className="text-md">
            {t('your-essay')}: {essayInput?.content}
          </p>
        </AccordionItem>
      </Accordion>
      <p className="text-lg text-foreground my-2 ml-1">{t('detailed-evaluation')}</p>
      <div className="grid grid-cols-2 gap-4 mt-4">
        {RatingCardList.map((item) => (
          <Card className="p-2" isPressable key={item.title}>
            <CardHeader className="p-2 flex justify-between items-start">
              <div className="flex items-start">
                <div>{item.icon}</div>
                <div className="flex flex-col justify-start items-start ml-2">
                  <p className="font-semibold text-md">{t(item.title)}</p>
                  <p className="text-sm text-foreground-400 text-start">{t(item.tips)}</p>
                </div>
              </div>
              <div className="flex-shrink-0 ml-2">
                <span className="text-lg font-bold">{essayFeedBack.score?.[item.scoreKey]}</span> /
                9
              </div>
            </CardHeader>
            <CardBody className="h-56">
              <p className="text-md font-bold line-clamp-2">
                {essayFeedBack.scoreReason?.[item.scoreKey as keyof ScoreReason] || 'N/A'}
              </p>
              <p className="text-sm text-foreground-400 mt-2 line-clamp-6">
                {essayFeedBack.ratingDeepReason?.[item.scoreKey as keyof RatingDeepReason] || ''}
              </p>
            </CardBody>
            <CardFooter className="p-0">
              <Progress
                aria-label="Downloading..."
                size="sm"
                value={essayFeedBack.score?.[item.scoreKey] || 0}
                maxValue={9}
                classNames={{
                  indicator: `${getScoreColor(essayFeedBack.score?.[item.scoreKey] || 0, 9, false)}`,
                }}
                showValueLabel={false}
              />
            </CardFooter>
          </Card>
        ))}
      </div>
      <Accordion
        selectionMode="multiple"
        variant="splitted"
        className="mt-2"
        defaultExpandedKeys={['1', '2', '3', '4', '5']}
      >
        <AccordionItem
          key="1"
          aria-label={t('sentence-polish')}
          title={t('sentence-polish')}
          className="my-2"
          subtitle={t('sentence-polish-subtitle')}
        >
          {essayFeedBack.polishSentence?.polishSentence &&
          essayFeedBack.polishSentence?.polishSentence.length > 0 ? (
            <Table removeWrapper aria-label="Example static collection table">
              <TableHeader>
                <TableColumn>{t('originalSentence')}</TableColumn>
                <TableColumn>{t('polishedSentence')}</TableColumn>
              </TableHeader>
              <TableBody items={essayFeedBack.polishSentence?.polishSentence}>
                {(item) => (
                  <TableRow key={item.origin}>
                    <TableCell>{item.origin}</TableCell>
                    <TableCell>{item.polished}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <EmptyContent />
          )}
        </AccordionItem>
        <AccordionItem
          key="2"
          aria-label={t('synonym-analysis')}
          title={t('synonym-analysis')}
          className="my-2"
          subtitle={t('synonym-analysis-subtitle')}
        >
          {essayFeedBack.synonym?.synonymList && essayFeedBack.synonym?.synonymList.length > 0 ? (
            <Table removeWrapper>
              <TableHeader>
                <TableColumn>{t('originalWord')}</TableColumn>
                <TableColumn>{t('synonym')}</TableColumn>
                <TableColumn>{t('context')}</TableColumn>
                <TableColumn>{t('explain')}</TableColumn>
              </TableHeader>
              <TableBody items={essayFeedBack.synonym?.synonymList}>
                {(item) => (
                  <TableRow key={item.word}>
                    <TableCell>{item.word}</TableCell>
                    <TableCell>{item.synonym}</TableCell>
                    <TableCell>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: item.context?.replace(
                            new RegExp(item.word, 'gi'),
                            '<span class="text-danger-400 font-semibold">$&</span>'
                          ),
                        }}
                      />
                    </TableCell>
                    <TableCell>{item.explain}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <EmptyContent />
          )}
        </AccordionItem>
        <AccordionItem
          key="3"
          aria-label={t('curated-vocabulary')}
          title={t('curated-vocabulary')}
          className="my-2"
          subtitle={t('curated-vocabulary-subtitle')}
        >
          {essayFeedBack.extractGoodWordsAndSentence?.curatedWords &&
          essayFeedBack.extractGoodWordsAndSentence?.curatedWords.length > 0 ? (
            <Table removeWrapper>
              <TableHeader>
                <TableColumn>{t('word')}</TableColumn>
                <TableColumn>{t('context')}</TableColumn>
                <TableColumn>{t('explain')}</TableColumn>
              </TableHeader>
              <TableBody items={essayFeedBack.extractGoodWordsAndSentence?.curatedWords}>
                {(item) => (
                  <TableRow key={item.word}>
                    <TableCell>{item.word}</TableCell>
                    <TableCell>
                      {item.context && (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: item.context?.replace(
                              new RegExp(item.word, 'gi'),
                              '<span class="text-danger-400 font-semibold">$&</span>'
                            ),
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{item.explain}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <EmptyContent />
          )}
        </AccordionItem>
        <AccordionItem
          key="4"
          aria-label={t('curated-sentences')}
          title={t('curated-sentences')}
          className="my-2"
          subtitle={t('curated-sentences-subtitle')}
        >
          {essayFeedBack.extractGoodWordsAndSentence?.curatedSentences &&
          essayFeedBack.extractGoodWordsAndSentence?.curatedSentences.length > 0 ? (
            <Table removeWrapper>
              <TableHeader>
                <TableColumn>{t('sentence')}</TableColumn>
                <TableColumn>{t('sentence-analysis')}</TableColumn>
              </TableHeader>
              <TableBody items={essayFeedBack.extractGoodWordsAndSentence?.curatedSentences}>
                {(item) => (
                  <TableRow key={item.sentence}>
                    <TableCell>{item.sentence}</TableCell>
                    <TableCell>{item.explain}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <EmptyContent />
          )}
        </AccordionItem>
        <AccordionItem
          key="5"
          aria-label={t('example-article')}
          title={t('example-article')}
          className="my-2"
          subtitle={t('example-article-subtitle')}
        >
          {essayFeedBack.exampleArticle ? (
            <div>
              <p className="text-md font-bold">
                {t('title')}: {essayFeedBack.exampleArticle?.title}
              </p>
              <p className="text-sm text-foreground-600 break-words">
                {essayFeedBack.exampleArticle?.example}
              </p>
            </div>
          ) : (
            <EmptyContent />
          )}
        </AccordionItem>
      </Accordion>
      <span className="my-2 text-center text-foreground-400 text-sm">
        {t('aicontent-tip')}
      </span>
    </div>
  )
}
