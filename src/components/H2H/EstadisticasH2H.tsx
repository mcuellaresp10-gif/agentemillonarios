import { computeH2HAggregate } from '@/utils/calculators'
import type { Fixture } from '@/types'

export function EstadisticasH2H({ fixtures }: { fixtures: Fixture[] }) {
  const agg = computeH2HAggregate(fixtures)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatBox label="Victorias M" value={agg.wins} color="text-emerald-600" />
      <StatBox label="Empates" value={agg.draws} color="text-amber-500" />
      <StatBox label="Derrotas" value={agg.losses} color="text-red-500" />
      <StatBox
        label="Prom. goles M"
        value={agg.avgGoalsMillonarios}
        color="text-mill-blue"
      />
      <StatBox
        label="Prom. goles rival"
        value={agg.avgGoalsOpponent}
        color="text-slate-600"
      />
      <StatBox label="GF total M" value={agg.goalsMillonarios} color="text-mill-blue" />
      <StatBox label="GF total rival" value={agg.goalsOpponent} color="text-slate-600" />
    </div>
  )
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-lg border bg-white p-4 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-stats font-bold ${color}`}>{value}</p>
    </div>
  )
}
