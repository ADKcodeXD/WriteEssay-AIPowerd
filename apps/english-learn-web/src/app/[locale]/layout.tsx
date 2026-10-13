import './globals.css'
import { Providers } from './providers'
import { getLocale, getTranslations } from 'next-intl/server'
import { getPublicConfig } from '@/utils/public-config'
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations()

  return {
    title: t('website-title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('website-title'),
      description: t('description'),
      locale: locale,
      siteName: t('website-title'),
      type: 'website',
    },
  }
}

const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  const locale = await getLocale()

  return (
    <html lang={locale}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `window.__WRITEESSAY_CONFIG__=${JSON.stringify(getPublicConfig()).replace(/</g, '\\u003c')};` }} />
      </head>
      <body className="font-sans h-full">
        <Providers>
          <div className="flex flex-col justify-between" style={{ height: '100vh' }}>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}

export default RootLayout
