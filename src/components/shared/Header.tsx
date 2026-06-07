import { Link } from 'react-router-dom'
import { Menu, Search } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { BuscadorGlobal } from './BuscadorGlobal'

export function Header() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-mill-blue text-white shadow-md">
      <div className="mx-auto flex h-full max-w-[1400px] items-center gap-4 px-4 lg:px-6">
        <button
          type="button"
          className="lg:hidden p-2 rounded hover:bg-blue-900"
          onClick={toggleSidebar}
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/Millonarios.png" alt="Millonarios FC" className="h-10 w-auto" />
          <span className="hidden font-bold tracking-tight sm:inline">
            MILLONARIOS ANALYTICS
          </span>
        </Link>
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <BuscadorGlobal compact />
        </div>
        <Link
          to="/buscar"
          className="md:hidden p-2 rounded hover:bg-blue-900"
          aria-label="Buscar"
        >
          <Search className="h-5 w-5" />
        </Link>
      </div>
    </header>
  )
}
