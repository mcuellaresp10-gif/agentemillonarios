import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Users,
  Search,
  Swords,
  Table2,
  Brain,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/calendario', label: 'Calendario', icon: Calendar },
  { to: '/analisis', label: 'Análisis', icon: Brain },
  { to: '/h2h', label: 'H2H', icon: Swords },
  { to: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
  { to: '/scouting', label: 'Scouting', icon: Search },
  { to: '/tabla', label: 'Tabla', icon: Table2 },
  { to: '/buscar', label: 'Búsqueda', icon: Users },
]

export function Sidebar() {
  const open = useAppStore((s) => s.sidebarOpen)
  const setOpen = useAppStore((s) => s.setSidebarOpen)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-[260px] bg-mill-sidebar text-white transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="font-semibold text-sm text-slate-300">Menú</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 rounded hover:bg-slate-800"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-3" aria-label="Principal">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                  isActive
                    ? 'bg-mill-blue text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
