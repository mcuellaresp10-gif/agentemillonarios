import { Link } from 'react-router-dom'
import type { Fixture } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  formatFixtureDate,
  formatMillonariosScore,
  resultLabel,
} from '@/utils/formatters'
import { resultColor } from '@/utils/calculators'
import { hasAnalisis } from '@/services/analysisAI'
import { cn } from '@/lib/utils'

export function PartidoCard({ fixture }: { fixture: Fixture }) {
  const hasPre = hasAnalisis(fixture.id, 'previa')
  const hasPost = hasAnalisis(fixture.id, 'post')

  return (
    <Card className="min-w-[300px] shrink-0 fade-in">
      <CardContent className="pt-4 space-y-3">
        <div className="flex justify-between text-xs text-slate-500 uppercase tracking-wide">
          <span>{formatFixtureDate(fixture.date)}</span>
          <span>{fixture.leagueName}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 text-center">
            <p className="font-bold text-mill-blue text-sm">MILLONARIOS</p>
            <p className="text-2xl font-stats font-semibold mt-1">
              {fixture.millonariosGoals ?? '—'}
            </p>
          </div>
          <span className="text-slate-400 text-sm">VS</span>
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-1">
              <img src={fixture.opponent.logo} alt="" className="h-5 w-5" loading="lazy" />
              <p className="text-sm font-medium truncate">{fixture.opponent.name}</p>
            </div>
            <p className="text-2xl font-stats font-semibold mt-1">
              {fixture.opponentGoals ?? '—'}
            </p>
          </div>
        </div>
        {fixture.status === 'FT' && fixture.result && (
          <p className={cn('text-center text-sm font-bold', resultColor(fixture.result))}>
            {formatMillonariosScore(fixture)} ({resultLabel(fixture.result)})
          </p>
        )}
        <p className="text-xs text-slate-500 text-center">
          {fixture.venue && `📍 ${fixture.venue}`}
          {fixture.city && ` · ${fixture.city}`}
          {fixture.referee && ` · ⚖️ ${fixture.referee}`}
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          {hasPre && <Badge variant="ai">IA Previa</Badge>}
          {hasPost && <Badge variant="ai">IA Post</Badge>}
        </div>
        <div className="flex gap-2">
          <Link
            to={`/calendario/${fixture.id}`}
            className="flex-1 text-center text-xs py-2 rounded border border-mill-blue text-mill-blue hover:bg-blue-50"
          >
            Detalle
          </Link>
          <Link
            to={`/analisis/${fixture.id}`}
            className="flex-1 text-center text-xs py-2 rounded bg-mill-blue text-white hover:bg-blue-900"
          >
            Análisis
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
