import { useRouter } from '@/i18n/routing'
import { Card, CardHeader, Chip, CardBody, Tooltip, CardFooter, Skeleton } from "@heroui/react"
import { EssayListVO, Tables } from '@repo/entity-ts-definition'
import { uniqueId } from 'lodash-es'
import { observer } from 'mobx-react-lite'
import { useLocale, useTranslations } from 'next-intl'
import React from 'react'
import { FaCheckCircle } from 'react-icons/fa'
import { MdKeyboardDoubleArrowRight } from 'react-icons/md'
import { useStore } from '../../context/StoreContext'
import { toJS } from 'mobx'

export const color: any[] = ['primary', 'secondary', 'success', 'warning', 'danger']

export const EssayTags = observer(
  ({ tags, size }: { tags: number[]; size?: 'sm' | 'md' | 'lg' }) => {
    const locale = useLocale() as any
    const { tagStore } = useStore()
    const tagsList = toJS(tagStore.tags).filter((item) => tags.includes(item.id))
    return (
      <div className="flex gap-1 flex-wrap">
        {tagsList?.map((item) => {
          return (
            <Chip
              className="cursor-pointer hover:shadow-secondary-300 max-w-[25%] overflow-hidden text-ellipsis"
              color={color[item.id % color.length] || 'default'}
              key={uniqueId('_dev')}
              size={size || 'md'}
            >
              {item.tag_i18n && (item.tag_i18n as any)[locale]}
            </Chip>
          )
        })}
      </div>
    )
  }
)

export default function EssayCard({
  item,
  isViewMore,
}: {
  item?: EssayListVO
  isViewMore?: boolean
}) {
  const locale = useLocale() as any
  const router = useRouter()
  const t = useTranslations()

  const gotoDetail = (id?: number) => {
    if (!id) router.push('/write', { locale: locale })
    else router.push(`/write/${id}`, { locale: locale })
  }

  return (
    <Card
      className="pt-2 h-56 bg-gradient-to-t from-primary-50 to-foreground-50 flex-shrink-0"
      disableRipple={false}
      isPressable
      shadow="md"
      key={item?.id || uniqueId('essay')}
      onClick={() => gotoDetail(item?.id)}
    >
      {!isViewMore && item && (
        <CardHeader className="px-4 py-0 flex-col items-start">
          <p className="font-bold text-md text-left line-clamp-2 leading-6">
            <p className="inline-flex mr-1">
              {item.isWrited && <FaCheckCircle className="text-success-500" />}
            </p>
            <Chip variant="bordered" color="warning" className="inline-flex mr-2" size="sm">
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
            <span className="ml-1">
              {(item.article_shortcut && (item.article_shortcut as any)[locale]) || ''}
            </span>
          </p>
        </CardHeader>
      )}
      <CardBody className="overflow-visible py-2 flex-1">
        {!isViewMore ? (
          <Tooltip
            content={item?.article_title}
            className="max-w-72"
            placement="bottom"
            delay={1000}
          >
            <p className="line-clamp-4 text-sm text-foreground-400">{item?.article_title}</p>
          </Tooltip>
        ) : (
          <div className="flex items-center justify-center flex-col h-full">
            <MdKeyboardDoubleArrowRight size={72} />
            <p className="text-foreground-400 text-sm">{t('viewMore')}</p>
          </div>
        )}
      </CardBody>
      {!isViewMore && (
        <CardFooter className="flex-col items-start">
          <EssayTags tags={item?.article_tag || []} />
        </CardFooter>
      )}
    </Card>
  )
}

export const EssaySkeletonCard = () => {
  return (
    <Card
      className="pt-2 h-56 bg-gradient-to-t from-primary-50 to-foreground-50 flex-shrink-0"
      isPressable
      shadow="md"
    >
      <CardHeader className="py-0 flex-col items-start">
        <Skeleton className="rounded-lg w-full">
          <div className="h-6 rounded-lg w-full"></div>
        </Skeleton>
      </CardHeader>
      <CardBody className="overflow-visible py-2 flex-1">
        <Skeleton className="w-4/5 rounded-lg">
          <div className="h-20 w-full rounded-lg my-2"></div>
        </Skeleton>
      </CardBody>
      <CardFooter className="flex-col items-start">
        <Skeleton className="w-3/5 rounded-lg">
          <div className="h-3 w-3/5 rounded-lg"></div>
        </Skeleton>
      </CardFooter>
    </Card>
  )
}
