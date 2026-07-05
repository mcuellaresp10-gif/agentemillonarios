import { Link } from 'react-router-dom'
import { Search, TrendingUp, MessageCircle } from 'lucide-react'

export function DashboardHero() {
  return (
    <div className="rounded-xl bg-gradient-to-br from-mill-blue to-blue-900 text-white p-6 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold">Millonarios FC</h1>
      <p className="text-blue-100 mt-1">Análisis táctico, scouting global y simulaciones</p>
      <div className="flex flex-wrap gap-2 mt-5">
        <Link
          to="/scouting"
          className="inline-flex items-center gap-1.5 rounded-md bg-mill-gold px-3 py-2 text-sm font-medium text-slate-900 hover:bg-yellow-300"
        >
          <Search className="h-4 w-4" />
          Scouting
        </Link>
        <Link
          to="/simulacion"
          className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-2 text-sm font-medium hover:bg-white/25"
        >
          <TrendingUp className="h-4 w-4" />
          Simulación
        </Link>
        <Link
          to="/agente"
          className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-2 text-sm font-medium hover:bg-white/25"
        >
          <MessageCircle className="h-4 w-4" />
          Agente
        </Link>
      </div>
    </div>
  )
}
