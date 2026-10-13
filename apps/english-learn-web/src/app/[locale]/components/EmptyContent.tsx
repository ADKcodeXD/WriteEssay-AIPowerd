import React from 'react'
import { FaCircleNotch } from 'react-icons/fa6'
import '@/assets/loadingdot.scss'
import { useTranslations } from 'next-intl'

export default function EmptyContent({
  description,
  title,
  size = 'lg',
  isDescription = true,
}: {
  description?: string
  title?: string
  isDescription?: boolean
  size?: 'lg' | 'sm'
}) {
  const t = useTranslations()
  return (
    <div className="flex items-center justify-center h-full w-full flex-col">
      <FaCircleNotch size={size === 'lg' ? 48 : 32} className="animate-spin" />
      <div className="text-center">
        <p className={`text-${size === 'lg' ? 'lg' : 'base'} font-semibold`}>
          {title || t('no-content')}
        </p>
        {isDescription && (
          <p className={`text-${size === 'lg' ? 'sm' : 'xs'} text-foreground-400`}>
            {description || t('nodata-sub')}
          </p>
        )}
      </div>
    </div>
  )
}
