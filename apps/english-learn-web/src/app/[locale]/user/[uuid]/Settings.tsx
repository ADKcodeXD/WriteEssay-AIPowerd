import { Card, CardBody, CardHeader } from '@heroui/react'
import { useTranslations } from 'next-intl'

export default function Settings() {
  const t = useTranslations()
  return (
    <div className="w-full h-full flex items-start justify-center p-4">
      <Card className="w-full">
        <CardHeader><h2 className="text-xl font-medium">{t('global-settings')}</h2></CardHeader>
        <CardBody><p className="text-foreground-500 text-sm">{t('ai-managed-model-desc')}</p></CardBody>
      </Card>
    </div>
  )
}
