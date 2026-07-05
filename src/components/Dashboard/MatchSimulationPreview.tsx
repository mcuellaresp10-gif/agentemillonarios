import type { Fixture, PlayerSeasonStats, StandingRow } from '@/types'
import { useMatchSimulation } from '@/hooks/useMatchSimulation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function MatchSimulationPreview({
  fixture,
  standings,
  millPlayers,
  compact,
}: {
  fixture: Fixture | null | undefined
  standings: StandingRow[]
  millPlayers?: PlayerSeasonStats[]
  compact?: boolean
}) {
  const sim = useMatchSimulation(fixture, standings, millPlayers)

  if (!fixture || !sim) return null

  const pct = (v: number) => `${Math.round(v * 100)}%`

  if (compact) {
    return (
      <div className="rounded-lg bg-slate-50 p-3 space-y-2">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Monte Carlo (Poisson)
        </p>
        <div className="flex gap-2 text-sm font-stats">
          <Badge variant="success">V {pct(sim.millWin)}</Badge>
          <Badge variant="default">E {pct(sim.millDraw)}</Badge>
          <Badge variant="danger">D {pct(sim.millLoss)}</Badge>
        </div>
        <p className="text-xs text-slate-500">
          xG ~ {sim.expectedGoals.home.toFixed(1)}–{sim.expectedGoals.away.toFixed(1)} · Más probable{' '}
          {sim.mostLikely.home}-{sim.mostLikely.away}
        </p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Simulación Monte Carlo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-emerald-50 p-2">
            <p className="text-xs text-slate-500">Victoria</p>
            <p className="text-xl font-stats font-bold text-emerald-700">{pct(sim.millWin)}</p>
          </div>
          <div className="rounded-lg bg-slate-100 p-2">
            <p className="text-xs text-slate-500">Empate</p>
            <p className="text-xl font-stats font-bold">{pct(sim.millDraw)}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-2">
            <p className="text-xs text-slate-500">Derrota</p>
            <p className="text-xl font-stats font-bold text-red-600">{pct(sim.millLoss)}</p>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          Goles esperados: {sim.expectedGoals.home.toFixed(2)} – {sim.expectedGoals.away.toFixed(2)}
        </p>
        <div>
          <p className="text-xs text-slate-500 mb-1">Marcadores más probables</p>
          <ul className="text-sm font-mono space-y-0.5">
            {sim.topScores.map((s) => (
              <li key={`${s.home}-${s.away}`}>
                {s.home}-{s.away} ({pct(s.prob)})
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
