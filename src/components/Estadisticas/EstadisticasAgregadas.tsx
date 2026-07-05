import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { Fixture } from '@/types'
import { chartColors } from '@/components/Estadisticas/charts/chartTheme'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function EstadisticasAgregadas({ fixtures }: { fixtures: Fixture[] }) {
  const finished = fixtures.filter((f) => f.result != null)
  if (finished.length === 0) return null

  const byVenue = { home: { w: 0, d: 0, l: 0 }, away: { w: 0, d: 0, l: 0 } }
  const goalsByRound = new Map<string, number>()

  for (const f of finished) {
    const r = f.result!
    if (f.isMillonariosHome) {
      if (r === 'W') byVenue.home.w++
      else if (r === 'D') byVenue.home.d++
      else byVenue.home.l++
    } else {
      if (r === 'W') byVenue.away.w++
      else if (r === 'D') byVenue.away.d++
      else byVenue.away.l++
    }
    const round = f.round ?? 'Sin jornada'
    goalsByRound.set(round, (goalsByRound.get(round) ?? 0) + (f.millonariosGoals ?? 0))
  }

  const venueData = [
    { label: 'Local V', value: byVenue.home.w },
    { label: 'Local E', value: byVenue.home.d },
    { label: 'Local D', value: byVenue.home.l },
    { label: 'Visita V', value: byVenue.away.w },
    { label: 'Visita E', value: byVenue.away.d },
    { label: 'Visita D', value: byVenue.away.l },
  ]

  const roundData = [...goalsByRound.entries()]
    .slice(-10)
    .map(([round, goals]) => ({ round: round.replace(/^Regular Season - /, 'J'), goals }))

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resultados local / visitante</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={venueData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Goles por jornada</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={roundData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="round" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="goals" fill={chartColors.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
