import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formStreak } from '@/utils/calculators'
import type { Fixture } from '@/types'
import type { StandingRow } from '@/types'
import { TEAM_MILLONARIOS } from '@/config/constants'

export function EstadisticasTemporada({
  fixtures,
  standings,
  teamStats,
}: {
  fixtures: Fixture[]
  standings: StandingRow[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamStats: any
}) {
  const millRow = standings.find((s) => s.team.id === TEAM_MILLONARIOS)
  const finished = fixtures.filter((f) => f.status === 'FT' && f.result)
  const streak = formStreak(
    finished.slice(0, 5).map((f) => f.result!).filter(Boolean) as Array<'W' | 'D' | 'L'>,
  )

  let gf = millRow?.goalsFor ?? 0
  let gc = millRow?.goalsAgainst ?? 0

  const resp = teamStats?.response
  if (resp?.goals?.for?.total?.total != null) {
    gf = resp.goals.for.total.total
    gc = resp.goals.against.total.total
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Temporada</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <Stat label="Goles a favor" value={gf} />
        <Stat label="Goles en contra" value={gc} />
        <Stat label="Diferencia" value={gf - gc} highlight />
        <Stat label="Posición" value={millRow?.rank ?? '—'} />
        <div className="col-span-2">
          <p className="text-xs text-slate-500 mb-1">Racha (últimos 5)</p>
          <p className="font-mono text-sm font-medium">{streak || '—'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-slate-500">Puntos</p>
          <p className="text-2xl font-stats font-bold text-mill-blue">
            {millRow?.points ?? '—'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`text-xl font-stats font-semibold ${highlight ? 'text-mill-gold' : 'text-mill-blue'}`}
      >
        {value}
      </p>
    </div>
  )
}
