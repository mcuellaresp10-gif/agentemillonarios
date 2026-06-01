import type { StandingRow } from '@/types'
import { TEAM_MILLONARIOS } from '@/config/constants'
import { cn } from '@/lib/utils'

export function TablaBasica({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-blue-100 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-mill-blue text-white text-left">
            <th className="px-3 py-2 font-medium">Pos</th>
            <th className="px-3 py-2 font-medium">Equipo</th>
            <th className="px-3 py-2 font-medium font-stats">PJ</th>
            <th className="px-3 py-2 font-medium font-stats">PG</th>
            <th className="px-3 py-2 font-medium font-stats">PE</th>
            <th className="px-3 py-2 font-medium font-stats">PP</th>
            <th className="px-3 py-2 font-medium font-stats">GF</th>
            <th className="px-3 py-2 font-medium font-stats">GC</th>
            <th className="px-3 py-2 font-medium font-stats">DIF</th>
            <th className="px-3 py-2 font-medium font-stats">PTS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const highlight = row.team.id === TEAM_MILLONARIOS
            return (
              <tr
                key={`${row.team.id}-${row.group ?? ''}`}
                className={cn(
                  'border-b border-slate-100',
                  highlight && 'bg-blue-50 border-l-4 border-l-mill-gold font-medium',
                )}
              >
                <td className="px-3 py-2 font-stats">{row.rank}</td>
                <td className="px-3 py-2 flex items-center gap-2">
                  <img src={row.team.logo} alt="" className="h-5 w-5" loading="lazy" />
                  <span className={highlight ? 'text-mill-blue font-bold' : ''}>
                    {row.team.name}
                  </span>
                </td>
                <td className="px-3 py-2 font-stats">{row.played}</td>
                <td className="px-3 py-2 font-stats">{row.win}</td>
                <td className="px-3 py-2 font-stats">{row.draw}</td>
                <td className="px-3 py-2 font-stats">{row.lose}</td>
                <td className="px-3 py-2 font-stats">{row.goalsFor}</td>
                <td className="px-3 py-2 font-stats">{row.goalsAgainst}</td>
                <td className="px-3 py-2 font-stats">{row.diff}</td>
                <td className="px-3 py-2 font-stats font-semibold">{row.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
