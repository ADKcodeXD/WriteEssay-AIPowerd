'use client'
import MyFooter from '../components/MyFooter'
import NavBar from '../components/NavBar'
import Toast from '../components/Toast/ToastContainer'

export default function HomePage({ children }: any) {
  return (
    <>
      <NavBar />
      <main className="flex-1 p-2 overflow-auto">{children}</main>
      <Toast />
      <MyFooter />
    </>
  )
}
