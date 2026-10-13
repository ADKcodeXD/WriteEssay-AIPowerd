'use client'

import {
  Button,
  Card,
  CardBody,
  Divider,
  Image,
  Input,
  Pagination,
  Select,
  SelectItem,
  Spinner,
} from '@heroui/react'
import React, { useEffect, useState } from 'react'
import { uniqueId } from 'lodash-es'
import { useLocale, useTranslations } from 'next-intl'
import EmptyContent from '../components/EmptyContent'
import { useRouter } from '@/i18n/routing'
import { getQuestionSetList } from '@/api/essay'
import { Tables } from '@repo/entity-ts-definition'
import { useLocalizedFieldFunction } from '@/hooks/useLocalizedField'

export default function QuestionSet() {
  const locale = useLocale() as any
  const t = useTranslations()
  const localizedField = useLocalizedFieldFunction()

  const [questionSets, setQuestionSets] = useState<Tables<'questions'>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedType, setSelectedType] = useState<string>('all')
  const itemsPerPage = 12

  const loadingList = new Array(8).fill(0).map(() => uniqueId('loading_'))

  // 题集类型选项
  const typeOptions = [
    { value: 'all', label: t('all-types') },
    { value: 'ielts', label: t('ielts') },
  ]

  const fetchQuestionSets = async () => {
    setIsLoading(true)
    try {
      const params: any = {
        page,
        pageSize: itemsPerPage,
      }
      if (selectedType !== 'all') {
        params.set_type = selectedType
      }
      const { data } = await getQuestionSetList(params)
      setQuestionSets(data?.rows || [])
      setTotalPages(Math.ceil((data?.count || 0) / itemsPerPage))
    } catch (error) {
      console.error('Error fetching question sets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestionSets()
  }, [page, selectedType])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(e.target.value)
    setPage(1) // 重置到第一页
  }

  return (
    <div className="p-4">
      {/* 题集介绍 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{t('question-set')}</h1>
        <p className="text-default-600">{t('question-set-description')}</p>
      </div>

      {/* 筛选框 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="w-full sm:w-64">
          <div className="flex flex-col gap-1.5">
            <Select
              className="max-w-xs"
              label={t('filter-by-type')}
              onChange={handleTypeChange}
              placeholder={t('filter-by-type')}
            >
              {typeOptions.map((option) => (
                <SelectItem key={option.value}>{option.label}</SelectItem>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <Divider className="my-4" />

      <>
        {isLoading && (
          <div className="card-list grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {loadingList.map((id) => (
              <QuestionSetSkeletonCard key={id} />
            ))}
          </div>
        )}
        {!isLoading && questionSets.length > 0 ? (
          <>
            <div className="card-list grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {questionSets.map((set) => (
                <QuestionSetCard key={set.id} set={set} />
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <Pagination
                  total={totalPages}
                  initialPage={page}
                  page={page}
                  onChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : (
          !isLoading && (
            <div className="flex justify-center items-center h-[200px]">
              <EmptyContent />
            </div>
          )
        )}
      </>
    </div>
  )
}

function QuestionSetCard({ set }: { set: Tables<'questions'> & { article_count?: number } }) {
  const locale = useLocale() as any
  const router = useRouter()
  const t = useTranslations()
  const localizedField = useLocalizedFieldFunction()

  const handleQuestionSetClick = (id: number) => {
    router.push(`/questionset/${id}`, { locale })
  }

  return (
    <Card isPressable isHoverable className="w-full" onPress={() => handleQuestionSetClick(set.id)}>
      <CardBody className="p-4 flex-1">
        <div className="flex flex-col gap-2 h-full">
          <h3 className="font-semibold text-lg line-clamp-1">{localizedField(set.set_name)}</h3>
          <p className="text-sm text-default-500 line-clamp-2">{localizedField(set.set_desc)}</p>

          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-default-400">
              {new Date(set.created_at).toLocaleDateString(locale)}
            </span>
            <div className="flex items-center gap-2">
              {set.article_count && (
                <span className="text-xs font-medium text-primary">
                  {set.article_count} {t('questions')}
                </span>
              )}
              {set.set_type && (
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                  {t(set.set_type)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function QuestionSetSkeletonCard() {
  return (
    <Card className="w-full">
      <CardBody className="p-4">
        <div className="flex flex-col gap-2">
          <div className="h-6 w-3/4 bg-default-200 rounded animate-pulse"></div>
          <div className="h-4 w-full bg-default-100 rounded animate-pulse"></div>
          <div className="h-4 w-2/3 bg-default-100 rounded animate-pulse"></div>

          <div className="flex justify-between items-center mt-2">
            <div className="h-3 w-1/4 bg-default-100 rounded animate-pulse"></div>
            <div className="h-3 w-1/6 bg-default-100 rounded animate-pulse"></div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
