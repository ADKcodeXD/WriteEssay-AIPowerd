import { useRouter } from '@/i18n/routing'
import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from "@heroui/react"
import { useLocale, useTranslations } from 'next-intl'
import React from 'react'
import { FaRegUser } from 'react-icons/fa6'
import { useStore } from '../context/StoreContext'
import { observer } from 'mobx-react-lite'

const UserInfo = observer(() => {
  const router = useRouter()
  const locale = useLocale() as any
  const t = useTranslations()

  const { userStore } = useStore()

  const gotoLoginPage = () => {
    if (!userStore.userInfo?.id) router.push('/auth/login', { locale })
  }

  const handleAction = (key: any) => {
    if (key === 'logout') userStore.logout()
    if (key === 'dashboard') router.push('/user/' + userStore.userInfo?.user_uuid, { locale })
  }

  return (
    <>
      {userStore.userInfo?.id ? (
        <Dropdown backdrop="blur">
          <DropdownTrigger>
            <Avatar
              className="cursor-pointer"
              src={userStore.userInfo?.user_avatar || ''}
              size="sm"
              isBordered
            >
              {userStore.userInfo?.user_name}
            </Avatar>
          </DropdownTrigger>
          <DropdownMenu variant="faded" aria-label="Static Actions" onAction={handleAction}>
            <DropdownItem key="dashboard">{t('dashboard')}</DropdownItem>
            <DropdownItem key="logout" className="text-danger" color="danger">
              {t('signout')}
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      ) : (
        <Button isIconOnly variant="light" onClick={gotoLoginPage} size="sm">
          <FaRegUser size="20" className="cursor-pointer" />
        </Button>
      )}
    </>
  )
})

export default UserInfo
