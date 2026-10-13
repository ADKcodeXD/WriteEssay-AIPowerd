import { useRouter } from '@/i18n/routing'
import { Card, CardHeader, Chip, CardBody, Tooltip, CardFooter, Skeleton } from "@heroui/react"
import { EssayListVO, Tables } from '@repo/entity-ts-definition'
import { uniqueId } from 'lodash-es'
import { useLocale, useTranslations } from 'next-intl'
import React from 'react'
import { FaCheckCircle } from 'react-icons/fa'
import { EssayTags } from './EssayCard'
import { observer } from 'mobx-react-lite'

export const EssayCardRow = observer(({ item }: { item?: EssayListVO }) => {
  const locale = useLocale() as any
  const router = useRouter()
  const t = useTranslations()

  const gotoDetail = (id?: number) => {
    if (!id) router.push('/write', { locale: locale })
    else router.push(`/write/${id}`, { locale: locale })
  }

  return (
    <Card
      className="w-full h-40"
      isPressable
      shadow="md"
      key={item?.id || uniqueId('essay')}
      onClick={() => gotoDetail(item?.id)}
    >
      {item && (
        <CardHeader className="flex-col items-start py-2">
          <div className="flex items-center gap-2 mb-2">
            {item.isWrited && (
              <Chip color="success" variant="flat" size="sm" startContent={<FaCheckCircle />}>
                {t('done')}
              </Chip>
            )}
            <Chip variant="bordered" color="warning" size="sm">
              {t(item.article_grade)}
            </Chip>
            {item.article_tasktype && (
              <Chip
                variant="faded"
                color={item.article_tasktype === 1 ? 'primary' : 'secondary'}
                size="sm"
              >
                Task-{item.article_tasktype}
              </Chip>
            )}
            <span
              className="font-bold line-clamp-1"
              title={(item.article_shortcut && (item.article_shortcut as any)[locale]) || ''}
            >
              {(item.article_shortcut && (item.article_shortcut as any)[locale]) || ''}
            </span>
          </div>
        </CardHeader>
      )}
      {item && (
        <CardBody className="flex-1 py-2">
          <Tooltip
            content={item?.article_title}
            placement="top-start"
            className="max-w-72"
            delay={1000}
          >
            <p className="text-sm text-foreground-600 line-clamp-2">{item?.article_title}</p>
          </Tooltip>
        </CardBody>
      )}
      <CardFooter className="flex-col items-start py-2">
        <EssayTags tags={item?.article_tag || []} size="sm" />
      </CardFooter>
    </Card>
  )
})

export const EssayRowSkeletonCard = () => {
  return (
    <Card className="w-full h-40" isPressable shadow="md">
      <CardHeader className="flex-col items-start py-2">
        <Skeleton className="w-24 h-4 rounded-lg"></Skeleton>
      </CardHeader>
      <CardBody className="flex-1 py-2">
        <Skeleton className="w-full h-4 rounded-lg"></Skeleton>
      </CardBody>
      <CardFooter className="flex-col items-start py-2">
        <Skeleton className="w-24 h-4 rounded-lg"></Skeleton>
      </CardFooter>
    </Card>
  )
}
