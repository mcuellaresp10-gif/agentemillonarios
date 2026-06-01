import { useState, useMemo } from 'react'
import { useMillonariosPlayers } from '@/hooks/useJugadores'
import { JugadorCard } from '@/components/Estadisticas/JugadorCard'
import { FiltrosJugadores } from '@/components/shared/FiltrosJugadores'
import { filterPlayers, sortPlayers, type SortField } from '@/utils/filters'
import { DashboardSkeleton } from '@/components/shared/Loading'

export default function Estadisticas() {
  const { data: players, isLoading } = useMillonariosPlayers()
  const [position, setPosition] = useState('all')
  const [minRating, setMinRating] = useState(0)
  const [sortField, setSortField] = useState<SortField>('ratingAvg')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(() => {
    let list = filterPlayers(players ?? [], {
      position: position === 'all' ? undefined : position,
      minRating: minRating || undefined,
    })
    return sortPlayers(list, sortField, sortDir)
  }, [players, position, minRating, sortField, sortDir])

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else {
      setSortField(field as SortField)
      setSortDir('desc')
    }
  }

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-mill-blue">Estadísticas</h1>
        <p className="text-slate-500">
          Plantilla Millonarios FC · datos consolidados de temporada
        </p>
      </div>
      <FiltrosJugadores
        position={position}
        onPosition={setPosition}
        minRating={minRating}
        onMinRating={setMinRating}
        sortField={sortField}
        sortDir={sortDir}
        onSort={toggleSort}
        extraSortFields={['xG90', 'keyPasses', 'duelsWonPct']}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <JugadorCard key={p.playerId} player={p} />
        ))}
      </div>
      {!filtered.length && (
        <p className="text-slate-500">No hay jugadores con estos filtros.</p>
      )}
    </div>
  )
}
