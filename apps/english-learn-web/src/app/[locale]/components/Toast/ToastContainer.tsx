'use client'
import { Bounce, ToastContainer } from 'react-toastify'
import { useTheme } from 'next-themes'
import 'react-toastify/dist/ReactToastify.css'

export default function Toast() {
  const { theme } = useTheme()
  return (
    <ToastContainer
      position="top-center"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      draggable
      pauseOnHover
      theme={theme === 'dark' ? 'dark' : 'light'}
      transition={Bounce}
    />
  )
}
