import { useId, useMemo } from 'react'
import { PITCH_ZONES, zonasDesdePosiciones, posicionEnEspanol } from '@/utils/positions'
const PITCH_GREEN = '#7cb356'
const LINE_WHITE = '#ffffff'

function heatStops(t: number): { offset: string; color: string; opacity: number }[] {
  if (t < 0.35) {
    return [
      { offset: '0%', color: '#e8f5a0', opacity: 0.55 * t + 0.15 },
      { offset: '45%', color: '#d4e878', opacity: 0.35 * t + 0.1 },
      { offset: '100%', color: '#7cb356', opacity: 0 },
    ]
  }
  if (t < 0.65) {
    return [
      { offset: '0%', color: '#ffd54f', opacity: 0.65 },
      { offset: '40%', color: '#ffeb3b', opacity: 0.45 },
      { offset: '100%', color: '#a8c96a', opacity: 0 },
    ]
  }
  return [
    { offset: '0%', color: '#e85d2a', opacity: 0.85 },
    { offset: '35%', color: '#ff8c1a', opacity: 0.65 },
    { offset: '65%', color: '#ffd700', opacity: 0.4 },
    { offset: '100%', color: '#c5d96a', opacity: 0 },
  ]
}

function PitchMarkings() {
  const sw = 0.65
  return (
    <g fill="none" stroke={LINE_WHITE} strokeWidth={sw} strokeLinecap="round">
      <rect x="2" y="2" width="96" height="136" rx="1.5" />
      <line x1="2" y1="70" x2="98" y2="70" />
      <circle cx="50" cy="70" r="11" />
      <circle cx="50" cy="70" r="1.2" fill={LINE_WHITE} stroke="none" />
      <rect x="22" y="2" width="56" height="22" />
      <rect x="34" y="2" width="32" height="8" />
      <circle cx="50" cy="16" r="0.9" fill={LINE_WHITE} stroke="none" />
      <path d="M 38 2 A 12 12 0 0 1 62 2" />
      <rect x="22" y="116" width="56" height="22" />
      <rect x="34" y="130" width="32" height="8" />
      <circle cx="50" cy="124" r="0.9" fill={LINE_WHITE} stroke="none" />
      <path d="M 38 138 A 12 12 0 0 0 62 138" />
    </g>
  )
}

export function MapaPosicionCampo({
  positions,
  titulo = 'Mapa de posición',
  subtitulo,
  compact,
}: {
  positions: string[]
  titulo?: string
  subtitulo?: string
  compact?: boolean
}) {
  const uid = useId().replace(/:/g, '')
  const blurId = `heat-blur-${uid}`
  const weights = zonasDesdePosiciones(positions)
  const max = Math.max(...weights.values(), 1)

  const blobs = useMemo(() => {
    return PITCH_ZONES.map((zone) => {
      const w = weights.get(zone.id) ?? 0
      if (w <= 0) return null
      const t = w / max
      return {
        id: zone.id,
        cx: zone.x + zone.w / 2,
        cy: zone.y + zone.h / 2,
        r: Math.max(zone.w, zone.h) * (0.85 + t * 0.45),
        gradId: `heat-${uid}-${zone.id}`,
        stops: heatStops(t),
      }
    }).filter((b): b is NonNullable<typeof b> => b != null)
  }, [weights, max, uid])

  return (
    <div className={compact ? '' : 'rounded-lg border bg-white p-4'}>
      {!compact && (
        <div className="mb-3">
          <h3 className="font-semibold text-mill-blue">{titulo}</h3>
          {subtitulo && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitulo}</p>
          )}
        </div>
      )}
      <svg
        viewBox="0 0 100 140"
        className={`w-full mx-auto ${compact ? 'max-h-28' : 'max-h-64'}`}
        role="img"
        aria-label="Mapa de calor de posiciones en el campo"
      >
        <defs>
          <filter id={blurId} x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation={compact ? 2.8 : 4.5} />
          </filter>
          {blobs.map((b) => (
            <radialGradient
              key={b.gradId}
              id={b.gradId}
              cx="50%"
              cy="50%"
              r="50%"
            >
              {b.stops.map((stop) => (
                <stop
                  key={stop.offset}
                  offset={stop.offset}
                  stopColor={stop.color}
                  stopOpacity={stop.opacity}
                />
              ))}
            </radialGradient>
          ))}
        </defs>

        <rect x="0" y="0" width="100" height="140" fill={PITCH_GREEN} rx="2" />

        <g filter={`url(#${blurId})`} opacity={0.75}>
          {blobs.map((b) => (
            <circle
              key={b.id}
              cx={b.cx}
              cy={b.cy}
              r={b.r}
              fill={`url(#${b.gradId})`}
            />
          ))}
        </g>

        <PitchMarkings />
      </svg>
      <p className="text-xs text-slate-500 mt-2 text-center">
        Zona principal:{' '}
        <strong className="text-mill-blue">
          {posicionEnEspanol(positions[0] ?? '—')}
        </strong>
        {positions.length > 1 && (
          <span> · {positions.length} roles registrados</span>
        )}
      </p>
      <div className="flex justify-center gap-3 mt-2 text-[10px] text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="w-10 h-2 rounded-full shrink-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(124,179,86,0.25) 0%, #d4e878 30%, #ffd54f 55%, #ff8c1a 80%, #e85d2a 100%)',
            }}
          />
          Baja → alta actividad
        </span>
      </div>
    </div>
  )
}
