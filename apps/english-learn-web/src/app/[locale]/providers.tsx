import { HeroUIProvider } from "@heroui/react"
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { StoreProvider } from './context/StoreContext'
export async function Providers({ children }: { children: React.ReactNode }) {
  const messages = await getMessages()
  return (
    <NextIntlClientProvider messages={messages}>
      <StoreProvider>
        <HeroUIProvider>
          <NextThemesProvider defaultTheme="dark">{children}</NextThemesProvider>
        </HeroUIProvider>
      </StoreProvider>
    </NextIntlClientProvider>
  )
}
