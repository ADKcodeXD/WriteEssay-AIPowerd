'use client'
import { getSiteOrigin } from '@/utils/public-config'
import { createClient } from '@/utils/supabase/client'
import { Button, Card, CardBody, CardFooter, Checkbox, Input, Link, Tooltip } from '@heroui/react'
import { useLocale, useTranslations } from 'next-intl'
import React, { useState } from 'react'
import { FaGithub, FaGoogle } from 'react-icons/fa6'
import { motion } from 'framer-motion'
import { Provider } from '@supabase/supabase-js'
import { toast } from 'react-toastify'
import { useRouter } from '@/i18n/routing'

export default function LoginPage() {
  const locale = useLocale()
  const t = useTranslations()
  const router = useRouter()
  const [validateMap, setValidateMap] = useState({
    email: true,
    password: true,
    confirmPassword: true,
  })

  const [formState, setFormState] = useState({
    email: '',
    password: '',
  })

  const [isChecked, setIsChecked] = useState(false)
  const [showCheckboxError, setShowCheckboxError] = useState(false)
  const [isUsePassword, setIsUsePassword] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [emailSent, setEmailSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleThirdPartyLogin = async (provider: Provider) => {
    if (!isChecked) {
      setShowCheckboxError(true)
      setTimeout(() => setShowCheckboxError(false), 500)
      return
    }
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${getSiteOrigin()}/${locale}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    })
  }

  const handleLoginWithEmail = async () => {
    setIsLoading(true)
    if (!validateForm()) {
      setIsLoading(false)
      return
    }
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOtp({
      email: formState.email,
      options: {
        emailRedirectTo: `${getSiteOrigin()}/${locale}/auth/callback`,
        shouldCreateUser: true,
      },
    })

    if (error) {
      toast.error(t(error.message))
      setIsLoading(false)
      return
    }

    setEmailSent(true)
    setCountdown(60)
    setIsLoading(false)

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isValid = regex.test(email)
    setValidateMap({ ...validateMap, email: isValid ? true : false })
    return isValid
  }

  const validateForm = () => {
    if (!isChecked) {
      setShowCheckboxError(true)
      setTimeout(() => setShowCheckboxError(false), 500)
      return false
    }
    return validateEmail(formState.email)
  }

  return (
    <Card
      className="p-2 w-1/2 shadow-2xl shadow-primary-100 max-md:w-4/5"
      isBlurred
      style={{ maxWidth: '600px' }}
    >
      <CardBody className="overflow-visible w-full flex flex-col">
        <p className="text-xl my-2">{t('onclicklogin')}</p>
        {!emailSent && (
          <Input
            isRequired
            type="email"
            label={t('email')}
            placeholder={t('enter-your-email')}
            value={formState.email}
            isInvalid={!validateMap.email}
            errorMessage={t('email-invalid')}
            variant="underlined"
            isDisabled={isLoading}
            onChange={(e) => setFormState({ ...formState, email: e.target.value })}
            className="my-2"
          />
        )}
        {!emailSent && isUsePassword && (
          <Input
            isRequired
            type="password"
            label="密码"
            placeholder="请输入你的密码"
            value={formState.password}
            isInvalid={!validateMap.password}
            errorMessage="请输入你的密码！"
            variant="underlined"
            onChange={(e) => setFormState({ ...formState, password: e.target.value })}
            className="my-2"
            isDisabled={isLoading}
          />
        )}
        {emailSent && <div className="text-foreground-400 mb-4">{t('alreadysent')}</div>}
        {
          <Button
            color="primary"
            variant="flat"
            className="min-w-24 self-end"
            onClick={handleLoginWithEmail}
            isLoading={isLoading}
            isDisabled={countdown > 0}
          >
            {countdown > 0 ? `${t('resetn', { count: countdown })}` : t('login')}
          </Button>
        }
      </CardBody>
      <CardFooter className="flex flex-col w-full">
        <div className="grid grid-cols-2 gap-2 self-end">
          <Tooltip content={t('sign-in-with-google')}>
            <Button
              startContent={<FaGoogle />}
              color="secondary"
              variant="ghost"
              isIconOnly
              onClick={() => handleThirdPartyLogin('google')}
            ></Button>
          </Tooltip>
          <Tooltip content={t('sign-in-with-github')}>
            <Button
              startContent={<FaGithub />}
              color="secondary"
              variant="ghost"
              isIconOnly
              onPress={() => handleThirdPartyLogin('github')}
            ></Button>
          </Tooltip>
        </div>
        <motion.div
          animate={showCheckboxError ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <Checkbox size="sm" className="mt-2" isSelected={isChecked} onValueChange={setIsChecked}>
            {t('i-agree-to')}{' '}
            <a
              href="https://essay-ailearn.top/terms-conditions/"
              className="text-primary hover:underline"
              target="_blank"
            >
              {t('terms-of-service')}
            </a>{' '}
            {t('and')}{' '}
            <a
              href="https://essay-ailearn.top/privacy-policy/"
              className="text-primary hover:underline"
              target="_blank"
            >
              {t('privacy-policy')}
            </a>
          </Checkbox>
        </motion.div>
      </CardFooter>
    </Card>
  )
}
