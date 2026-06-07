import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/store/appStore'
import { searchPlayersByName } from '@/services/apiFootball'
import { TEAM_MILLONARIOS } from '@/config/constants'

export function BuscadorGlobal({ compact }: { compact?: boolean }) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const addSearch = useAppStore((s) => s.addSearch)

  const search = useCallback(async () => {
    const term = q.trim()
    if (term.length < 2) return
    setLoading(true)
    addSearch(term)
    try {
      const players = await searchPlayersByName(term)
      const mill = players.find((p) => p.teamId === TEAM_MILLONARIOS)
      const other = players.find((p) => p.teamId !== TEAM_MILLONARIOS)
      if (mill) navigate(`/estadisticas?player=${mill.playerId}`)
      else if (other) navigate(`/scouting?player=${other.playerId}`)
      else navigate(`/buscar?q=${encodeURIComponent(term)}`)
    } catch {
      navigate(`/buscar?q=${encodeURIComponent(term)}`)
    } finally {
      setLoading(false)
    }
  }, [q, navigate, addSearch])

  return (
    <form
      className={compact ? 'relative w-full' : 'relative flex gap-2 max-w-xl'}
      onSubmit={(e) => {
        e.preventDefault()
        search()
      }}
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar jugador o rival..."
          className={
            compact
              ? 'pl-9 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:bg-white focus:text-slate-900'
              : 'pl-9'
          }
          aria-label="Búsqueda global"
        />
      </div>
      {!compact && (
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-mill-gold px-4 text-sm font-semibold text-mill-blue shrink-0"
        >
          {loading ? '...' : 'Buscar'}
        </button>
      )}
    </form>
  )
}
