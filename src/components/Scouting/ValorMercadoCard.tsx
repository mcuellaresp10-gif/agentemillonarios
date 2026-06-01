import type { PlayerMarketValue, PlayerTransferSummary } from '@/types'
import { formatEurShort } from '@/utils/formatMarketValue'
import { cn } from '@/lib/utils'

const CONFIDENCE_LABEL: Record<string, string> = {
  alta: 'Coincidencia alta',
  media: 'Coincidencia media',
  baja: 'Coincidencia baja — verificar',
}

export function ValorMercadoCard({
  transfer,
  market,
  loadingTransfer,
  loadingMarket,
}: {
  transfer: PlayerTransferSummary | null | undefined
  market: PlayerMarketValue | null | undefined
  loadingTransfer?: boolean
  loadingMarket?: boolean
}) {
  return (
    <div className="rounded-lg border bg-white p-4 space-y-4">
      <h3 className="font-semibold text-mill-blue">Valor y mercado</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs text-slate-500">Valor de mercado (Transfermarkt)</p>
          {loadingMarket ? (
            <p className="text-sm text-slate-400 mt-1">Consultando…</p>
          ) : market?.configured === false ? (
            <p className="text-sm text-amber-700 mt-1">
              No configurado. Añade <code className="text-xs">APIFY_TOKEN</code> en .env para
              valores TM.
            </p>
          ) : market?.error ? (
            <p className="text-sm text-amber-700 mt-1">{market.error}</p>
          ) : market?.marketValueLabel || market?.marketValueEur != null ? (
            <>
              <p className="text-lg font-stats font-semibold text-mill-blue mt-1">
                {market.marketValueLabel ??
                  formatEurShort(market.marketValueEur)}
              </p>
              {market.marketValueEur != null && market.marketValueLabel && (
                <p className="text-xs text-slate-400">
                  ≈ {formatEurShort(market.marketValueEur)}
                </p>
              )}
              {market.matchConfidence && (
                <p
                  className={cn(
                    'text-xs mt-1',
                    market.matchConfidence === 'baja'
                      ? 'text-amber-700'
                      : 'text-slate-500',
                  )}
                >
                  {CONFIDENCE_LABEL[market.matchConfidence]}
                </p>
              )}
              {market.transfermarktUrl && (
                <a
                  href={market.transfermarktUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-mill-blue hover:underline mt-2 inline-block"
                >
                  Ver en Transfermarkt →
                </a>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500 mt-1">Sin coincidencia en Transfermarkt</p>
          )}
        </div>
        <div className="rounded-md border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs text-slate-500">Último traspaso (API-Football)</p>
          {loadingTransfer ? (
            <p className="text-sm text-slate-400 mt-1">Cargando…</p>
          ) : transfer?.lastTransferFee ? (
            <>
              <p className="text-lg font-stats font-semibold text-mill-blue mt-1">
                {transfer.lastTransferFee}
              </p>
              {transfer.lastTransferDate && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(transfer.lastTransferDate).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              )}
              {(transfer.clubOut || transfer.clubIn) && (
                <p className="text-xs text-slate-500 mt-1">
                  {transfer.clubOut && <span>{transfer.clubOut}</span>}
                  {transfer.clubOut && transfer.clubIn && ' → '}
                  {transfer.clubIn && <span>{transfer.clubIn}</span>}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500 mt-1">Sin datos de traspaso</p>
          )}
        </div>
      </div>
      <p className="text-[11px] text-slate-400">
        El valor TM es referencial (Transfermarkt). La ficha de traspaso es el último movimiento
        registrado en API-Football, no el valor actual.
      </p>
    </div>
  )
}
