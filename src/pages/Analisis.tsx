import { Link } from 'react-router-dom'
import { useRecentFixtures } from '@/hooks/usePartidos'
import { hasAnalisis } from '@/services/analysisAI'
import { formatFixtureDate } from '@/utils/formatters'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default function Analisis() {
  const { data: fixtures } = useRecentFixtures(20)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-mill-blue">Análisis táctico</h1>
        <p className="text-slate-500">Previa y post-partido con IA</p>
      </div>
      <div className="grid gap-3">
        {(fixtures ?? []).map((f) => (
          <Card key={f.id}>
            <CardContent className="py-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">
                  Millonarios vs {f.opponent.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatFixtureDate(f.date)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasAnalisis(f.id, 'previa') && <Badge variant="ai">Previa</Badge>}
                {hasAnalisis(f.id, 'post') && <Badge variant="ai">Post</Badge>}
                <Link
                  to={`/analisis/${f.id}`}
                  className="text-sm text-mill-blue font-medium hover:underline"
                >
                  Abrir →
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
