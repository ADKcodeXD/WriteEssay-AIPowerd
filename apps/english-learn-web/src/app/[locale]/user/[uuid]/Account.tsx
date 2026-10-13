'use client'
import React from 'react'
import { Avatar, Button, Chip, Link } from "@heroui/react"
import { formatTimeByFormat } from '@/utils'
import Loading from '../../components/Loading'
import { observer } from 'mobx-react-lite'
import rootStore from '@/store'
import { useStore } from '../../context/StoreContext'
import { useTranslations } from 'next-intl'

const UserProfile = observer(() => {
  const { userInfo } = rootStore.userStore
  const t = useTranslations()
  const userLevel = userInfo?.user_level || 0

  const userLevelMap: any = {
    0: t('default'),
    1: t('pro'),
    2: t('premium'),
  }

  const userLevelColor: any = {
    0: 'default',
    1: 'primary',
    2: 'success',
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center space-x-6 mb-4">
        <Avatar
          src={userInfo?.user_avatar || ''}
          alt="User Avatar"
          size="lg"
          className="rounded-full"
        >
          {userInfo?.user_name || userInfo?.user_email}
        </Avatar>
        <div>
          {userInfo?.user_name && <p className="text-lg font-bold">{userInfo.user_name}</p>}
          {userInfo?.user_name && (
            <p className="text-sm text-foreground-400">@{userInfo.user_email}</p>
          )}
          <Chip color={userLevelColor[userLevel]}>{userLevelMap[userLevel]}</Chip>
        </div>
      </div>
      <div className="justify-self-end">
        <div className="text-xs text-foreground-400">
          <p>
            {t('createdat')}:{' '}
            {formatTimeByFormat(userInfo?.created_at || new Date(), 'YYYY-MM-DD HH:mm:ss')}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-2">
        <span className="text-sm text-foreground-400">
          {t('dang-qian-sheng-yu-biao-zhun-pei-e')}: {userInfo?.normal_quota}
        </span>
        <span className="text-sm text-foreground-400">
          {t('dang-qian-sheng-yu-gao-ji-pei-e')}: {userInfo?.high_quota}
        </span>
      </div>
      <div className="buttongroup mt-4 flex gap-2">
        <Button color="primary" size="sm" className="w-auto">
          {t('sheng-ji-pro-ji-hua')}
        </Button>
        <Link
          href="https://essay-ailearn.top/pricing/"
          target="_blank"
          className="text-sm cursor-pointer"
        >
          {t('le-jie-shou-fei-ji-hua')}
        </Link>
      </div>
    </div>
  )
})

const Account = observer(() => {
  const { userStore } = useStore()
  const { loading, userInfo } = userStore

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  if (!userInfo) {
    return <div className="h-full w-full flex items-center justify-center">User not found</div>
  }

  return <UserProfile />
})

export default Account
