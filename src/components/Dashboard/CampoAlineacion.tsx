import type { PlayerFrequency } from '@/hooks/useCoachLineupHistory'
import { posicionEnEspanol } from '@/utils/positions'

const PITCH_GREEN = '#3a7d2c'
const LINE_WHITE = '#ffffff'
const PLAYER_BLUE = '#1E3A8A'
const PLAYER_GOLD = '#C9A227'

function PitchMarkings() {
  const sw = 0.6
  return (
    <g fill="none" stroke={LINE_WHITE} strokeWidth={sw} strokeLinecap="round" opacity={0.7}>
      <rect x="2" y="2" width="96" height="136" rx="1.5" />
      <line x1="2" y1="70" x2="98" y2="70" />
      <circle cx="50" cy="70" r="11" />
      <circle cx="50" cy="70" r="1.2" fill={LINE_WHITE} stroke="none" />
      {/* Top box */}
      <rect x="22" y="2" width="56" height="22" />
      <rect x="34" y="2" width="32" height="8" />
      <circle cx="50" cy="16" r="0.9" fill={LINE_WHITE} stroke="none" />
      <path d="M 38 2 A 12 12 0 0 1 62 2" />
      {/* Bottom box */}
      <rect x="22" y="116" width="56" height="22" />
      <rect x="34" y="130" width="32" height="8" />
      <circle cx="50" cy="124" r="0.9" fill={LINE_WHITE} stroke="none" />
      <path d="M 38 138 A 12 12 0 0 0 62 138" />
    </g>
  )
}

/** Parses "4-3-3" → [1, 4, 3, 3] (GK included) */
function parseFormation(formation: string): number[] {
  const nums = formation.split('-').map(Number).filter((n) => !isNaN(n) && n > 0)
  if (nums.length === 0) return [1, 4, 4, 2]
  // Prepend GK row
  return [1, ...nums]
}

/** Y positions per row (GK at bottom = high Y, FWD at top = low Y) */
function rowYPositions(rows: number[]): number[] {
  // rows[0] = GK row (bottom), last = FWD row (top)
  // SVG: y=128 portero, y=8 delantero
  const n = rows.length
  if (n === 1) return [120]
  const minY = 12
  const maxY = 128
  return rows.map((_, i) => {
    // i=0 → GK → maxY; i=n-1 → FWD → minY
    return Math.round(maxY - (i / (n - 1)) * (maxY - minY))
  })
}

function PlayerDot({ player, cx, cy }: { player: PlayerFrequency; cx: number; cy: number }) {
  const r = 6
  // Abbreviate name: last word
  const parts = player.name.trim().split(/\s+/)
  const surname = parts[parts.length - 1] ?? player.name

  return (
    <g>
      {/* Circle */}
      <circle cx={cx} cy={cy} r={r} fill={PLAYER_BLUE} stroke={PLAYER_GOLD} strokeWidth={1.2} />
      {/* Shirt number */}
      <text
        x={cx}
        y={cy + 0.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={4.5}
        fontWeight="bold"
        fill={LINE_WHITE}
        fontFamily="monospace"
      >
        {player.number || player.pos}
      </text>
      {/* Surname below */}
      <text
        x={cx}
        y={cy + r + 4.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={4}
        fill={LINE_WHITE}
        fontWeight={500}
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
      >
        {surname.length > 9 ? surname.slice(0, 8) + '.' : surname}
      </text>
      {/* Position badge above */}
      <text
        x={cx}
        y={cy - r - 2.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={3}
        fill="#fde68a"
        opacity={0.9}
      >
        {posicionEnEspanol(player.pos)}
      </text>
    </g>
  )
}

export function CampoAlineacion({
  formation,
  players,
}: {
  formation: string
  players: PlayerFrequency[]
}) {
  const rows = parseFormation(formation)
  const yPositions = rowYPositions(rows)

  // Distribute players into rows
  const positioned: Array<{ player: PlayerFrequency; cx: number; cy: number }> = []
  let playerIdx = 0

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const n = rows[rowIdx]
    const cy = yPositions[rowIdx]

    for (let i = 0; i < n; i++) {
      if (playerIdx >= players.length) break
      // Distribute evenly: x_i = 50 - (N-1)*spacing/2 + i*spacing
      const spacing = Math.min(22, 80 / Math.max(n, 1))
      const cx = 50 - ((n - 1) * spacing) / 2 + i * spacing
      positioned.push({ player: players[playerIdx], cx, cy })
      playerIdx++
    }
  }

  return (
    <svg
      viewBox="0 0 100 140"
      className="w-full mx-auto max-h-72"
      role="img"
      aria-label="Campo con alineación probable"
    >
      <rect x="0" y="0" width="100" height="140" fill={PITCH_GREEN} rx="2" />
      <PitchMarkings />
      {positioned.map(({ player, cx, cy }) => (
        <PlayerDot key={player.name} player={player} cx={cx} cy={cy} />
      ))}
    </svg>
  )
}
