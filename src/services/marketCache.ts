import type { PlayerMarketValue } from '@/types'

const PREFIX = 'mf_tm_v2:'
const TTL_MS = 7 * 24 * 60 * 60 * 1000

interface Entry {
  data: PlayerMarketValue
  timestamp: number
}

export function getMarketCached(playerId: number): PlayerMarketValue | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}${playerId}`)
    if (!raw) return null
    const entry = JSON.parse(raw) as Entry
    if (Date.now() - entry.timestamp > TTL_MS) {
      localStorage.removeItem(`${PREFIX}${playerId}`)
      return null
    }
    if (entry.data.configured === false) {
      localStorage.removeItem(`${PREFIX}${playerId}`)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

export function setMarketCached(playerId: number, data: PlayerMarketValue): void {
  if (data.configured === false) return
  try {
    const entry: Entry = { data, timestamp: Date.now() }
    localStorage.setItem(`${PREFIX}${playerId}`, JSON.stringify(entry))
  } catch {
    /* quota */
  }
}
