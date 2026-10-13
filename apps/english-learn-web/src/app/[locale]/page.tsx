import { redirect } from '@/i18n/routing'
import MyFooter from './components/MyFooter'
import NavBar from './components/NavBar'
import { useLocale } from 'next-intl'

export default function HomePage() {
  const locale = useLocale()
  redirect({ href: '/broswer', locale })
  return (
    <>
      <NavBar />
      <main className="flex-1"></main>
      <MyFooter />
    </>
  )
}
