import MyFooter from '../components/MyFooter'
import NavBar from '../components/NavBar'

export default function HomePage({ children }: any) {
  return (
    <>
      <NavBar />
      <main className="flex-1">{children}</main>
      <MyFooter />
    </>
  )
}
