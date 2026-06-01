import type { H2HPlayerStatsBundle } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function JugadoresH2H({
  stats,
  rivalName,
  isLoading,
}: {
  stats?: H2HPlayerStatsBundle
  rivalName: string
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jugadores vs {rivalName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!stats || stats.fixturesAnalyzed === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jugadores vs {rivalName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            No hay datos de alineaciones o goles en estos partidos.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <HighlightCard
          title="Máximo goleador"
          name={stats.topScorer?.name ?? '—'}
          detail={
            stats.topScorer
              ? `${stats.topScorer.goals} gol${stats.topScorer.goals === 1 ? '' : 'es'} · ${stats.topScorer.appearances} PJ`
              : 'Sin goles registrados en el período'
          }
          accent="text-emerald-600"
        />
        <HighlightCard
          title="Más partidos jugados"
          name={stats.mostAppearances?.name ?? '—'}
          detail={
            stats.mostAppearances
              ? `${stats.mostAppearances.appearances} partidos · ${stats.mostAppearances.goals} gol${stats.mostAppearances.goals === 1 ? '' : 'es'}`
              : '—'
          }
          accent="text-mill-blue"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Ranking histórico ({stats.fixturesAnalyzed} partidos)
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-4">Jugador</th>
                <th className="py-2 pr-4 font-stats">PJ</th>
                <th className="py-2 pr-4 font-stats">Goles</th>
                <th className="py-2 font-stats">Asist.</th>
              </tr>
            </thead>
            <tbody>
              {stats.players.slice(0, 20).map((p) => (
                <tr key={p.name} className="border-b border-slate-100">
                  <td className="py-2 font-medium">{p.name}</td>
                  <td className="py-2 font-stats">{p.appearances}</td>
                  <td className="py-2 font-stats text-emerald-600 font-medium">
                    {p.goals}
                  </td>
                  <td className="py-2 font-stats">{p.assists}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats.players.length === 0 && (
            <p className="text-sm text-slate-500 py-2">Sin jugadores registrados.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function HighlightCard({
  title,
  name,
  detail,
  accent,
}: {
  title: string
  name: string
  detail: string
  accent: string
}) {
  return (
    <Card className="border-mill-gold/40">
      <CardContent className="pt-5">
        <p className="text-xs text-slate-500 uppercase tracking-wide">{title}</p>
        <p className={`text-xl font-bold mt-1 ${accent}`}>{name}</p>
        <p className="text-sm text-slate-600 mt-1">{detail}</p>
      </CardContent>
    </Card>
  )
}
