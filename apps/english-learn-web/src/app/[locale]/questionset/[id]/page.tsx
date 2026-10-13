'use client'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Card, CardBody, Divider } from '@heroui/react'
import { Tables } from '@repo/entity-ts-definition'
import { getQuestionSetDetail, getQuestionSetRelatedArticles } from '@/api/essay'
import EssayCard, { EssaySkeletonCard } from '@/app/[locale]/components/Card/EssayCard'
import { uniqueId } from 'lodash-es'
import { useLocalizedFieldFunction } from '@/hooks/useLocalizedField'

export default function QuestionSetDetail({ params }: { params: { id: string } }) {
  const locale = useLocale() as any
  const t = useTranslations()
  const localizedField = useLocalizedFieldFunction()

  const [questionSet, setQuestionSet] = useState<Tables<'questions'> | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadingList = new Array(4).fill(0).map(() => uniqueId('loading_'))

  const fetchQuestionSetData = async () => {
    setIsLoading(true)
    try {
      const { data: questionSetData } = await getQuestionSetDetail(parseInt(params.id))
      setQuestionSet(questionSetData)
      const { data } = await getQuestionSetRelatedArticles(parseInt(params.id))
      setRelatedArticles(data || [])
    } catch (error) {
      console.error('Error fetching question set data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchQuestionSetData()
    }
  }, [params.id])

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="mb-6 animate-pulse">
          <div className="h-8 w-1/2 bg-default-200 rounded mb-4"></div>
          <div className="h-20 w-full bg-default-100 rounded"></div>
        </div>
        <Divider className="my-6" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {loadingList.map((id) => (
            <EssaySkeletonCard key={id} />
          ))}
        </div>
      </div>
    )
  }

  if (!questionSet) {
    return (
      <div className="p-4">
        <div className="text-center text-xl text-default-500">{t('question-set-not-found')}</div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* 题集信息 */}
      <Card className="mb-6">
        <CardBody className="p-6">
          <h1 className="text-2xl font-bold mb-4">
            {localizedField(questionSet.set_name, t('unnamed-question-set'))}
          </h1>
          <p className="text-default-600 whitespace-pre-wrap">
            {localizedField(questionSet.set_desc, t('no-description'))}
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm text-default-400">
            <span>
              {t('created-at')}: {new Date(questionSet.created_at).toLocaleDateString(locale)}
            </span>
            <span>
              {t('article-count')}: {relatedArticles.length}
            </span>
            {questionSet.set_type && (
              <span>
                {t('type')}: {t(questionSet.set_type)}
              </span>
            )}
          </div>
        </CardBody>
      </Card>

      <Divider className="my-6" />

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">{t('related-articles')}</h2>
        <p className="text-sm text-default-500">
          {t('total-articles', { count: relatedArticles.length })}
        </p>
      </div>

      {relatedArticles.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {relatedArticles.map((item) => (
            <EssayCard
              key={item.article.id}
              item={{
                id: item.article.id,
                article_title: item.article.article_title,
                article_shortcut: item.article.article_shortcut,
                article_grade: item.article.article_grade,
                article_tag: item.article.article_tag,
                created_at: item.article.created_at,
                article_cover: item.article.article_cover,
                article_example: item.article.article_example,
                article_source: item.article.article_source,
                article_tasktype: item.article.article_tasktype,
                article_theme: item.article.article_theme,
                isWrited: false,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-default-500">{t('no-related-articles')}</div>
      )}
    </div>
  )
}
