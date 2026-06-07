import type { PlayerSeasonStats } from '@/types'
import { posicionEnEspanol } from '@/utils/positions'
import { ratingColor } from '@/utils/calculators'
import { formatEurShort } from '@/utils/formatMarketValue'
import { usePlayerTransfers } from '@/hooks/usePlayerTransfers'
import { usePlayerMarketValue } from '@/hooks/usePlayerMarket'
import { cn } from '@/lib/utils'

export function PerfilReferenciaReemplazo({
  player,
}: {
  player: PlayerSeasonStats
}) {
  const { data: transfer } = usePlayerTransfers(player.playerId, true)
  const { data: market } = usePlayerMarketValue(player, true)

  const chips = [
    { label: 'Rating', value: player.ratingAvg?.toFixed(1) ?? '—' },
    { label: 'Goles', value: String(player.goals) },
    { label: 'Asist.', value: String(player.assists) },
    { label: 'Min.', value: String(player.minutes) },
    { label: 'xG/90', value: player.xG90?.toFixed(2) ?? '—' },
    { label: 'Pases clave', value: player.keyPasses != null ? String(player.keyPasses) : '—' },
    { label: '% Duelos', value: player.duelsWonPct != null ? `${player.duelsWonPct}%` : '—' },
  ]

  if (market?.marketValueLabel || market?.marketValueEur != null) {
    chips.push({
      label: 'Valor TM',
      value:
        market.marketValueLabel ?? formatEurShort(market.marketValueEur),
    })
  }
  if (transfer?.lastTransferFee) {
    chips.push({
      label: 'Últ. traspaso',
      value: transfer.lastTransferFee,
    })
  }

  return (
    <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-4 flex flex-col sm:flex-row gap-4">
      <img
        src={player.photo || '/Millonarios.png'}
        alt=""
        className="h-16 w-16 rounded-full border-2 border-mill-gold/60 object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-amber-800 uppercase tracking-wide">
          Perfil a reemplazar
        </p>
        <h4 className="font-bold text-mill-blue text-lg">{player.name}</h4>
        <p className="text-sm text-slate-600">
          {posicionEnEspanol(player.position)}
          {player.number != null ? ` · #${player.number}` : ''}
          {player.age != null ? ` · ${player.age} años` : ''}
        </p>
        <p className={cn('text-sm font-stats font-semibold mt-1', ratingColor(player.ratingAvg))}>
          Rating temporada {player.ratingAvg?.toFixed(1) ?? '—'}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {chips.map((c) => (
            <span
              key={c.label}
              className="text-xs rounded-md bg-white border border-slate-200 px-2 py-1"
            >
              <span className="text-slate-500">{c.label}: </span>
              <span className="font-stats font-medium text-mill-blue">{c.value}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
