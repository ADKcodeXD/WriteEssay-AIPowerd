import { Card, Link } from "@heroui/react"
import { useTranslations } from 'next-intl'
import React from 'react'

export default function MyFooter() {
  const t = useTranslations()
  return (
    <Card className="h-14 p-2 text-sm flex-shrink-0" radius={'none'}>
      <div className="flex justify-between h-full items-center text-foreground-400 text-sm">
        <p>@Write Easy 2024</p>
        <div className="flex items-center gap-2 text-xs">
          <Link
            className="text-xs cursor-pointer"
            target="_blank"
            href="https://essay-ailearn.top/terms-conditions/"
          >
            {t('terms-of-service')}
          </Link>
          <span>·</span>
          <Link
            className="text-xs cursor-pointer"
            target="_blank"
            href="https://essay-ailearn.top/privacy-policy/"
          >
            {t('privacy-policy')}
          </Link>
        </div>
      </div>
    </Card>
  )
}
