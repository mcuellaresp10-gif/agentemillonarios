import { Link } from 'react-router-dom'
import type { PlayerSeasonStats } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { MapaPosicionCampo } from '@/components/shared/MapaPosicionCampo'
import { ratingColor } from '@/utils/calculators'
import { posicionEnEspanol } from '@/utils/positions'
import { cn } from '@/lib/utils'

export function JugadorCard({ player }: { player: PlayerSeasonStats }) {
  return (
    <Card className="overflow-hidden hover:border-mill-blue/40 transition-colors">
      <CardContent className="p-0">
        <div className="flex gap-3 p-4 pb-2">
          <img
            src={player.photo || '/millonarios.svg'}
            alt=""
            className="h-14 w-14 rounded-full object-cover bg-slate-100 shrink-0"
            loading="lazy"
          />
          <div className="flex-1 min-w-0">
            <Link
              to={`/estadisticas/${player.playerId}`}
              className="font-semibold text-mill-blue hover:underline truncate block"
            >
              {player.name}
            </Link>
            <p className="text-xs text-slate-500">
              {posicionEnEspanol(player.position)}
              {player.number != null && ` · #${player.number}`}
            </p>
            <p className={cn('text-sm font-medium mt-1', ratingColor(player.ratingAvg))}>
              ⭐ {player.ratingAvg?.toFixed(1) ?? '—'}
            </p>
          </div>
        </div>
        <div className="px-3 pb-2">
          <MapaPosicionCampo
            positions={player.positionsPlayed}
            compact
          />
        </div>
        <div className="grid grid-cols-4 gap-1 px-3 pb-3 text-center text-[10px] font-stats text-slate-600 border-t border-slate-100 pt-2">
          <span>⚽ {player.goals}</span>
          <span>🎯 {player.assists}</span>
          <span>⏱ {player.minutes}m</span>
          <span>
            xG {player.xG90?.toFixed(2) ?? '—'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
