import { CACHE_DURATION_MS } from '@/config/constants'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const PREFIX = 'mf_cache_v2:'

export function cacheKey(endpoint: string, params: Record<string, unknown>): string {
  const sorted = JSON.stringify(
    Object.keys(params)
      .sort()
      .reduce(
        (acc, k) => {
          acc[k] = params[k]
          return acc
        },
        {} as Record<string, unknown>,
      ),
  )
  return `${PREFIX}${endpoint}:${sorted}`
}

export function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (Date.now() - entry.timestamp > CACHE_DURATION_MS) {
      localStorage.removeItem(key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

export function setCached<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() }
  try {
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    /* quota exceeded — ignore */
  }
}

export function getStaleCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    return entry.data
  } catch {
    return null
  }
}

const BUDGET_KEY = 'mf_api_requests'

export function logApiRequest(endpoint: string): void {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const raw = localStorage.getItem(BUDGET_KEY)
    const data = raw
      ? (JSON.parse(raw) as Record<string, number>)
      : {}
    const key = `${today}:${endpoint}`
    data[key] = (data[key] ?? 0) + 1
    localStorage.setItem(BUDGET_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}
