import { useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useMillonariosPlayers } from '@/hooks/useJugadores'
import { usePlayerMatchHistory } from '@/hooks/usePlayerMatchHistory'
import { GraficaRendimiento } from '@/components/Estadisticas/GraficaRendimiento'
import { MapaPosicionCampo } from '@/components/shared/MapaPosicionCampo'
import { CuadriculaStats } from '@/components/shared/CuadriculaStats'
import { ClasificacionLiga } from '@/components/shared/ClasificacionLiga'
import { ratingColor } from '@/utils/calculators'
import { posicionEnEspanol } from '@/utils/positions'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { defaultSeasonKey } from '@/config/scoutSnapshotSeasons'

export default function EstadisticasDetalle() {
  const { playerId } = useParams()
  const id = Number(playerId)
  const { data: players } = useMillonariosPlayers()
  const { data: history, isLoading: loadingHistory } = usePlayerMatchHistory(id)
  const player = players?.find((p) => p.playerId === id)

  const heatPositions = useMemo(() => {
    if (!player) return []
    // Sin deduplicar: cada aparición cuenta como peso +1 en el blob
    const fromHistory = (history ?? [])
      .filter((h) => h.position && h.position !== '—' && h.minutes > 0)
      .map((h) => h.position)
    return [...player.positionsPlayed, ...fromHistory]
  }, [player, history])

  const positionBreakdown = useMemo(() => {
    const groups: Record<string, { games: number; minutes: number; ratings: number[] }> = {}
    for (const h of history ?? []) {
      const pos = h.position
      if (!pos || pos === '—' || h.minutes === 0) continue
      if (!groups[pos]) groups[pos] = { games: 0, minutes: 0, ratings: [] }
      groups[pos].games++
      groups[pos].minutes += h.minutes
      if (h.rating != null) groups[pos].ratings.push(h.rating)
    }
    return Object.entries(groups)
      .map(([pos, d]) => ({
        position: pos,
        games: d.games,
        minutes: d.minutes,
        avgRating: d.ratings.length
          ? Math.round((d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length) * 10) / 10
          : null,
      }))
      .sort((a, b) => b.minutes - a.minutes)
  }, [history])

  const chartData = useMemo(() => {
    return (history ?? [])
      .filter((h) => h.rating != null && h.minutes > 0)
      .slice(0, 12)
      .reverse()
      .map((h) => ({
        date: new Date(h.date).toLocaleDateString('es-CO', {
          day: 'numeric',
          month: 'short',
        }),
        rating: h.rating!,
        opponent: h.opponent,
        minutes: h.minutes,
        result: h.result,
      }))
  }, [history])

  if (!player) return <p className="text-slate-500">Jugador no encontrado.</p>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row gap-6">
        <img
          src={player.photo || '/Millonarios.png'}
          alt=""
          className="h-28 w-28 rounded-full object-cover border-4 border-mill-gold/50"
          loading="lazy"
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-mill-blue">{player.name}</h1>
          <p className="text-slate-500 mt-1">
            {posicionEnEspanol(player.position)} · Dorsal #{player.number ?? '—'} ·{' '}
            {player.age ?? '—'} años · {player.nationality}
          </p>
          <p className={cn('text-2xl font-stats font-semibold mt-2', ratingColor(player.ratingAvg))}>
            Rating {player.ratingAvg?.toFixed(1) ?? '—'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MapaPosicionCampo
          positions={heatPositions.length ? heatPositions : player.positionsPlayed}
          titulo="Zonas de desempeño"
          subtitulo={
            loadingHistory
              ? 'Cargando historial por partido…'
              : 'Intensidad según minutos jugados por posición'
          }
          breakdown={positionBreakdown.length ? positionBreakdown : undefined}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rendimiento por partido</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <GraficaRendimiento data={chartData} avgRating={player.ratingAvg ?? undefined} />
            ) : (
              <p className="text-sm text-slate-500">
                {loadingHistory
                  ? 'Cargando ratings…'
                  : 'Sin ratings por partido en la API para este jugador.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estadísticas detalladas</CardTitle>
        </CardHeader>
        <CardContent>
          <CuadriculaStats player={player} />
        </CardContent>
      </Card>

      <ClasificacionLiga player={player} seasonKey={defaultSeasonKey()} />
    </div>
  )
}
