import MyFooter from '../../components/MyFooter'
import NavBar from '../../components/NavBar'
import Toast from '../../components/Toast/ToastContainer'

export default function HomePage({ children }: any) {
  return (
    <div className="flex flex-col h-full">
      <NavBar position="static" />
      <main className="flex-1 overflow-auto">{children}</main>
      <Toast />
      <MyFooter />
    </div>
  )
}
