import { useParams, Link } from 'react-router-dom'
import { useFixture, useFixtureEvents, useFixtureLineups } from '@/hooks/usePartidos'
import { formatFixtureDate, formatScore } from '@/utils/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { hasAnalisis } from '@/services/analysisAI'
import { DashboardSkeleton } from '@/components/shared/Loading'
import { TEAM_MILLONARIOS } from '@/config/constants'

export default function CalendarioDetalle() {
  const { fixtureId } = useParams()
  const id = Number(fixtureId)
  const { data: fixture, isLoading } = useFixture(id)
  const { data: events } = useFixtureEvents(id)
  const { data: lineups } = useFixtureLineups(id)

  if (isLoading || !fixture) return <DashboardSkeleton />

  const goals = events?.filter((e) => e.type === 'Goal') ?? []
  const subs = events?.filter((e) => e.type === 'subst') ?? []

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to="/calendario" className="text-sm text-mill-blue hover:underline">
        ← Calendario
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>
            {fixture.home.name} vs {fixture.away.name}
          </CardTitle>
          <p className="text-sm text-slate-500">
            {formatFixtureDate(fixture.date)} · {fixture.leagueName}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-3xl font-stats font-bold text-center">
            {formatScore(fixture)} ({fixture.status})
          </p>
          <p className="text-sm text-slate-600 text-center">
            {fixture.venue && `📍 ${fixture.venue}`}
            {fixture.city && ` · ${fixture.city}`}
            {fixture.referee && ` · ⚖️ ${fixture.referee}`}
          </p>
          <div className="flex gap-2 justify-center">
            {hasAnalisis(id, 'previa') && <Badge variant="ai">IA Previa</Badge>}
            {hasAnalisis(id, 'post') && <Badge variant="ai">IA Post</Badge>}
          </div>
          <Link
            to={`/analisis/${id}`}
            className="block text-center py-2 bg-mill-blue text-white rounded-md"
          >
            Análisis táctico
          </Link>
        </CardContent>
      </Card>

      {lineups && lineups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Formaciones</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            {lineups.map((l) => (
              <div key={l.teamId}>
                <p className="font-semibold text-mill-blue mb-1">
                  {l.teamId === TEAM_MILLONARIOS ? 'Millonarios' : 'Rival'} — {l.formation}
                </p>
                <p className="text-xs text-slate-500 mb-2">DT: {l.coach}</p>
                <ul className="text-xs space-y-0.5">
                  {l.startXI.map((p) => (
                    <li key={p.number}>
                      #{p.number} {p.name} ({p.pos})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Goles</CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length ? (
            <ul className="space-y-1 text-sm">
              {goals.map((g, i) => (
                <li key={i}>
                  {g.time}&apos; — {g.player} ({g.detail})
                  {g.assist && ` · Asist: ${g.assist}`}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">Sin datos de goles.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cambios</CardTitle>
        </CardHeader>
        <CardContent>
          {subs.length ? (
            <ul className="space-y-1 text-sm">
              {subs.map((s, i) => (
                <li key={i}>
                  {s.time}&apos; — {s.player} ({s.detail})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">Sin datos de cambios.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
