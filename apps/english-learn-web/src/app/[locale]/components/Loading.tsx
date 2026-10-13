import React from 'react'
import '../../../assets/loadingdot.scss'
import { useTranslations } from 'next-intl'

export default function Loading({ size = 'medium' }) {
  const t = useTranslations()
  const sizeMap: Record<string, number> = {
    small: 20,
    medium: 40,
    large: 60,
  }

  const loaderClass = `loader`

  return (
    <div className="flex items-center justify-center h-full w-full flex-col gap2">
      <div
        className={loaderClass}
        style={{
          width: `${sizeMap[size]}px`,
        }}
      ></div>
      <span className="text-xs text-foreground-300 mt-2">{t('loading')}</span>
    </div>
  )
}
