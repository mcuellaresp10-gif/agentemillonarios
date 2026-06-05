import type { PlayerSeasonStats } from '@/types'
import type { PlayerComparisonResult } from '@/utils/playerComparison'

/** Radar chart implementado con SVG puro — sin recharts */
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

  const data = comparison.radar
  const N = data.length
  const cx = 150
  const cy = 150
  const R = 110
  const levels = 4

  // Ángulos empezando desde arriba (-π/2)
  const angle = (i: number) => (2 * Math.PI * i) / N - Math.PI / 2

  // Coordenadas de un punto en el radar
  const pt = (i: number, value: number) => {
    const r = (value / 100) * R
    return {
      x: cx + r * Math.cos(angle(i)),
      y: cy + r * Math.sin(angle(i)),
    }
  }

  // Polígono a partir de puntos
  const poly = (points: { x: number; y: number }[]) =>
    points.map((p) => `${p.x},${p.y}`).join(' ')

  // Puntos de la rejilla (por nivel)
  const gridPolygons = Array.from({ length: levels }, (_, lvl) => {
    const r = ((lvl + 1) / levels) * R
    const pts = Array.from({ length: N }, (_, i) => ({
      x: cx + r * Math.cos(angle(i)),
      y: cy + r * Math.sin(angle(i)),
    }))
    return poly(pts)
  })

  const candPts = data.map((d, i) => pt(i, d.candidato))
  const milloPts = data.map((d, i) => pt(i, d.actual))

  const candName = candidato.name.split(' ').slice(-1)[0] ?? 'Candidato'
  const milloName = actual.name.split(' ').slice(-1)[0] ?? 'Millonarios'

  return (
    <div className="rounded-lg border p-4 bg-white">
      <h3 className="text-sm font-semibold text-mill-blue mb-2">Perfil comparativo</h3>

      <svg viewBox="0 0 300 300" className="w-full" aria-label="Radar comparativo">
        {/* Rejilla */}
        {gridPolygons.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        ))}

        {/* Ejes */}
        {data.map((_, i) => {
          const outer = pt(i, 100)
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          )
        })}

        {/* Área Millonarios */}
        <polygon
          points={poly(milloPts)}
          fill="#FCD116"
          fillOpacity={0.2}
          stroke="#CA8A04"
          strokeWidth={2}
        />

        {/* Área Candidato */}
        <polygon
          points={poly(candPts)}
          fill="#1E3A8A"
          fillOpacity={0.25}
          stroke="#1E3A8A"
          strokeWidth={2}
        />

        {/* Etiquetas de ejes */}
        {data.map((d, i) => {
          const labelR = R + 18
          const x = cx + labelR * Math.cos(angle(i))
          const y = cy + labelR * Math.sin(angle(i))
          const anchor =
            Math.abs(Math.cos(angle(i))) < 0.1
              ? 'middle'
              : Math.cos(angle(i)) > 0
                ? 'start'
                : 'end'
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={9}
              fill="#64748b"
            >
              {d.axis}
            </text>
          )
        })}

        {/* Puntos Millonarios */}
        {milloPts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#CA8A04" />
        ))}

        {/* Puntos Candidato */}
        {candPts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#1E3A8A" />
        ))}
      </svg>

      {/* Leyenda */}
      <div className="flex gap-4 justify-center mt-1 text-xs text-slate-600">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-mill-blue/80" />
          {candName}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-yellow-400/80" />
          {milloName}
        </span>
      </div>

      {/* Valores por categoría */}
      <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-slate-600">
        {data.map((d) => (
          <div key={d.axis} className="flex justify-between gap-2 px-1">
            <span className="text-slate-500 truncate">{d.axis}</span>
            <span className="font-mono tabular-nums shrink-0">
              <span className="text-mill-blue">{d.candidato}</span>
              <span className="text-slate-300 mx-0.5">·</span>
              <span className="text-yellow-600">{d.actual}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
