'use client'
import { Button, Card, CardBody, CardHeader, Divider, Image, Spinner } from '@heroui/react'
import { FaAngleRight } from 'react-icons/fa'
import React, { useEffect, useState } from 'react'
import { getEssayList } from '@/api/essay'
import { EssayListVO } from '@repo/entity-ts-definition'
import EssayCard, { EssaySkeletonCard } from '../components/Card/EssayCard'
import { uniqueId } from 'lodash-es'
import { useLocale, useTranslations } from 'next-intl'
import EmptyContent from '../components/EmptyContent'
import { useRouter } from '@/i18n/routing'

export default function page() {
  const [essayList, setEssayList] = useState<EssayListVO[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const locale = useLocale() as any
  const t = useTranslations()

  const bannerList: {
    title: string
    subtitle: string
    link?: string
    image: string
  }[] = [
    {
      title: t('seasonal-topics'),
      subtitle: t('selected-seasonal-topics'),
      image:
        'https://ylelcbblrwrebxvglkkl.supabase.co/storage/v1/object/public/WriteEasy/articlenew.png',
    },
    {
      title: t('custom-topics'),
      subtitle: t('custom-topics-desc'),
      link: '/write/custom',
      image:
        'https://ylelcbblrwrebxvglkkl.supabase.co/storage/v1/object/public/WriteEasy/custom.webp',
    },
    {
      title: t('ielts-topics'),
      subtitle: t('historical-ielts'),
      link: '/questionset',
      image:
        'https://ylelcbblrwrebxvglkkl.supabase.co/storage/v1/object/public/WriteEasy/histor.webp',
    },
    {
      title: t('selected-topics'),
      subtitle: t('progressive-improvement'),
      image:
        'https://ylelcbblrwrebxvglkkl.supabase.co/storage/v1/object/public/WriteEasy/progressi.webp',
    },
  ]

  const loadingList = new Array(11).fill(uniqueId('_dev'))

  const fetchEssayList = async () => {
    setIsLoading(true)
    try {
      const data = await getEssayList({
        page: 1,
        pageSize: 10,
        grade: 'ielts',
        taskType: 2,
        orderAccrodBy: 'date',
        sortType: 'desc',
      })
      setEssayList(data?.data?.rows || [])
    } finally {
      setIsLoading(false)
    }
  }

  const handleBannerClick = (link: string) => {
    if (link) {
      router.push(link, { locale })
    }
  }

  useEffect(() => {
    fetchEssayList()
  }, [])

  return (
    <div className="p-4">
      <section className="grid grid-cols-4 gap-4 mb-2 max-md:grid-cols-2">
        {bannerList.map((item) => (
          <Card
            className="h-[176px]"
            isBlurred
            isPressable
            key={item.subtitle}
            onPress={() => handleBannerClick(item.link || '')}
          >
            <CardBody className="absolute z-10 top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] flex-col !items-start w-full">
              <p className="font-bold uppercase text-xl text-white">{item.title}</p>
              <span className="text-white/60 text-sm">{item.subtitle}</span>
            </CardBody>
            <Image
              removeWrapper
              isZoomed
              alt="Card background"
              className="z-0 w-full h-full object-cover brightness-50 blur-[1px]"
              src={item.image}
            />
          </Card>
        ))}
      </section>

      <section className="flex items-end justify-between">
        <div>
          <p className="text-foreground-600">{t('ielts-write')}</p>
          <p className="text-tiny text-foreground-400">{t('ielts-subtitle')}</p>
        </div>
        <Button isIconOnly variant="ghost" size="sm">
          <FaAngleRight />
        </Button>
      </section>

      <Divider className="my-4" />

      <>
        {isLoading && (
          <div className="card-list grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {loadingList.map((item) => (
              <EssaySkeletonCard key={item} />
            ))}
          </div>
        )}
        {!isLoading && essayList.length ? (
          <div className="card-list grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {essayList.map((item) => (
              <EssayCard item={item} key={uniqueId('_dev')} />
            ))}
            <EssayCard isViewMore />
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner />
          </div>
        ) : (
          <div className="flex justify-center items-center h-full">
            <EmptyContent />
          </div>
        )}
      </>
    </div>
  )
}
