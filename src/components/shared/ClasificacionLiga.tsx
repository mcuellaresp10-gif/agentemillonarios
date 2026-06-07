import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraficoRadarTriple } from '@/components/shared/GraficoRadarTriple'
import { useLeagueRanking } from '@/hooks/useLeagueRanking'
import type { PlayerSeasonStats } from '@/types'
import type { SeasonKey } from '@/types/scoutSnapshot'
import { cn } from '@/lib/utils'

function SkeletonRadar() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-7 rounded-full bg-slate-100 animate-pulse" />
        ))}
      </div>
      <div className="h-56 rounded-lg bg-slate-100 animate-pulse mt-3" />
    </div>
  )
}

/** Chip de percentil: solo muestra si está en el top 50% */
function PercentileChip({
  label,
  axis,
  colombiaPercentile,
  saPercentile,
  colombiaPoolSize,
}: {
  label: string
  axis: string
  colombiaPercentile: number
  saPercentile: number
  colombiaPoolSize: number
}) {
  const chips: { text: string; green: boolean }[] = []

  if (saPercentile >= 50) {
    const pct = Math.round(100 - saPercentile)
    chips.push({
      text: `Top ${pct || 1}% ${label} en SA`,
      green: saPercentile >= 75,
    })
  }

  if (colombiaPoolSize > 0 && colombiaPercentile >= 50) {
    const pct = Math.round(100 - colombiaPercentile)
    chips.push({
      text: `Top ${pct || 1}% ${label} en COL`,
      green: colombiaPercentile >= 75,
    })
  }

  return (
    <>
      {chips.map((chip) => (
        <span
          key={chip.text}
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            chip.green
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200',
          )}
          title={`${axis}: ${chip.text}`}
        >
          {chip.text}
        </span>
      ))}
    </>
  )
}

const AXIS_SHORT: Record<string, string> = {
  Rating: 'rating',
  Participación: 'minutos',
  Producción: 'producción',
  Creación: 'creación',
  Duelos: 'duelos',
  Defensa: 'defensa',
  Atajadas: 'atajadas',
  'Goles enc.': 'goles enc.',
  'Pases (%)': 'pases',
}

export function ClasificacionLiga({
  player,
  seasonKey,
}: {
  player: PlayerSeasonStats
  seasonKey: SeasonKey
}) {
  const { benchmarks, isLoading, poolSize, colombiaPoolSize } = useLeagueRanking(
    player,
    seasonKey,
  )

  const jugadorLabel = player.name.split(' ').slice(-1)[0] ?? 'Jugador'
  const showColombia = colombiaPoolSize > 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Clasificación en la liga</CardTitle>
        {!isLoading && poolSize > 0 && (
          <p className="text-xs text-slate-400 mt-0.5">
            Pool: {poolSize} jugadores SA · {colombiaPoolSize} en Colombia · misma posición
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <SkeletonRadar />
        ) : !benchmarks || poolSize < 20 ? (
          <p className="text-sm text-slate-500 py-4 text-center">
            {poolSize < 20
              ? 'Datos insuficientes en snapshots para calcular ranking.'
              : 'Sin datos de clasificación disponibles.'}
          </p>
        ) : (
          <>
            {/* Chips de percentil */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {Object.entries(benchmarks.percentiles).map(([axis, info]) => (
                <PercentileChip
                  key={axis}
                  label={AXIS_SHORT[axis] ?? axis.toLowerCase()}
                  axis={axis}
                  colombiaPercentile={info.colombiaPercentile}
                  saPercentile={info.saPercentile}
                  colombiaPoolSize={colombiaPoolSize}
                />
              ))}
              {Object.values(benchmarks.percentiles).every(
                (p) => p.saPercentile < 50 && p.colombiaPercentile < 50,
              ) && (
                <p className="text-xs text-slate-400">
                  El jugador no supera el promedio de la liga en ninguna categoría principal.
                </p>
              )}
            </div>

            {/* Radar triple */}
            <GraficoRadarTriple
              data={benchmarks.radar}
              jugadorLabel={jugadorLabel}
              showColombia={showColombia}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
