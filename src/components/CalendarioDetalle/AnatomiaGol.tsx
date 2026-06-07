import { useState, useId } from 'react'
import type { GoalAction } from '@/hooks/useSofascoreMatch'

const PITCH_GREEN = '#3a7d2c'
const LINE_WHITE = 'rgba(255,255,255,0.7)'

const EVENT_COLOR: Record<string, string> = {
  interception: '#94a3b8',
  pass: '#60a5fa',
  cross: '#fbbf24',
  goal: '#ef4444',
}
const EVENT_LABEL: Record<string, string> = {
  interception: 'Intercepción',
  pass: 'Pase',
  cross: 'Centro',
  goal: 'Gol',
}

/** Sofascore coords: x=depth (0→100, 100=rival goal), y=width (0→100)
 *  SVG viewBox="0 0 100 100" showing attacking half (x 50–100)
 *  svgX = (sfX - 50) * 2   svgY = sfY
 */
function toSvg(sf: { x: number; y: number }) {
  return { x: Math.max(0, Math.min(100, (sf.x - 50) * 2)), y: Math.max(0, Math.min(100, sf.y)) }
}

function AttackingHalf({ uid }: { uid: string }) {
  const arrowId = `arrow-${uid}`
  return (
    <>
      <defs>
        <marker id={arrowId} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill={LINE_WHITE} />
        </marker>
      </defs>
      {/* Pitch background */}
      <rect x="0" y="0" width="100" height="100" fill={PITCH_GREEN} />
      {/* Left edge (halfway line) */}
      <line x1="0" y1="0" x2="0" y2="100" stroke={LINE_WHITE} strokeWidth={0.6} />
      {/* Outer boundary */}
      <rect x="0" y="0" width="100" height="100" fill="none" stroke={LINE_WHITE} strokeWidth={0.6} />
      {/* Penalty area: x=83–100, y=21–79 in SF coords → svgX=66–100, svgY=21–79 */}
      <rect x="66" y="21" width="34" height="58" fill="none" stroke={LINE_WHITE} strokeWidth={0.6} />
      {/* Six-yard box: x=94–100, y=37–63 → svgX=88–100, svgY=37–63 */}
      <rect x="88" y="37" width="12" height="26" fill="none" stroke={LINE_WHITE} strokeWidth={0.6} />
      {/* Goal: x=100, y=44.8–55.2 */}
      <rect x="99" y="44.8" width="1.5" height="10.4" fill="none" stroke={LINE_WHITE} strokeWidth={1} />
      {/* Penalty spot: SF x=89, y=50 → svgX=78, svgY=50 */}
      <circle cx="78" cy="50" r="0.8" fill={LINE_WHITE} />
    </>
  )
}

function GoalMouth({ gm }: { gm: { x: number; y: number } }) {
  // gm.x: 0–100 (width of goal, 0=left post, 100=right post)
  // gm.y: 0–100 (height, 0=bottom, 100=top crossbar)
  // Draw a tiny goal frame at bottom-right of SVG
  const frameX = 62
  const frameY = 78
  const frameW = 36
  const frameH = 14
  const dotX = frameX + (gm.x / 100) * frameW
  const dotY = frameY + frameH - (gm.y / 100) * frameH
  return (
    <g>
      <rect x={frameX} y={frameY} width={frameW} height={frameH}
        fill="rgba(0,0,0,0.35)" stroke={LINE_WHITE} strokeWidth={0.6} rx={0.5} />
      <text x={frameX + frameW / 2} y={frameY - 1.5} textAnchor="middle"
        fontSize={3.5} fill={LINE_WHITE}>Arco</text>
      <circle cx={dotX} cy={dotY} r={2} fill="#ef4444" stroke="#fff" strokeWidth={0.5} />
    </g>
  )
}

function GoalSvg({ goal, uid }: { goal: GoalAction; uid: string }) {
  const arrowId = `arrow-${uid}`
  return (
    <svg viewBox="0 0 100 100" className="w-full rounded-lg" style={{ maxHeight: 320 }}
      role="img" aria-label={`Jugada gol de ${goal.player}`}>
      <AttackingHalf uid={uid} />

      {/* Arrows between consecutive steps */}
      {goal.actions.map((step, i) => {
        if (!step.to) return null
        const from = toSvg(step.from)
        const to = toSvg(step.to)
        const color = EVENT_COLOR[step.eventType] ?? '#94a3b8'
        return (
          <line key={i}
            x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke={color} strokeWidth={1.2} opacity={0.85}
            markerEnd={`url(#${arrowId})`}
          />
        )
      })}

      {/* Player dots */}
      {goal.actions.map((step, i) => {
        const pos = toSvg(step.from)
        const color = EVENT_COLOR[step.eventType] ?? '#94a3b8'
        const parts = step.player.split(' ')
        const label = parts[parts.length - 1] ?? step.player
        return (
          <g key={i}>
            <circle cx={pos.x} cy={pos.y} r={4} fill={color} stroke="#fff" strokeWidth={0.8} />
            <text x={pos.x} y={pos.y + 7.5} textAnchor="middle"
              fontSize={3.5} fill="#fff" fontWeight={500}>
              {label.length > 9 ? label.slice(0, 8) + '.' : label}
            </text>
          </g>
        )
      })}

      {/* Goal mouth visualization */}
      {goal.goalMouth && <GoalMouth gm={goal.goalMouth} />}
    </svg>
  )
}

export function AnatomiaGol({ goals }: { goals: GoalAction[] }) {
  const uid = useId().replace(/:/g, '')
  const [active, setActive] = useState(0)

  if (goals.length === 0) return null
  const goal = goals[Math.min(active, goals.length - 1)]

  // Count unique event types for legend
  const types = [...new Set(goal.actions.map((a) => a.eventType))]

  const bodyPartLabel: Record<string, string> = {
    'left-foot': 'Pie izquierdo',
    'right-foot': 'Pie derecho',
    head: 'Cabeza',
  }

  return (
    <div className="space-y-3">
      {/* Goal tabs */}
      {goals.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {goals.map((g, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                active === i
                  ? 'bg-mill-blue text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {g.time}&apos; {g.player}
            </button>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-mill-blue">
          {goal.time}&apos; — {goal.player}
        </span>
        {goal.bodyPart && (
          <span className="text-xs text-slate-400">
            {bodyPartLabel[goal.bodyPart] ?? goal.bodyPart}
          </span>
        )}
      </div>

      {/* SVG field */}
      <GoalSvg goal={goal} uid={`${uid}-${active}`} />

      {/* Legend */}
      <div className="flex gap-3 flex-wrap text-[11px] text-slate-500">
        {types.map((t) => (
          <span key={t} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ background: EVENT_COLOR[t] ?? '#94a3b8' }} />
            {EVENT_LABEL[t] ?? t}
          </span>
        ))}
      </div>

      {/* Action chain text */}
      <div className="text-xs text-slate-500 leading-relaxed">
        {goal.actions.map((a, i) => (
          <span key={i}>
            {i > 0 && <span className="mx-1 text-slate-300">→</span>}
            <span style={{ color: EVENT_COLOR[a.eventType] ?? '#94a3b8' }}
              className="font-medium">
              {a.player}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
