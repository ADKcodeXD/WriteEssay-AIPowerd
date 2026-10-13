'use client'
import React, { useEffect, useState } from 'react'
import {
  Card,
  CardBody,
  Input,
  Button,
  Select,
  SelectItem,
  Image,
  CircularProgress,
} from "@heroui/react"
import { useUpload } from '@/hooks/useUpload'
import { FaPlus } from 'react-icons/fa6'
import { TablesUpdate } from '@repo/entity-ts-definition'
import { useStore } from '../../context/StoreContext'
import { assign } from 'lodash-es'
import { useRouter } from '@/i18n/routing'
import { useLocale, useTranslations } from 'next-intl'
import { updateUserInfo } from '@/api/user'
export default function Register() {
  const { userStore } = useStore()
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<TablesUpdate<'users'>>({
    user_name: '',
    user_gender: undefined,
    user_location: undefined,
    user_avatar: undefined,
  })
  const { fileInputRef, handleUpload, onUploadFile, fileList, isUploading } = useUpload()
  const [errors, setErrors] = useState<{
    user_name?: string
  }>({})

  const validateForm = () => {
    const newErrors: typeof errors = {}

    // 验证用户名
    if (!formData.user_name?.trim()) {
      newErrors.user_name = t('请输入用户名')
    } else if (formData.user_name.length < 2 || formData.user_name.length > 20) {
      newErrors.user_name = t('用户名长度必须要在2-20之间')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const onSubmit = async () => {
    if (!validateForm()) return
    setLoading(true)
    try {
      await updateUserInfo(formData)
      await userStore.fetchUserInfo()
      router.push('/', { locale: locale as any })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userStore.userInfo && !userStore.userInfo.user_name) {
      const newFormData = assign(formData, userStore.userInfo)
      setFormData({
        user_name: newFormData.user_name ?? '',
        user_gender: newFormData.user_gender ?? undefined,
        user_location: newFormData.user_location ?? undefined,
        user_avatar: newFormData.user_avatar ?? undefined,
      })
    }
  }, [userStore.userInfo])

  useEffect(() => {
    if (fileList[0]) {
      setFormData((prev) => ({ ...prev, user_avatar: fileList[0] }))
    }
  }, [fileList])

  return (
    <div className="flex justify-center items-center min-h-screen w-full p-4">
      <Card className="max-w-md w-full">
        <CardBody className="flex flex-col gap-4 items-start">
          <p className="text-xl text-center mb-2">{t('profileset')}</p>
          <div className="flex justify-center mb-4">
            <div
              onClick={() => (isUploading ? null : handleUpload())}
              className="relative self-center w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary"
            >
              {fileList[0] ? (
                <Image src={fileList[0]} alt="avatar" className="rounded-full object-cover" />
              ) : isUploading ? (
                <CircularProgress size="lg" aria-label="Loading..." />
              ) : (
                <FaPlus size={36} />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={onUploadFile}
              accept="image/*"
            />
          </div>

          <Input
            label={t('userNAme')}
            variant="bordered"
            isRequired
            isDisabled={loading}
            value={formData.user_name ?? ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, user_name: e.target.value }))}
            errorMessage={errors.user_name}
            isInvalid={!!errors.user_name}
          />

          <Select
            label={t('gender')}
            variant="bordered"
            placeholder="请选择性别"
            isLoading={loading}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, user_gender: parseInt(e.target.value) }))
            }
          >
            <SelectItem key={1}>
              {t('man')}
            </SelectItem>
            <SelectItem key={2}>
              {t('female')}
            </SelectItem>
            <SelectItem key={88}>
              {t('other')}
            </SelectItem>
          </Select>

          <Button
            type="submit"
            color="primary"
            className="w-full"
            onClick={onSubmit}
            isLoading={loading}
          >
            {t('comelete-enter')}
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}
