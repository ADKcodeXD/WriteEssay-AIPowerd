'use client'
import React from 'react'
import ThemeSwitcher from '../components/ThemeSwitcher'
import LocaleSwitcher from '../components/LocaleSwitcher'
import { Button } from "@heroui/react"
import { IoCaretBack } from 'react-icons/io5'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import Toast from '../components/Toast/ToastContainer'

export default function Layout({ children }: any) {
  const locale = useLocale() as any
  const router = useRouter()
  const t = useTranslations()
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-t from-primary-50 to-secondary-50">
      <div className="w-full justify-between items-center flex pt-4 px-2">
        <Button
          onClick={() => router.push('/', { locale })}
          startContent={<IoCaretBack />}
          size="sm"
          variant="light"
        >
          {t('back-to-homepage')}
        </Button>
        <div>
          <ThemeSwitcher />
          <LocaleSwitcher />
        </div>
      </div>
      <div className="flex-1 w-full flex items-center justify-center">{children}</div>
      <p className="text-sm p-2">Power By Supabase</p>
      <Toast />
    </div>
  )
}
