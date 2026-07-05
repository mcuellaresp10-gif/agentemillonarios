import { Link } from 'react-router-dom'
import type { Fixture, StandingRow } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatFixtureDate } from '@/utils/formatters'
import { difficultyRating } from '@/utils/calculators'
import { hasAnalisis } from '@/services/analysisAI'
import { MatchSimulationPreview } from '@/components/Dashboard/MatchSimulationPreview'
import type { PlayerSeasonStats } from '@/types'

export function ProximoPartido({
  fixture,
  standings,
  millPlayers,
}: {
  fixture: Fixture | null | undefined
  standings: StandingRow[]
  millPlayers?: PlayerSeasonStats[]
}) {
  if (!fixture) {
    return (
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Próximo partido</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">No hay partidos programados próximamente.</p>
        </CardContent>
      </Card>
    )
  }

  const oppStanding = standings.find((s) => s.team.id === fixture.opponent.id)
  const difficulty = difficultyRating(oppStanding, standings.length || 20)
  const hasPre = hasAnalisis(fixture.id, 'previa')

  return (
    <Card className="md:col-span-2 border-2 border-mill-blue/20">
      <CardHeader>
        <CardTitle>Próximo partido</CardTitle>
        <p className="text-sm text-slate-500">{formatFixtureDate(fixture.date)}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xl font-bold text-mill-blue">MILLONARIOS</p>
            <p className="text-slate-400 text-sm">vs</p>
            <div className="flex items-center gap-2 mt-1">
              <img src={fixture.opponent.logo} alt="" className="h-8 w-8" />
              <p className="text-lg font-semibold">{fixture.opponent.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Dificultad</p>
            <p className="text-3xl font-stats font-bold text-mill-gold">{difficulty}</p>
            <p className="text-xs text-slate-500">/ 10</p>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          {fixture.venue && `${fixture.venue}`}
          {fixture.city && ` · ${fixture.city}`}
        </p>
        <MatchSimulationPreview
          fixture={fixture}
          standings={standings}
          millPlayers={millPlayers}
          compact
        />
        {hasPre && <Badge variant="ai">Análisis previo disponible</Badge>}
        <Link
          to={`/analisis/${fixture.id}`}
          className="inline-block rounded-md bg-mill-blue px-4 py-2 text-sm text-white hover:bg-blue-900"
        >
          Ver análisis previo
        </Link>
      </CardContent>
    </Card>
  )
}
