import { useParams, useSearchParams } from 'react-router-dom'
import { lazy, Suspense, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getPlayersStatistics } from '@/services/apiFootball'
import { useMillonariosPlayers } from '@/hooks/useJugadores'
import { usePlayerMatchHistory } from '@/hooks/usePlayerMatchHistory'
import { ComparativaJugador } from '@/components/Scouting/ComparativaJugador'

const GraficoRadarComparativa = lazy(() =>
  import('@/components/Scouting/GraficoRadarComparativa').then((m) => ({
    default: m.GraficoRadarComparativa,
  }))
)
const GraficoRedComparativa = lazy(() =>
  import('@/components/Scouting/GraficoRedComparativa').then((m) => ({
    default: m.GraficoRedComparativa,
  }))
)
import { GeneradorAnalisisIA } from '@/components/Analisis/GeneradorAnalisisIA'
import { ClasificacionLiga } from '@/components/shared/ClasificacionLiga'
import { MapaPosicionCampo } from '@/components/shared/MapaPosicionCampo'
import { CuadriculaStats } from '@/components/shared/CuadriculaStats'
import { ValorMercadoCard } from '@/components/Scouting/ValorMercadoCard'
import { usePlayerTransfers } from '@/hooks/usePlayerTransfers'
import { usePlayerMarketValue } from '@/hooks/usePlayerMarket'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  COLOMBIANOS_EXTERIOR_LEAGUES,
  SCOUT_LEAGUES,
} from '@/config/constants'
import {
  defaultSeasonKey,
  getApiSeason,
  SEASON_KEYS,
  seasonKeyLabel,
} from '@/config/scoutSnapshotSeasons'
import { refreshPlayerStats } from '@/services/scoutApi'
import {
  resolveScoutPlayerWithHistory,
  statsSourceLabel,
  type StatsDisplaySource,
} from '@/utils/scoutPlayerResolve'
import type { SeasonKey } from '@/types/scoutSnapshot'
import type { PlayerSeasonStats } from '@/types'
import { posicionEnEspanol } from '@/utils/positions'
import { ratingColor } from '@/utils/calculators'
import { comparePlayers, comparisonSummaryForAI } from '@/utils/playerComparison'
import { cn } from '@/lib/utils'

function leagueMeta(leagueId: number) {
  const all = [...SCOUT_LEAGUES, ...COLOMBIANOS_EXTERIOR_LEAGUES]
  return all.find((l) => l.id === leagueId)
}

interface ScoutPlayerDetail {
  player: PlayerSeasonStats
  source: StatsDisplaySource
}

export default function ScoutingDetalle() {
  const { playerId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const teamId = Number(searchParams.get('team'))
  const leagueId = Number(searchParams.get('league') ?? 0)
  const leagueLabelParam = searchParams.get('leagueLabel') ?? ''
  const seasonKey = (searchParams.get('seasonKey') ?? defaultSeasonKey()) as SeasonKey
  const id = Number(playerId)
  const [refreshing, setRefreshing] = useState(false)

  const leagueMetaResolved = useMemo(() => {
    if (leagueId > 0) return leagueMeta(leagueId)
    return undefined
  }, [leagueId])

  const leagueLabel = leagueLabelParam || leagueMetaResolved?.label || ''

  const { data: detail, isLoading, refetch } = useQuery({
    queryKey: ['scoutPlayerDetail', id, teamId, leagueId, seasonKey],
    queryFn: async (): Promise<ScoutPlayerDetail | null> => {
      if (!id || !teamId) return null
      const meta = {
        leagueId: leagueId || leagueMetaResolved?.id || 0,
        leagueLabel,
      }
      if (!meta.leagueId) return null

      return resolveScoutPlayerWithHistory(
        id,
        teamId,
        meta,
        seasonKey,
        async () => {
          const apiSeason = getApiSeason(meta.leagueId, seasonKey)
          const players = await getPlayersStatistics(teamId, apiSeason)
          return players.find((p) => p.playerId === id) ?? null
        },
      )
    },
    enabled: id > 0 && teamId > 0,
  })

  const candidato = detail?.player ?? null
  const statsSource = detail?.source ?? { kind: 'window' as const, seasonKey }

  const { data: millPlayers } = useMillonariosPlayers(seasonKey)
  const { data: history } = usePlayerMatchHistory(id, teamId)
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

  const comparison = useMemo(
    () => (candidato && actual ? comparePlayers(candidato, actual) : null),
    [candidato, actual],
  )

  const heatPositions = useMemo(() => {
    if (!candidato) return []
    const hist = (history ?? []).map((h) => h.position)
    return [...new Set([...candidato.positionsPlayed, ...hist])]
  }, [candidato, history])

  const handleSeasonChange = (next: SeasonKey) => {
    const params = new URLSearchParams(searchParams)
    params.set('seasonKey', next)
    setSearchParams(params, { replace: true })
  }

  const handleRefreshStats = async () => {
    if (!id || !teamId || !leagueId) return
    setRefreshing(true)
    try {
      await refreshPlayerStats(id, teamId, leagueId, seasonKey, candidato?.teamName, leagueLabel)
      await refetch()
      queryClient.invalidateQueries({ queryKey: ['scoutPool'] })
      queryClient.invalidateQueries({ queryKey: ['teamPlayers'] })
    } finally {
      setRefreshing(false)
    }
  }

  const sourceBanner = statsSourceLabel(statsSource, seasonKey)

  if (isLoading) return <p className="text-slate-500">Cargando candidato…</p>

  if (!candidato) {
    return (
      <div className="space-y-4">
        <p className="text-slate-500">Candidato no encontrado en la base de scouting.</p>
        {leagueId > 0 && (
          <Button type="button" onClick={handleRefreshStats} disabled={refreshing}>
            {refreshing ? 'Consultando API…' : 'Actualizar stats desde API'}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex gap-4 items-start justify-between flex-wrap">
        <div className="flex gap-4 items-start">
          <img
            src={candidato.photo || '/Millonarios.png'}
            alt=""
            className="h-24 w-24 rounded-full object-cover border-2 border-mill-gold/40"
          />
          <div>
            <h1 className="text-2xl font-bold text-mill-blue">{candidato.name}</h1>
            <p className="text-slate-500">
              {candidato.teamName} · {posicionEnEspanol(candidato.position)} ·{' '}
              {candidato.age ?? '—'} años · Temp. {seasonKeyLabel(seasonKey)}
            </p>
            <p className={cn('text-xl font-stats mt-1', ratingColor(candidato.ratingAvg))}>
              Rating {candidato.ratingAvg?.toFixed(1) ?? '—'}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Temporada</label>
            <Select
              value={seasonKey}
              onChange={(e) => handleSeasonChange(e.target.value as SeasonKey)}
            >
              {SEASON_KEYS.map((key) => (
                <option key={key} value={key}>
                  {seasonKeyLabel(key)}
                </option>
              ))}
            </Select>
          </div>
          {leagueId > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRefreshStats}
              disabled={refreshing}
            >
              {refreshing ? 'Actualizando…' : 'Actualizar stats'}
            </Button>
          )}
        </div>
      </div>

      {sourceBanner && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          {sourceBanner}
        </p>
      )}

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
          Comparar con jugador de Millonarios
        </label>
        <Select
          value={compareId}
          onChange={(e) =>
            setCompareId(e.target.value ? Number(e.target.value) : '')
          }
        >
          <option value="">Seleccionar jugador…</option>
          {(millPlayers ?? []).map((p) => (
            <option key={p.playerId} value={p.playerId}>
              {p.name} · {posicionEnEspanol(p.position)} ({p.ratingAvg?.toFixed(1) ?? '—'})
            </option>
          ))}
        </Select>
      </div>

      <ComparativaJugador
        candidato={candidato}
        actual={actual}
        comparison={comparison}
        statsSourceLabel={sourceBanner || undefined}
      />

      {actual && comparison && (
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
          <div className="grid gap-6 lg:grid-cols-2">
            <GraficoRadarComparativa
              candidato={candidato}
              actual={actual}
              comparison={comparison}
            />
            <GraficoRedComparativa
              candidato={candidato}
              actual={actual}
              comparison={comparison}
            />
          </div>
        </Suspense>
      )}

      <ClasificacionLiga player={candidato} seasonKey={seasonKey} />

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
            comparativa: comparison ? comparisonSummaryForAI(comparison) : null,
            fuente: 'Scout DB + snapshot local',
          }}
        />
      </section>
    </div>
  )
}
