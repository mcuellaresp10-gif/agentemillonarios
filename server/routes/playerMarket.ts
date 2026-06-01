import type { Request, Response } from 'express'

function getApifyToken(): string {
  return (process.env.APIFY_TOKEN ?? '').trim()
}
const ACTOR_ID = 'lulzasaur~transfermarkt-scraper'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

interface CacheEntry {
  data: Record<string, unknown>
  timestamp: number
}

const serverCache = new Map<string, CacheEntry>()

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function nameSimilarity(a: string, b: string): number {
  const na = norm(a)
  const nb = norm(b)
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.85
  const ta = new Set(na.split(' '))
  const tb = new Set(nb.split(' '))
  let inter = 0
  for (const t of ta) if (tb.has(t)) inter++
  const union = ta.size + tb.size - inter
  return union > 0 ? inter / union : 0
}

function clubSimilarity(candidate: string, hit: string): number {
  const nc = norm(candidate)
  const nh = norm(hit)
  if (!nc || !nh) return 0
  if (nc === nh || nc.includes(nh) || nh.includes(nc)) return 1
  return nameSimilarity(nc, nh)
}

function parseMarketValueToEur(raw: string | null | undefined): number | null {
  if (!raw || typeof raw !== 'string') return null
  const s = raw.replace(/\s/g, '').toLowerCase()
  const numMatch = s.match(/[\d,.]+/)
  if (!numMatch) return null
  const num = parseFloat(numMatch[0].replace(',', '.'))
  if (!Number.isFinite(num)) return null
  if (s.includes('bn') || s.includes('b')) return Math.round(num * 1e9)
  if (s.includes('m')) return Math.round(num * 1e6)
  if (s.includes('k') || s.includes('th')) return Math.round(num * 1e3)
  return Math.round(num)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickBest(hits: any[], target: { name: string; teamName: string; age: number | null; nationality: string }) {
  if (!hits.length) return null
  let best: { hit: (typeof hits)[0]; score: number } | null = null
  for (const hit of hits) {
    const hitName = hit.playerName ?? hit.name ?? ''
    const hitClub = hit.club ?? hit.team ?? ''
    let score = nameSimilarity(target.name, hitName) * 50
    score += clubSimilarity(target.teamName, hitClub) * 35
    if (target.age != null && hit.age != null) {
      const ha = Number(hit.age)
      if (Number.isFinite(ha) && Math.abs(ha - target.age) <= 2) score += 10
      else if (Number.isFinite(ha) && Math.abs(ha - target.age) <= 4) score += 4
    }
    if (target.nationality && hit.nationality) {
      const nn = norm(target.nationality)
      const nh = norm(String(hit.nationality))
      if (nn && nh && (nn.includes(nh) || nh.includes(nn))) score += 5
    }
    if (!best || score > best.score) best = { hit, score }
  }
  if (!best || best.score < 40) return null
  const label = best.hit.marketValue ?? best.hit.market_value ?? null
  const confidence = best.score >= 75 ? 'alta' : best.score >= 55 ? 'media' : 'baja'
  return {
    marketValueEur: parseMarketValueToEur(label),
    marketValueLabel: label,
    transfermarktUrl: best.hit.playerUrl ?? best.hit.url ?? undefined,
    matchConfidence: confidence,
  }
}

async function searchTransfermarkt(query: string): Promise<unknown[]> {
  const token = getApifyToken()
  const url = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${token}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'playerSearch',
      query,
      limit: 8,
    }),
    signal: AbortSignal.timeout(120_000),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Apify ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export function marketStatusHandler(_req: Request, res: Response) {
  const token = getApifyToken()
  res.json({
    configured: token.length > 0,
    actor: ACTOR_ID,
  })
}

export async function playerMarketHandler(req: Request, res: Response) {
  const playerId = Number(req.query.playerId)
  const name = String(req.query.name ?? '')
  const teamName = String(req.query.teamName ?? '')
  const nationality = String(req.query.nationality ?? '')
  const ageRaw = req.query.age
  const age = ageRaw != null && ageRaw !== '' ? Number(ageRaw) : null

  if (!playerId || !name) {
    res.status(400).json({ error: 'playerId y name son requeridos' })
    return
  }

  if (!getApifyToken()) {
    res.json({
      marketValueEur: null,
      marketValueLabel: null,
      matchConfidence: null,
      configured: false,
    })
    return
  }

  const cacheKey = `tm:${playerId}`
  const cached = serverCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    res.json({ ...cached.data, configured: true })
    return
  }

  try {
    const query = `${name} ${teamName}`.trim()
    const hits = await searchTransfermarkt(query)
    const match = pickBest(hits, { name, teamName, age, nationality })
    const payload = {
      marketValueEur: match?.marketValueEur ?? null,
      marketValueLabel: match?.marketValueLabel ?? null,
      transfermarktUrl: match?.transfermarktUrl,
      matchConfidence: match?.matchConfidence ?? null,
      configured: true,
    }
    serverCache.set(cacheKey, { data: payload, timestamp: Date.now() })
    res.json(payload)
  } catch (err) {
    console.error('[market]', err)
    res.status(502).json({
      marketValueEur: null,
      marketValueLabel: null,
      matchConfidence: null,
      configured: true,
      error: 'No se pudo consultar Transfermarkt',
    })
  }
}
