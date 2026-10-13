'use client'
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { useLocale, useTranslations } from 'next-intl'
import { routing } from '@/i18n/routing'
import React, { useEffect } from 'react'
import { IoLanguageOutline } from 'react-icons/io5'
import { useRouter, usePathname } from '@/i18n/routing'
import { setLocale as setGlobalLocale } from '@/i18n'

export default function LocaleSwitcher() {
  const locale = useLocale()
  const t = useTranslations()
  const router = useRouter()
  const pathName = usePathname()

  const setLocale = (locale: 'en' | 'ja' | 'zh-CN' | undefined) => {
    setGlobalLocale(locale as any)
    router.replace(pathName, { locale })
  }

  useEffect(() => {
    setGlobalLocale(locale as any)
  }, [])

  return (
    <Dropdown placement="bottom-end" size="sm" className="w-36">
      <DropdownTrigger>
        <Button isIconOnly variant="light" className="mx-0" size="sm">
          <IoLanguageOutline size={20} className="cursor-pointer" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu selectionMode="single" selectedKeys={[locale]} disabledKeys={[locale]}>
        {routing.locales?.map((localeItem) => {
          return (
            <DropdownItem
              key={localeItem}
              onClick={() => setLocale(localeItem)}
              onPress={() => setLocale(localeItem)}
            >
              {t(localeItem)}
            </DropdownItem>
          )
        })}
      </DropdownMenu>
    </Dropdown>
  )
}
