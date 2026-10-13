'use client'
import React, { useState } from 'react'
import { FaPencil, FaFileLines, FaCompass } from 'react-icons/fa6'
import {
  Button,
  Image,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Tooltip,
} from "@heroui/react"
import { usePathname } from 'next/navigation'
import LocaleSwitcher from './LocaleSwitcher'
import ThemeSwitcher from './ThemeSwitcher'
import UserInfo from './UserInfo'
import { Link } from '@/i18n/routing'
import { useLocale, useTranslations } from 'next-intl'
import '@/assets/loadingdot.scss'
import '@/assets/anime.scss'
import { useTheme } from 'next-themes'

const navListConst = [
  {
    route: '/broswer',
    icon: <FaCompass size="16" className="text-foreground" />,
    tip: 'explore-tip',
    title: 'explore',
    activeAnime: 'animate-spin',
    visible: false,
  },
  {
    route: '/write',
    icon: <FaPencil size="16" className="text-foreground" />,
    tip: 'write-tip',
    title: 'write',
    activeAnime: 'jello-vertical',
    visible: false,
  },
  {
    route: '/questionset',
    icon: <FaFileLines size="16" className="text-foreground" />,
    tip: 'question-set',
    title: 'qeustionset',
    activeAnime: 'jello-vertical',
    visible: false,
  },
]

export default function NavBar({ position = 'sticky' }: { position?: 'static' | 'sticky' }) {
  const path = usePathname()
  const [navList] = useState(navListConst)
  const locale = useLocale()
  const t = useTranslations()
  const { theme } = useTheme()

  return (
    <Navbar isBordered maxWidth="full" position={position}>
      <NavbarBrand>
        <Image
          src="/logo-land.png"
          alt="logo"
          height={60}
          className={theme === 'dark' ? 'invert hue-rotate-180 max-md:hidden' : 'max-md:hidden'}
        />
        <Image
          src="/logo.png"
          alt="logo"
          height={60}
          className={
            theme === 'dark'
              ? 'invert hue-rotate-180 max-md:visible md:hidden'
              : 'max-md:visible md:hidden'
          }
        />
      </NavbarBrand>
      <NavbarContent className="sm:flex gap-4 flex-1" justify="center">
        {navList.map((item) => {
          const isActive = path.includes(item.route)
          return (
            <Tooltip key={item.route} color="primary" content={t(item.tip)} className="capitalize">
              <NavbarItem isActive={isActive}>
                <Link locale={locale} href={item.route} className="flex items-center">
                  <Button isIconOnly variant={isActive ? 'shadow' : 'light'}>
                    <div className={isActive ? item.activeAnime : ''}>{item.icon}</div>
                  </Button>
                </Link>
              </NavbarItem>
            </Tooltip>
          )
        })}
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          <LocaleSwitcher />
        </NavbarItem>
        <NavbarItem>
          <ThemeSwitcher />
        </NavbarItem>
        <NavbarItem>
          <UserInfo />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  )
}
