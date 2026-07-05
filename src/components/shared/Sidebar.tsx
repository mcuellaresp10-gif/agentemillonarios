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
  TrendingUp,
  MessageCircle,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'

const sections = [
  {
    label: 'Club',
    links: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/calendario', label: 'Calendario', icon: Calendar },
      { to: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
      { to: '/tabla', label: 'Tabla', icon: Table2 },
    ],
  },
  {
    label: 'Análisis',
    links: [
      { to: '/analisis', label: 'Análisis IA', icon: Brain },
      { to: '/h2h', label: 'H2H', icon: Swords },
      { to: '/simulacion', label: 'Simulación', icon: TrendingUp },
    ],
  },
  {
    label: 'Mercado',
    links: [
      { to: '/scouting', label: 'Scouting', icon: Search },
      { to: '/buscar', label: 'Búsqueda', icon: Users },
      { to: '/agente', label: 'Agente', icon: MessageCircle },
    ],
  },
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
        <nav className="flex flex-col gap-4 p-3" aria-label="Principal">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {section.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.links.map(({ to, label, icon: Icon }) => (
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
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
