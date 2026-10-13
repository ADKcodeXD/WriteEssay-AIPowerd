'use client'
import { getSiteOrigin } from '@/utils/public-config'
import React, { useState } from 'react'
import { Card, CardBody, Input, Button, CardHeader, Link } from "@heroui/react"
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { toast } from 'react-toastify'
import { createClient } from '@/utils/supabase/client'

export default function RegisterNew() {
  const router = useRouter()
  const t = useTranslations()
  const locale = useLocale()
  const [isSend, setIsSend] = useState(false)
  const [formData, setFormData] = useState<{
    email: string
    password: string
  }>({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState<{
    email?: string
    password?: string
  }>({})

  const validateForm = () => {
    const newErrors: typeof errors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      newErrors.email = t('invalidEmail')
    }

    if (formData.password.length < 6 || formData.password.length > 16) {
      newErrors.password = t('passwordLengthError')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignUp = async () => {
    if (!validateForm()) return

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${getSiteOrigin()}/${locale}/auth/callback`,
        },
      })
      if (error) throw error
      setIsSend(true)
    } catch (error) {
      toast.error(error as any)
    }
  }

  return (
    <Card className="max-w-md w-full">
      <CardHeader className="flex flex-col gap-2 items-start">
        <p className="text-sm">注册到WritingEssay 使用AI作文评分服务</p>
        <span className="text-xs text-foreground/50">
          回到
          <Link
            className="cursor-pointer text-xs"
            onClick={() => router.push('/auth/login', { locale })}
          >
            登录
          </Link>
          页
        </span>
      </CardHeader>
      <CardBody className="flex flex-col gap-4 items-start">
        <Input
          label={t('email')}
          variant="bordered"
          isRequired
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          errorMessage={errors.email}
          isInvalid={!!errors.email}
        />
        <Input
          label={t('password')}
          variant="bordered"
          type="password"
          isRequired
          value={formData.password}
          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
          errorMessage={errors.password}
          isInvalid={!!errors.password}
        />
        {!isSend && (
          <Button color="primary" className="w-full" onClick={handleSignUp}>
            {t('register')}
          </Button>
        )}
      </CardBody>
    </Card>
  )
}
