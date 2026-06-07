import type { RadarAxis3 } from '@/utils/leagueRanking'

const COLORS = {
  jugador: '#1E3A8A',   // azul mill
  colombia: '#16a34a',  // verde
  sa: '#ea580c',        // naranja
}

/** Radar SVG puro con 3 series: jugador, promedio Colombia, promedio Sudamérica */
export function GraficoRadarTriple({
  data,
  jugadorLabel = 'Jugador',
  showColombia = true,
}: {
  data: RadarAxis3[]
  jugadorLabel?: string
  showColombia?: boolean
}) {
  if (!data.length) return null

  const N = data.length
  const cx = 150
  const cy = 150
  const R = 105
  const levels = 4

  const angle = (i: number) => (2 * Math.PI * i) / N - Math.PI / 2

  const pt = (i: number, value: number) => {
    const r = (value / 100) * R
    return {
      x: cx + r * Math.cos(angle(i)),
      y: cy + r * Math.sin(angle(i)),
    }
  }

  const poly = (points: { x: number; y: number }[]) =>
    points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  const gridPolygons = Array.from({ length: levels }, (_, lvl) => {
    const r = ((lvl + 1) / levels) * R
    const pts = Array.from({ length: N }, (_, i) => ({
      x: cx + r * Math.cos(angle(i)),
      y: cy + r * Math.sin(angle(i)),
    }))
    return poly(pts)
  })

  const jugPts = data.map((d, i) => pt(i, d.jugador))
  const colPts = data.map((d, i) => pt(i, d.colombia))
  const saPts = data.map((d, i) => pt(i, d.sudamerica))

  return (
    <div>
      <svg viewBox="0 0 300 300" className="w-full" aria-label="Radar de clasificación en liga">
        {/* Rejilla */}
        {gridPolygons.map((pts, i) => (
          <polygon key={i} points={pts} fill="none" stroke="#e2e8f0" strokeWidth="1" />
        ))}

        {/* Ejes */}
        {data.map((_, i) => {
          const outer = pt(i, 100)
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={outer.x.toFixed(1)}
              y2={outer.y.toFixed(1)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          )
        })}

        {/* SA promedio (fondo) */}
        <polygon
          points={poly(saPts)}
          fill={COLORS.sa}
          fillOpacity={0.12}
          stroke={COLORS.sa}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />

        {/* Colombia promedio */}
        {showColombia && (
          <polygon
            points={poly(colPts)}
            fill={COLORS.colombia}
            fillOpacity={0.15}
            stroke={COLORS.colombia}
            strokeWidth={1.5}
            strokeDasharray="3 2"
          />
        )}

        {/* Jugador (frente) */}
        <polygon
          points={poly(jugPts)}
          fill={COLORS.jugador}
          fillOpacity={0.25}
          stroke={COLORS.jugador}
          strokeWidth={2}
        />

        {/* Etiquetas ejes */}
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
              x={x.toFixed(1)}
              y={y.toFixed(1)}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={9}
              fill="#64748b"
            >
              {d.axis}
            </text>
          )
        })}

        {/* Puntos jugador */}
        {jugPts.map((p, i) => (
          <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={3} fill={COLORS.jugador} />
        ))}
      </svg>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 justify-center mt-1 text-xs text-slate-600">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-1.5 rounded-sm" style={{ background: COLORS.jugador }} />
          {jugadorLabel}
        </span>
        {showColombia && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-1.5 rounded-sm" style={{ background: COLORS.colombia }} />
            Prom. Colombia
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-1.5 rounded-sm" style={{ background: COLORS.sa }} />
          Prom. Sudamérica
        </span>
      </div>
    </div>
  )
}
