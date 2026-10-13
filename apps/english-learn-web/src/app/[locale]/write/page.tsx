'use client'

import { getEssayList, getTagList } from '@/api/essay'
import { Button, Chip, Input, Link, Pagination } from '@heroui/react'
import { EssayListVO, Tables } from '@repo/entity-ts-definition'
import { PageQueryParams } from '@repo/entity-ts-definition/dist/enumDefination'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { FaSearch } from 'react-icons/fa'
import { color } from '../components/Card/EssayCard'
import { BsCheck } from 'react-icons/bs'
import { EssayCardRow, EssayRowSkeletonCard } from '../components/Card/EssayCardRow'
import { useLocale } from 'next-intl'
import { useStore } from '../context/StoreContext'
import { observer } from 'mobx-react-lite'
import { debounce } from 'lodash-es'
import { useTranslations } from 'next-intl'

const Page = observer(() => {
  const locale = useLocale()
  const t = useTranslations()
  const { tagStore } = useStore()
  const [essayList, setEssayList] = useState<EssayListVO[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExpandTagList, setIsExpandTagList] = useState(false)
  const [count, setCount] = useState(0)
  const [searchParams, setSearchParams] = useState<PageQueryParams>({
    page: 1,
    pageSize: 10,
    tagList: undefined,
    taskType: undefined,
    sortType: 'desc',
    orderAccrodBy: 'date',
    keyword: undefined,
  })

  const fetchEssayList = useCallback(
    debounce(async (searchParams) => {
      if (isLoading) return
      setIsLoading(true)
      try {
        const data = await getEssayList(searchParams)
        setEssayList(data?.data?.rows || [])
        setCount(data?.data?.count || 0)
      } finally {
        setIsLoading(false)
      }
    }, 300),
    []
  )

  useEffect(() => {
    setCount(0)
    setSearchParams({ ...searchParams, page: 1 })
    fetchEssayList(searchParams)
    return () => {
      fetchEssayList.cancel()
    }
  }, [
    searchParams.tagList,
    searchParams.taskType,
    searchParams.grade,
    searchParams.sortType,
    searchParams.keyword,
  ])

  useEffect(() => {
    fetchEssayList(searchParams)
  }, [searchParams.page])

  const pageTotal = Math.ceil(count / searchParams.pageSize!)

  return (
    <div className="p-4 max-w-[768px] mx-auto">
      <p className="text-foreground text-md mb-4 font-bold">
        🎯 {t('search-topic')}{' '}
        <Link href="/write/custom" className="text-xs">
          {t('custom-topic')}
        </Link>
      </p>
      <Input
        label={t('search')}
        isClearable
        radius="lg"
        classNames={
          {
            label: 'text-black/50 dark:text-white/90',
            input: ['bg-transparent', 'text-foreground/90', 'placeholder:text-foreground/50'],
            innerWrapper: 'bg-transparent',
            inputWrapper: [
              'shadow-xl',
              'bg-default-100/50',
              'dark:bg-default/60',
              'backdrop-blur-xl',
              'backdrop-saturate-200',
              'hover:bg-default-100/70',
              'group-data-[focus=true]:bg-default-100/50',
              'dark:group-data-[focus=true]:bg-default/60',
              '!cursor-text',
            ],
          } as any
        }
        onChange={(e) => {
          setSearchParams({ ...searchParams, keyword: e.target.value })
        }}
        placeholder={t('search-placeholder')}
        startContent={
          <FaSearch className="text-foreground/50 mb-0.5 pointer-events-none flex-shrink-0" />
        }
      />
      <p className="text-foreground/50 text-sm my-2">{t('tag-list')}</p>
      <div className="flex flex-wrap gap-2 items-center">
        {tagStore.tags.slice(0, isExpandTagList ? tagStore.tags.length : 10).map((tag) => (
          <Chip
            key={tag.id}
            variant={searchParams.tagList?.includes(tag.id) ? 'solid' : 'bordered'}
            radius="lg"
            size="sm"
            className="cursor-pointer"
            startContent={searchParams.tagList?.includes(tag.id) ? <BsCheck /> : undefined}
            onClick={() => {
              if (!searchParams.tagList?.includes(tag.id)) {
                setSearchParams({
                  ...searchParams,
                  tagList: [...(searchParams.tagList || []), tag.id],
                })
              } else {
                setSearchParams({
                  ...searchParams,
                  tagList: searchParams.tagList?.filter((id) => id !== tag.id) || [],
                })
              }
            }}
            color={color[tag.id % color.length] || 'default'}
          >
            {(tag.tag_i18n && (tag.tag_i18n as any)[locale]) || tag.tag_name}
          </Chip>
        ))}
        <Link
          onClick={() => setIsExpandTagList(!isExpandTagList)}
          className="cursor-pointer text-xs"
        >
          {t(isExpandTagList ? 'collapse' : 'expand')}
        </Link>
      </div>
      <div className="wrapper w-full mt-4 flex flex-col gap-2">
        <span className="text-foreground/50 text-sm">{t('found-essays', { count })}</span>
        {!isLoading ? (
          essayList.map((essay) => <EssayCardRow key={essay.id} item={essay} />)
        ) : (
          <EssayRowSkeletonCard />
        )}
      </div>
      <div className="flex justify-end items-center mt-4">
        <Pagination
          total={pageTotal}
          page={searchParams.page}
          color="primary"
          showControls
          onChange={(page) => {
            setSearchParams({ ...searchParams, page })
          }}
        />
      </div>
    </div>
  )
})

export default Page
