'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@heroui/react'
import { FaRegUserCircle } from 'react-icons/fa'
import { FiSettings } from 'react-icons/fi'
import { TbLayoutDashboard } from 'react-icons/tb'
import { FaHistory } from 'react-icons/fa'
import Account from './Account'
import Dashboard from './Dashboard'
import History from './History'
import Settings from './Settings'
import { useStore } from '@/app/[locale]/context/StoreContext'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'

const UserPage = observer(() => {
  const [selected, setSelected] = useState<string | undefined>('dashboard')
  const { dashboardStore } = useStore()
  const t = useTranslations()
  const list = [
    {
      icon: <TbLayoutDashboard size={16} />,
      label: t('dashboard'),
      key: 'dashboard',
    },
    {
      icon: <FaRegUserCircle size={16} />,
      label: t('account'),
      key: 'account',
    },
    {
      icon: <FaHistory size={16} />,
      label: t('history'),
      key: 'history',
    },
    {
      icon: <FiSettings size={16} />,
      label: t('settings'),
      key: 'settings',
    },
  ]

  useEffect(() => {
    dashboardStore.fetchStatistics('ielts')
  }, [dashboardStore])

  return (
    <div className="w-full flex mx-auto h-full max-md:flex-col">
      <div className="max-md:hidden h-9/10 w-[150px] bg-content1 rounded-l-none rounded-r-3xl p-2 flex flex-col gap-2 shadow-lg border-solid border-foreground-100 border-r-1">
        {list.map((item) => {
          return (
            <Button
              startContent={item.icon}
              radius="full"
              size="md"
              variant={selected === item.key ? 'solid' : 'light'}
              className="w-full justify-start"
              color={selected === item.key ? 'primary' : 'default'}
              key={item.key}
              onClick={() => setSelected(item.key)}
            >
              {item.label}
            </Button>
          )
        })}
      </div>

      <div className="w-full flex-1 flex flex-col justify-center items-center px-4 h-full overflow-auto">
        <div className="w-full flex flex-col h-full p-2 items-start justify-start">
          {selected === 'account' && <Account />}
          {selected === 'dashboard' && (
            <Dashboard
              statistics={dashboardStore.statistics || undefined}
              onGradeChange={dashboardStore.fetchStatistics}
            />
          )}
          {selected === 'history' && <History />}
          {selected === 'settings' && <Settings />}
        </div>
      </div>

      <div className="visible md:hidden w-full flex flex-row items-center justify-around gap-2 p-2 mt-2">
        {list.map((item) => {
          return (
            <Button
              startContent={item.icon}
              variant={selected === item.key ? 'solid' : 'light'}
              className="flex flex-col items-center justify-center text-xs py-2"
              color={selected === item.key ? 'primary' : 'default'}
              key={item.key}
              onClick={() => setSelected(item.key)}
            />
          )
        })}
      </div>
    </div>
  )
})

export default UserPage
