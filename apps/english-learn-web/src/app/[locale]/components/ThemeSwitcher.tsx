import { Button } from "@heroui/react"
import { useTheme } from 'next-themes'
import React from 'react'
import { FaMoon, FaSun } from 'react-icons/fa6'
import '@/assets/loadingdot.scss'

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      isIconOnly
      variant="light"
      className="mx-0"
      size="sm"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      {theme === 'dark' ? (
        <FaMoon size="20" className="animate-spin" />
      ) : (
        <FaSun size="20" className="animate-spin" />
      )}
    </Button>
  )
}
