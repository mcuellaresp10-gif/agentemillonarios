import { useParams, useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPlayersStatistics } from '@/services/apiFootball'
import { useMillonariosPlayers } from '@/hooks/useJugadores'
import { usePlayerMatchHistory } from '@/hooks/usePlayerMatchHistory'
import { ComparativaJugador } from '@/components/Scouting/ComparativaJugador'
import { GeneradorAnalisisIA } from '@/components/Analisis/GeneradorAnalisisIA'
import { MapaPosicionCampo } from '@/components/shared/MapaPosicionCampo'
import { CuadriculaStats } from '@/components/shared/CuadriculaStats'
import { ValorMercadoCard } from '@/components/Scouting/ValorMercadoCard'
import { usePlayerTransfers } from '@/hooks/usePlayerTransfers'
import { usePlayerMarketValue } from '@/hooks/usePlayerMarket'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SEASON } from '@/config/constants'
import { posicionEnEspanol } from '@/utils/positions'
import { ratingColor } from '@/utils/calculators'
import { cn } from '@/lib/utils'

export default function ScoutingDetalle() {
  const { playerId } = useParams()
  const [searchParams] = useSearchParams()
  const teamId = Number(searchParams.get('team'))
  const id = Number(playerId)

  const { data: teamPlayers } = useQuery({
    queryKey: ['scoutPlayer', teamId, SEASON],
    queryFn: () => getPlayersStatistics(teamId, SEASON),
    enabled: teamId > 0,
  })

  const { data: millPlayers } = useMillonariosPlayers()
  const { data: history } = usePlayerMatchHistory(id, teamId)
  const candidato = teamPlayers?.find((p) => p.playerId === id)
  const [compareId, setCompareId] = useState<number | ''>('')
  const { data: transfer, isLoading: loadingTransfer } = usePlayerTransfers(id, !!candidato)
  const { data: market, isLoading: loadingMarket } = usePlayerMarketValue(
    candidato ?? null,
    !!candidato,
  )

  const actual = useMemo(
    () => millPlayers?.find((p) => p.playerId === compareId) ?? null,
    [millPlayers, compareId],
  )

  const heatPositions = useMemo(() => {
    if (!candidato) return []
    const hist = (history ?? []).map((h) => h.position)
    return [...new Set([...candidato.positionsPlayed, ...hist])]
  }, [candidato, history])

  if (!candidato) return <p className="text-slate-500">Candidato no encontrado.</p>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex gap-4 items-start">
        <img
          src={candidato.photo || '/millonarios.svg'}
          alt=""
          className="h-24 w-24 rounded-full object-cover border-2 border-mill-gold/40"
        />
        <div>
          <h1 className="text-2xl font-bold text-mill-blue">{candidato.name}</h1>
          <p className="text-slate-500">
            {candidato.teamName} · {posicionEnEspanol(candidato.position)} ·{' '}
            {candidato.age ?? '—'} años
          </p>
          <p className={cn('text-xl font-stats mt-1', ratingColor(candidato.ratingAvg))}>
            Rating {candidato.ratingAvg?.toFixed(1) ?? '—'}
          </p>
        </div>
      </div>

      <MapaPosicionCampo
        positions={heatPositions}
        titulo="Mapa de posición en el campo"
        subtitulo="Zonas donde se ha desempeñado según datos de la API"
      />

      <ValorMercadoCard
        transfer={transfer ?? null}
        market={market}
        loadingTransfer={loadingTransfer}
        loadingMarket={loadingMarket}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estadísticas de temporada</CardTitle>
        </CardHeader>
        <CardContent>
          <CuadriculaStats player={candidato} />
        </CardContent>
      </Card>

      <div>
        <label className="text-sm text-slate-500 block mb-1">
          Comparar con jugador de Millonarios (misma posición)
        </label>
        <Select
          value={compareId}
          onChange={(e) =>
            setCompareId(e.target.value ? Number(e.target.value) : '')
          }
        >
          <option value="">Seleccionar jugador…</option>
          {(millPlayers ?? [])
            .filter((p) =>
              posicionEnEspanol(p.position).includes(
                posicionEnEspanol(candidato.position).slice(0, 4),
              ),
            )
            .map((p) => (
              <option key={p.playerId} value={p.playerId}>
                {p.name} ({p.ratingAvg?.toFixed(1) ?? '—'})
              </option>
            ))}
        </Select>
      </div>

      <ComparativaJugador candidato={candidato} actual={actual} />

      <section>
        <h2 className="text-lg font-semibold text-mill-blue mb-3">
          Reporte de scout (IA)
        </h2>
        <GeneradorAnalisisIA
          partidoId={`scout-${id}`}
          tipo="scout"
          contexto={{
            candidato,
            millonarios_actual: actual,
            fuente: 'API-Football',
          }}
        />
      </section>
    </div>
  )
}
