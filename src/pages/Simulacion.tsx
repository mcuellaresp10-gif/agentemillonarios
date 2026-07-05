import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { TrendingUp, Dices, Info, CalendarClock, Star, History, Loader2 } from 'lucide-react'
import {
  useMonteCarlo,
  TOTAL_SEASON_GAMES,
  SEASON_LABEL,
  EXTRA_MATCH_RIVAL,
  CLASSIFICATION_PTS_MIN,
  CLASSIFICATION_PTS_MAX,
  MILLONARIOS_HISTORICAL_RATES,
} from '@/hooks/useMonteCarlo'
import type { SimScenario } from '@/utils/monteCarlo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardSkeleton } from '@/components/shared/Loading'
import { cn } from '@/lib/utils'
import type { OpponentH2H } from '@/hooks/useAllH2H'
import { useNextFixture } from '@/hooks/usePartidos'
import { useLigaStandings } from '@/hooks/useStandings'
import { useMillonariosPlayers } from '@/hooks/useJugadores'
import { MatchSimulationPreview } from '@/components/Dashboard/MatchSimulationPreview'

type SimTab = 'temporada' | 'partido'

// ─── Historial de Millonarios ─────────────────────────────────────────────────

const HISTORICO = [
  { torneo: '2023-1', pts: 38, pos: 2, clasifico: true },
  { torneo: '2023-2', pts: 30, pos: 7, clasifico: true },
  { torneo: '2024-1', pts: 31, pos: 6, clasifico: true },
  { torneo: '2024-2', pts: 35, pos: 3, clasifico: true },
  { torneo: '2025-1', pts: 31, pos: null, clasifico: true },
  { torneo: '2025-2', pts: 26, pos: null, clasifico: false },
  { torneo: '2026-1', pts: 26, pos: null, clasifico: false },
]

// ─── Escenarios ───────────────────────────────────────────────────────────────

const SCENARIOS: Array<{ key: SimScenario; label: string; description: string }> = [
  {
    key: 'realistic',
    label: 'Realista',
    description:
      'Usa las tasas H2H históricas de Millonarios vs cada rival específico. El resto de equipos usa su racha del torneo anterior.',
  },
  {
    key: 'optimistic',
    label: 'Optimista',
    description:
      'Millonarios mejora un 50% su tasa de victoria H2H vs cada rival (×1.5, máx 95%). Resto de equipos igual al realista.',
  },
  {
    key: 'pessimistic',
    label: 'Pesimista',
    description:
      'Millonarios reduce un 50% su tasa de victoria H2H vs cada rival (×0.5). Resto de equipos igual al realista.',
  },
  {
    key: 'form',
    label: 'Racha reciente',
    description:
      'Usa solo los últimos 5 partidos H2H vs cada rival como estimador. Resto de equipos en tasa neutra.',
  },
]

// ─── Helpers visuales ─────────────────────────────────────────────────────────

function getProbabilityColor(p: number) {
  if (p >= 0.7) return 'text-emerald-600'
  if (p >= 0.4) return 'text-amber-500'
  return 'text-red-500'
}
function getProbabilityBg(p: number) {
  if (p >= 0.7) return 'bg-emerald-50 border-emerald-200'
  if (p >= 0.4) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}
function getProbabilityLabel(p: number) {
  if (p >= 0.85) return 'Muy alta'
  if (p >= 0.7) return 'Alta'
  if (p >= 0.55) return 'Media-alta'
  if (p >= 0.4) return 'Media'
  if (p >= 0.25) return 'Baja'
  return 'Muy baja'
}

// ─── Componente de métrica ────────────────────────────────────────────────────

function StatCard({ label, value, sub, highlight }: {
  label: string; value: string | number; sub?: string; highlight?: boolean
}) {
  return (
    <div className={cn(
      'rounded-lg border p-4 text-center',
      highlight ? 'border-mill-blue/20 bg-blue-50/60' : 'border-slate-100 bg-slate-50/80',
    )}>
      <p className="text-[11px] text-slate-500 leading-tight">{label}</p>
      <p className="text-2xl font-stats font-semibold text-mill-blue mt-1">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Tooltip del gráfico ──────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-mill-blue">Posición {label}°</p>
      <p className="text-slate-600">{payload[0].value.toFixed(1)}% de simulaciones</p>
    </div>
  )
}

// ─── Fila de la tabla H2H por rival ──────────────────────────────────────────

function H2HRow({ opp, isExtra }: { opp: OpponentH2H; isExtra: boolean }) {
  const winPct = Math.round(opp.rates.winRate * 100)
  const drawPct = Math.round(opp.rates.drawRate * 100)
  const losePct = 100 - winPct - drawPct

  const winColor =
    winPct >= 55 ? 'text-emerald-600' : winPct >= 40 ? 'text-amber-600' : 'text-red-500'
  const barColor =
    winPct >= 55 ? 'bg-emerald-500' : winPct >= 40 ? 'bg-amber-400' : 'bg-red-400'

  return (
    <tr className={cn(
      'border-b border-slate-50 hover:bg-slate-50/60 transition-colors',
      isExtra ? 'bg-amber-50/40' : '',
    )}>
      <td className="py-2 pr-2">
        <div className="flex items-center gap-2">
          {opp.teamLogo && (
            <img src={opp.teamLogo} alt="" className="h-5 w-5 object-contain shrink-0" />
          )}
          <span className="text-sm font-medium text-slate-700 truncate">{opp.teamName}</span>
          {isExtra && (
            <Badge variant="warning" className="text-[9px] py-0 px-1 shrink-0">Clásico</Badge>
          )}
        </div>
      </td>
      <td className="py-2 text-center text-xs text-slate-500 tabular-nums">
        {opp.played > 0 ? `${opp.wins}G-${opp.draws}E-${opp.losses}P` : '—'}
      </td>
      <td className="py-2 text-center text-xs text-slate-400 tabular-nums">
        {opp.played > 0 ? opp.played : '—'}
      </td>
      <td className="py-2 text-right">
        <span className={cn('text-sm font-stats font-bold tabular-nums', winColor)}>
          {winPct}%
        </span>
      </td>
      <td className="py-2 pl-2">
        <div className="flex items-center gap-1">
          <div className="h-2 rounded-full bg-slate-100 flex-1 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', barColor)}
              style={{ width: `${winPct}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 w-8 text-right tabular-nums">
            D:{drawPct}% L:{losePct}%
          </span>
        </div>
      </td>
    </tr>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Simulacion() {
  const [tab, setTab] = useState<SimTab>('temporada')
  const [scenario, setScenario] = useState<SimScenario>('realistic')
  const { result, isLoading, isNewSeason, h2hData, santaFeId } = useMonteCarlo(scenario)
  const next = useNextFixture()
  const standings = useLigaStandings()
  const millPlayers = useMillonariosPlayers()

  if (isLoading) return <DashboardSkeleton />

  const prob = result?.probability ?? 0
  const scenarioInfo = SCENARIOS.find((s) => s.key === scenario)!

  const chartData = Array.from({ length: 20 }, (_, i) => {
    const pos = i + 1
    const count = result?.positionDistribution[pos] ?? 0
    const pct = result ? (count / 10000) * 100 : 0
    return { pos, pct: Math.round(pct * 10) / 10 }
  })

  const historicalExpectedPts = Math.round(
    MILLONARIOS_HISTORICAL_RATES.winRate * TOTAL_SEASON_GAMES * 3 +
    MILLONARIOS_HISTORICAL_RATES.drawRate * TOTAL_SEASON_GAMES,
  )

  // Ordenar rivales: primero los que tienen H2H (ordenados por winRate asc = rivales difíciles primero)
  const sortedOpponents = [...h2hData.opponents].sort((a, b) => a.rates.winRate - b.rates.winRate)

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mill-blue text-white">
          <Dices className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-mill-blue">Simulación Monte Carlo</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Probabilidad de clasificar al top 8 · Liga BetPlay {SEASON_LABEL}
          </p>
        </div>
      </div>

      <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm w-fit">
        <button
          type="button"
          onClick={() => setTab('partido')}
          className={cn(
            'px-4 py-2 transition-colors',
            tab === 'partido' ? 'bg-mill-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-50',
          )}
        >
          Próximo partido
        </button>
        <button
          type="button"
          onClick={() => setTab('temporada')}
          className={cn(
            'px-4 py-2 transition-colors',
            tab === 'temporada' ? 'bg-mill-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-50',
          )}
        >
          Temporada completa
        </button>
      </div>

      {tab === 'partido' && (
        <div className="max-w-lg">
          {next.data ? (
            <MatchSimulationPreview
              fixture={next.data}
              standings={standings.data ?? []}
              millPlayers={millPlayers.data}
            />
          ) : (
            <p className="text-slate-500">No hay próximo partido programado.</p>
          )}
        </div>
      )}

      {tab === 'temporada' && (
      <>
      {/* ── Banner nueva temporada ── */}
      {isNewSeason && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <CalendarClock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <span className="font-semibold">Temporada 2026-2 por iniciar (julio 2026).</span>{' '}
            Todos los equipos parten desde 0 puntos. La simulación usa datos H2H históricos
            de Millonarios vs cada rival específico.
          </div>
        </div>
      )}

      {/* ── Progreso de carga H2H ── */}
      {h2hData.isLoading && h2hData.totalCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
          <Loader2 className="h-4 w-4 shrink-0 text-mill-blue animate-spin" />
          <div className="flex-1">
            <p className="text-sm text-mill-blue font-medium">
              Cargando datos H2H… {h2hData.loadedCount}/{h2hData.totalCount} rivales
            </p>
            <div className="mt-1 h-1.5 rounded-full bg-blue-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-mill-blue transition-all"
                style={{ width: `${(h2hData.loadedCount / h2hData.totalCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Estructura del torneo ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-center">
          <p className="text-[10px] text-slate-500">Todos contra todos</p>
          <p className="text-xl font-stats font-bold text-mill-blue">19</p>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Star className="h-3 w-3 text-amber-500" />
            <p className="text-[10px] text-amber-700 font-medium">Jornada de clásico</p>
          </div>
          <p className="text-xl font-stats font-bold text-amber-700">vs {EXTRA_MATCH_RIVAL}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-center">
          <p className="text-[10px] text-slate-500">Total partidos</p>
          <p className="text-xl font-stats font-bold text-mill-blue">{TOTAL_SEASON_GAMES}</p>
        </div>
      </div>

      {/* ── Selector de escenario ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Escenario de simulación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setScenario(s.key)}
                className={cn(
                  'rounded-lg border px-3 py-2.5 text-sm font-medium text-left transition-all',
                  scenario === s.key
                    ? 'border-mill-blue bg-mill-blue text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-mill-blue/40 hover:bg-slate-50',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">{scenarioInfo.description}</p>
        </CardContent>
      </Card>

      {/* ── Probabilidad principal ── */}
      <Card className={cn('border-2', result ? getProbabilityBg(prob) : 'border-slate-100')}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-2 py-4">
            <TrendingUp className={cn('h-8 w-8', result ? getProbabilityColor(prob) : 'text-slate-400')} />
            <p className="text-sm font-medium text-slate-600">
              Probabilidad de clasificar al top 8 · Liga BetPlay {SEASON_LABEL}
            </p>
            {result ? (
              <>
                <p className={cn('text-7xl font-black font-stats tabular-nums', getProbabilityColor(prob))}>
                  {(prob * 100).toFixed(1)}%
                </p>
                <Badge variant={prob >= 0.7 ? 'success' : prob >= 0.4 ? 'warning' : 'danger'} className="text-xs">
                  {getProbabilityLabel(prob)}
                </Badge>
              </>
            ) : (
              <p className="text-xl text-slate-400">Sin datos disponibles</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Métricas resumen ── */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {isNewSeason ? (
            <>
              <StatCard label="Puntos de partida" value="0" sub="nueva temporada" highlight />
              <StatCard
                label="Partidos totales"
                value={TOTAL_SEASON_GAMES}
                sub={`19 todos vs todos + clásico vs ${EXTRA_MATCH_RIVAL}`}
              />
              <StatCard
                label="Umbral clasificación (hist.)"
                value={`${CLASSIFICATION_PTS_MIN}–${CLASSIFICATION_PTS_MAX}`}
                sub="pts estimados para top 8 en 20 fechas"
              />
              <StatCard
                label="Puntos proyectados"
                value={`${result.p10Points}–${result.p90Points}`}
                sub="rango esperado (P10–P90)"
              />
            </>
          ) : (
            <>
              <StatCard label="Posición actual" value={result.currentRank != null ? `${result.currentRank}°` : '—'} sub="en la tabla" />
              <StatCard label="Puntos actuales" value={result.currentPoints} sub="pts acumulados" />
              <StatCard label="Partidos restantes" value={result.remainingGames} sub="jornadas pendientes" />
              <StatCard label="Puntos proyectados" value={`${result.p10Points}–${result.p90Points}`} sub="rango esperado (P10–P90)" />
            </>
          )}
        </div>
      )}

      {/* ── Tabla H2H por rival ── */}
      {h2hData.opponents.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Probabilidad de victoria por rival (H2H histórico)</CardTitle>
            <p className="text-xs text-slate-500">
              Ordenados de más difícil a más accesible según el historial H2H.
              {h2hData.isLoading && (
                <span className="text-amber-600 ml-1">
                  Usando fallback histórico mientras cargan los datos…
                </span>
              )}
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] text-slate-500">
                    <th className="py-2 text-left font-medium">Rival</th>
                    <th className="py-2 text-center font-medium">Historial</th>
                    <th className="py-2 text-center font-medium">PJ</th>
                    <th className="py-2 text-right font-medium">P(Victoria)</th>
                    <th className="py-2 pl-2 text-left font-medium">Visual</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOpponents.map((opp) => (
                    <H2HRow
                      key={opp.teamId}
                      opp={opp}
                      isExtra={opp.teamId === santaFeId}
                    />
                  ))}
                  {/* Fila del clásico extra si Santa Fe no está en los 19 */}
                  {santaFeId && !h2hData.opponents.find(o => o.teamId === santaFeId) && (
                    <tr className="border-b border-slate-50 bg-amber-50/40">
                      <td colSpan={5} className="py-2 text-xs text-amber-700 text-center">
                        Clásico extra vs {EXTRA_MATCH_RIVAL} — datos incluidos en la fila de arriba
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10px] text-slate-400">
              * PJ = partidos jugados históricamente. Si es 0, se usa el promedio histórico de Millonarios como fallback.
              El clásico vs Santa Fe se cuenta dos veces en la simulación.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Historial de Millonarios ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-mill-blue" />
            <CardTitle className="text-base">Historial Millonarios — Últimos 7 torneos</CardTitle>
          </div>
          <p className="text-xs text-slate-500">
            Umbral histórico de clasificación (top 8):{' '}
            <strong>28–31 pts en 19 fechas</strong> → estimado{' '}
            <strong>{CLASSIFICATION_PTS_MIN}–{CLASSIFICATION_PTS_MAX} pts en 20 fechas</strong>
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] text-slate-500">
                  <th className="py-1.5 text-left font-medium">Torneo</th>
                  <th className="py-1.5 text-center font-medium">Pts</th>
                  <th className="py-1.5 text-center font-medium">Pos</th>
                  <th className="py-1.5 text-center font-medium">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {HISTORICO.map((h) => (
                  <tr key={h.torneo} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="py-1.5 font-medium text-slate-700">{h.torneo}</td>
                    <td className="py-1.5 text-center font-stats font-semibold text-mill-blue">{h.pts}</td>
                    <td className="py-1.5 text-center text-slate-500">{h.pos != null ? `${h.pos}°` : '—'}</td>
                    <td className="py-1.5 text-center">
                      {h.clasifico
                        ? <Badge variant="success" className="text-[10px]">Clasificó</Badge>
                        : <Badge variant="danger" className="text-[10px]">No clasificó</Badge>}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-200 bg-blue-50/40">
                  <td className="py-1.5 text-xs font-semibold text-slate-600">Promedio histórico</td>
                  <td className="py-1.5 text-center font-stats font-bold text-mill-blue">
                    {Math.round(HISTORICO.reduce((s, h) => s + h.pts, 0) / HISTORICO.length * 10) / 10}
                  </td>
                  <td className="py-1.5 text-center text-slate-400 text-xs">—</td>
                  <td className="py-1.5 text-center">
                    <span className="text-[10px] text-slate-500">
                      {HISTORICO.filter((h) => h.clasifico).length}/{HISTORICO.length} clasificaciones
                    </span>
                  </td>
                </tr>
                <tr className="bg-slate-50/80">
                  <td className="py-1.5 text-xs font-semibold text-slate-600">Proyección 20 fechas</td>
                  <td className="py-1.5 text-center font-stats font-bold text-mill-blue">~{historicalExpectedPts}</td>
                  <td colSpan={2} className="py-1.5 text-center text-[10px] text-slate-400">promedio histórico escalado</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Gráfico distribución ── */}
      {result && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribución de posiciones finales</CardTitle>
            <p className="text-xs text-slate-500">
              En 10 000 simulaciones, ¿cuántas veces terminó Millonarios en cada puesto?
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="pos" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}°`} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} domain={[0, 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    x={8.5}
                    stroke="#FCD116"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{ value: 'Top 8', position: 'top', fontSize: 10, fill: '#92400e' }}
                  />
                  <Bar dataKey="pct" radius={[3, 3, 0, 0]} fill="#1E3A8A" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-mill-blue" />
                Distribución de posiciones
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-5 border-t-2 border-dashed border-mill-gold" />
                Corte clasificación (top 8)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tabla probabilidades por posición ── */}
      {result && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Probabilidad por posición final</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="py-2 text-left font-medium">Posición</th>
                    <th className="py-2 text-right font-medium">Probabilidad</th>
                    <th className="py-2 text-right font-medium pr-2">Visual</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.filter((d) => d.pct > 0).map((d) => (
                    <tr key={d.pos} className={cn(
                      'border-b border-slate-50 hover:bg-slate-50/60 transition-colors',
                      d.pos <= 8 ? 'bg-blue-50/40' : '',
                    )}>
                      <td className="py-2 font-medium text-slate-700">
                        {d.pos <= 8 ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                            {d.pos}° — Clasifica
                          </span>
                        ) : (
                          <span className="text-slate-500">{d.pos}°</span>
                        )}
                      </td>
                      <td className="py-2 text-right font-stats font-semibold text-mill-blue">
                        {d.pct.toFixed(1)}%
                      </td>
                      <td className="py-2 pr-2">
                        <div className="flex justify-end">
                          <div
                            className={cn('h-2 rounded-full', d.pos <= 8 ? 'bg-mill-blue' : 'bg-slate-200')}
                            style={{ width: `${Math.max(4, d.pct * 3)}px`, maxWidth: '120px' }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Nota metodológica ── */}
      <Card className="border-slate-100 bg-slate-50/50">
        <CardContent className="pt-5">
          <div className="flex gap-3">
            <Info className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-slate-600">Metodología</p>
                <Badge variant="ai" className="text-[10px]">Modelo H2H</Badge>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Se ejecutan <strong>10 000 simulaciones</strong> de la Liga BetPlay{' '}
                <strong>{SEASON_LABEL}</strong> ({TOTAL_SEASON_GAMES} partidos: 19 todos vs todos
                + clásico vs {EXTRA_MATCH_RIVAL}). Para cada uno de los 20 partidos de Millonarios,
                se usan las tasas W/D/L del <strong>historial H2H real</strong> contra ese rival
                específico (hasta 20 partidos más recientes). El escenario <em>Optimista</em> aplica
                un multiplicador ×1.5 sobre la tasa de victoria H2H; el <em>Pesimista</em> aplica ×0.5.
                Si no hay H2H disponible vs un rival, se usa el promedio histórico de Millonarios
                (W≈45%, D≈28%, L≈27%, calibrado con 7 torneos recientes). El resto de equipos usa
                su racha del torneo anterior.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  )
}
