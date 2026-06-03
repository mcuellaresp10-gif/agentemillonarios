import type { PlayerSeasonStats } from '@/types'
import type { PlayerComparisonResult } from '@/utils/playerComparison'
import { cn } from '@/lib/utils'

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length <= 1) return name.slice(0, 12)
  return `${parts[0]?.[0] ?? ''}. ${parts[parts.length - 1]}`.slice(0, 14)
}

export function GraficoRedComparativa({
  candidato,
  actual,
  comparison,
}: {
  candidato: PlayerSeasonStats
  actual: PlayerSeasonStats
  comparison: PlayerComparisonResult
}) {
  const categories = comparison.categories.filter((c) => c.edgeStrength > 0 || c.candidatoScore + c.actualScore > 0)

  if (!categories.length) {
    return (
      <p className="text-slate-500 text-sm">Sin categorías comparables para la red.</p>
    )
  }

  const width = 360
  const height = 280
  const leftX = 72
  const rightX = width - 72
  const centerY = height / 2
  const nodeR = 28

  return (
    <div className="rounded-lg border p-4 bg-white">
      <h3 className="text-sm font-semibold text-mill-blue mb-2">Red por categorías</h3>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-md mx-auto"
        role="img"
        aria-label="Red de comparación entre candidato y jugador de Millonarios"
      >
        {categories.map((cat, i) => {
          const spread = categories.length > 1 ? (i / (categories.length - 1)) * 0.7 + 0.15 : 0.5
          const y = height * spread
          const strength = Math.max(0.35, cat.edgeStrength)
          const strokeWidth = 1.5 + strength * 5
          const color =
            cat.winner === 'candidato'
              ? '#059669'
              : cat.winner === 'actual'
                ? '#D97706'
                : '#94A3B8'
          const midX = width / 2
          const ctrlOffset = (i % 2 === 0 ? -1 : 1) * 30

          return (
            <g key={cat.id}>
              <path
                d={`M ${leftX + nodeR} ${centerY} Q ${midX + ctrlOffset} ${y} ${rightX - nodeR} ${centerY}`}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeOpacity={0.75}
              />
              <text
                x={midX + ctrlOffset}
                y={y - 6}
                textAnchor="middle"
                className="fill-slate-500"
                fontSize={10}
              >
                {cat.label}
              </text>
            </g>
          )
        })}

        <g>
          <circle cx={leftX} cy={centerY} r={nodeR} fill="#1E3A8A" fillOpacity={0.12} stroke="#1E3A8A" strokeWidth={2} />
          {candidato.photo ? (
            <image
              href={candidato.photo}
              x={leftX - nodeR + 4}
              y={centerY - nodeR + 4}
              width={(nodeR - 4) * 2}
              height={(nodeR - 4) * 2}
              clipPath="circle(50%)"
              preserveAspectRatio="xMidYMid slice"
            />
          ) : null}
          <text x={leftX} y={centerY + nodeR + 14} textAnchor="middle" fontSize={10} className="fill-mill-blue font-medium">
            {shortName(candidato.name)}
          </text>
        </g>

        <g>
          <circle cx={rightX} cy={centerY} r={nodeR} fill="#FCD116" fillOpacity={0.25} stroke="#CA8A04" strokeWidth={2} />
          {actual.photo ? (
            <image
              href={actual.photo}
              x={rightX - nodeR + 4}
              y={centerY - nodeR + 4}
              width={(nodeR - 4) * 2}
              height={(nodeR - 4) * 2}
              preserveAspectRatio="xMidYMid slice"
            />
          ) : null}
          <text x={rightX} y={centerY + nodeR + 14} textAnchor="middle" fontSize={10} className="fill-slate-700 font-medium">
            {shortName(actual.name)}
          </text>
        </g>
      </svg>

      <ul className="mt-3 space-y-1 text-xs text-slate-600">
        {categories.map((cat) => (
          <li key={cat.id} className="flex items-center justify-between gap-2">
            <span>{cat.label}</span>
            <span
              className={cn(
                'font-medium',
                cat.winner === 'candidato' && 'text-emerald-600',
                cat.winner === 'actual' && 'text-amber-600',
                cat.winner === 'tie' && 'text-slate-500',
              )}
            >
              {cat.candidatoScore} vs {cat.actualScore}
              {cat.winner === 'candidato' && ' · candidato'}
              {cat.winner === 'actual' && ' · Millonarios'}
              {cat.winner === 'tie' && ' · empate'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
