import { useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useMillonariosPlayers } from '@/hooks/useJugadores'
import { usePlayerMatchHistory } from '@/hooks/usePlayerMatchHistory'
import { GraficaRendimiento } from '@/components/Estadisticas/GraficaRendimiento'
import { MapaPosicionCampo } from '@/components/shared/MapaPosicionCampo'
import { CuadriculaStats } from '@/components/shared/CuadriculaStats'
import { ratingColor } from '@/utils/calculators'
import { posicionEnEspanol } from '@/utils/positions'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function EstadisticasDetalle() {
  const { playerId } = useParams()
  const id = Number(playerId)
  const { data: players } = useMillonariosPlayers()
  const { data: history, isLoading: loadingHistory } = usePlayerMatchHistory(id)
  const player = players?.find((p) => p.playerId === id)

  const heatPositions = useMemo(() => {
    if (!player) return []
    const fromHistory = (history ?? []).map((h) => h.position)
    return [...new Set([...player.positionsPlayed, ...fromHistory])]
  }, [player, history])

  const chartData = useMemo(() => {
    return (history ?? [])
      .filter((h) => h.rating != null)
      .slice(0, 12)
      .reverse()
      .map((h) => ({
        date: new Date(h.date).toLocaleDateString('es-CO', {
          day: 'numeric',
          month: 'short',
        }),
        rating: h.rating!,
      }))
  }, [history])

  if (!player) return <p className="text-slate-500">Jugador no encontrado.</p>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row gap-6">
        <img
          src={player.photo || '/millonarios.svg'}
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
              : 'Intensidad según posiciones reportadas (temporada + últimos partidos)'
          }
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rendimiento por partido</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <GraficaRendimiento data={chartData} />
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
    </div>
  )
}
