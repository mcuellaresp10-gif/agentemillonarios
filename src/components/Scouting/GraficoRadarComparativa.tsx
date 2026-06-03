import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import type { PlayerSeasonStats } from '@/types'
import type { PlayerComparisonResult } from '@/utils/playerComparison'

export function GraficoRadarComparativa({
  candidato,
  actual,
  comparison,
}: {
  candidato: PlayerSeasonStats
  actual: PlayerSeasonStats
  comparison: PlayerComparisonResult
}) {
  if (!comparison.radar.length) {
    return (
      <p className="text-slate-500 text-sm">Sin datos suficientes para el radar.</p>
    )
  }

  const data = comparison.radar.map((r) => ({
    axis: r.axis,
    Candidato: r.candidato,
    Millonarios: r.actual,
  }))

  return (
    <div className="rounded-lg border p-4 bg-white">
      <h3 className="text-sm font-semibold text-mill-blue mb-2">Perfil comparativo</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: '#64748b' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Radar
              name={candidato.name.split(' ').slice(-1)[0] ?? 'Candidato'}
              dataKey="Candidato"
              stroke="#1E3A8A"
              fill="#1E3A8A"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Radar
              name={actual.name.split(' ').slice(-1)[0] ?? 'Millonarios'}
              dataKey="Millonarios"
              stroke="#CA8A04"
              fill="#FCD116"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Tooltip
              formatter={(value: number) => [`${value}/100`, '']}
              contentStyle={{ fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
