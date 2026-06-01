import type { PlayerMarketValue } from '@/types'
import { getMarketCached, setMarketCached } from '@/services/marketCache'

export interface MarketLookupParams {
  playerId: number
  name: string
  teamName: string
  age: number | null
  nationality: string
  position: string
}

export async function fetchPlayerMarketValue(
  params: MarketLookupParams,
): Promise<PlayerMarketValue> {
  const cached = getMarketCached(params.playerId)
  if (cached) return cached

  const qs = new URLSearchParams({
    playerId: String(params.playerId),
    name: params.name,
    teamName: params.teamName,
    nationality: params.nationality,
    position: params.position,
  })
  if (params.age != null) qs.set('age', String(params.age))

  const res = await fetch(`/api/market/player?${qs}`)
  const data = (await res.json()) as PlayerMarketValue
  if (!res.ok) {
    return {
      ...data,
      configured: data.configured ?? true,
      error: data.error ?? 'Error al consultar Transfermarkt',
    }
  }
  setMarketCached(params.playerId, data)
  return data
}
