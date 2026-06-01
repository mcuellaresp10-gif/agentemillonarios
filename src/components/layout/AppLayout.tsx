import { Outlet } from 'react-router-dom'
import { Header } from '@/components/shared/Header'
import { Sidebar } from '@/components/shared/Sidebar'
import { Footer } from '@/components/shared/Footer'

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Sidebar />
      <main className="flex-1 pt-16 lg:pl-[260px]">
        <div className="mx-auto max-w-[1400px] p-6 fade-in">
          <Outlet />
        </div>
      </main>
      <div className="lg:pl-[260px]">
        <Footer />
      </div>
    </div>
  )
}
