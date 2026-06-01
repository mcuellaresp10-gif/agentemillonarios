import { useEffect, useState } from 'react'
import { getPlayerTransfers } from '@/services/apiFootball'
import { fetchPlayerMarketValue } from '@/services/playerMarket'
import type { ScoutCandidate } from '@/types'

export interface CandidateEnrichment {
  lastTransferFee: string | null
  lastTransferDate: string | null
  marketValueEur: number | null
  marketValueLabel: string | null
  transfermarktUrl?: string
  marketMatchConfidence?: 'alta' | 'media' | 'baja'
}

const TOP_N = 30
const CONCURRENCY = 2

async function enrichOne(player: ScoutCandidate): Promise<CandidateEnrichment> {
  const [transfer, market] = await Promise.all([
    getPlayerTransfers(player.playerId).catch(() => null),
    fetchPlayerMarketValue({
      playerId: player.playerId,
      name: player.name,
      teamName: player.teamName,
      age: player.age,
      nationality: player.nationality,
      position: player.position,
    }).catch(
      (): import('@/types').PlayerMarketValue => ({
        marketValueEur: null,
        marketValueLabel: null,
        matchConfidence: null,
        configured: false,
      }),
    ),
  ])
  return {
    lastTransferFee: transfer?.lastTransferFee ?? null,
    lastTransferDate: transfer?.lastTransferDate ?? null,
    marketValueEur: market.marketValueEur,
    marketValueLabel: market.marketValueLabel,
    transfermarktUrl: market.transfermarktUrl,
    marketMatchConfidence: market.matchConfidence ?? undefined,
  }
}

async function runPool<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let index = 0
  async function loop(): Promise<void> {
    while (true) {
      const i = index++
      if (i >= items.length) break
      results[i] = await worker(items[i])
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => loop()),
  )
  return results
}

export function useCandidatesEnrichment(
  players: ScoutCandidate[],
  enabled: boolean,
) {
  const [map, setMap] = useState<Record<number, CandidateEnrichment>>({})
  const [loading, setLoading] = useState(false)

  const key = enabled
    ? players
        .slice(0, TOP_N)
        .map((p) => p.playerId)
        .join(',')
    : ''

  useEffect(() => {
    if (!enabled || !key) {
      setMap({})
      return
    }
    let cancelled = false
    const batch = players.slice(0, TOP_N)
    setLoading(true)
    runPool(batch, enrichOne, CONCURRENCY).then((rows) => {
      if (cancelled) return
      const next: Record<number, CandidateEnrichment> = {}
      batch.forEach((p, i) => {
        next[p.playerId] = rows[i]
      })
      setMap(next)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [key, enabled])

  return { enrichment: map, loadingEnrichment: loading }
}
