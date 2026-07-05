import { Link } from 'react-router-dom'
import type { StandingRow } from '@/types'
import { TEAM_MILLONARIOS } from '@/config/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const TOP_N = 8

export function MillonariosFocus({ standings }: { standings: StandingRow[] }) {
  const mill = standings.find((s) => s.team.id === TEAM_MILLONARIOS)
  const sorted = [...standings].sort((a, b) => a.rank - b.rank)
  const topSlice = sorted.slice(0, TOP_N + 2)

  if (!mill) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Millonarios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Tabla no disponible</p>
        </CardContent>
      </Card>
    )
  }

  const ptsToTop8 =
    mill.rank <= TOP_N
      ? 0
      : (sorted[TOP_N - 1]?.points ?? 0) - mill.points + 1

  return (
    <Card className="border-mill-blue/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Millonarios Focus</span>
          {mill.rank <= TOP_N ? (
            <Badge variant="success">Top {TOP_N}</Badge>
          ) : (
            <Badge variant="warning">Fuera del top {TOP_N}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg bg-slate-50 p-2">
            <p className="text-xs text-slate-500">Posición</p>
            <p className="text-2xl font-stats font-bold text-mill-blue">{mill.rank}º</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <p className="text-xs text-slate-500">Puntos</p>
            <p className="text-2xl font-stats font-bold">{mill.points}</p>
          </div>
        </div>
        {mill.form && (
          <p className="text-sm">
            Forma: <span className="font-mono tracking-widest">{mill.form}</span>
          </p>
        )}
        {ptsToTop8 > 0 && (
          <p className="text-sm text-amber-700">
            ~{ptsToTop8} pts para entrar al top {TOP_N}
          </p>
        )}
        <Link to="/simulacion" className="text-sm text-mill-blue hover:underline block">
          Ver simulación de temporada →
        </Link>
        <div className="border-t pt-3">
          <p className="text-xs text-slate-500 mb-2">Tabla (extracto)</p>
          <ul className="text-xs space-y-1 max-h-48 overflow-y-auto">
            {topSlice.map((row) => (
              <li
                key={row.team.id}
                className={`flex justify-between ${row.team.id === TEAM_MILLONARIOS ? 'font-semibold text-mill-blue' : ''}`}
              >
                <span>
                  {row.rank}. {row.team.name}
                </span>
                <span className="font-mono">{row.points}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
