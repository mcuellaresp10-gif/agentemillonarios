import { parseMarketValueToEur } from '@/utils/formatMarketValue'

export interface TmSearchHit {
  playerName?: string
  name?: string
  club?: string
  team?: string
  age?: number | string
  nationality?: string
  position?: string
  marketValue?: string
  market_value?: string
  playerUrl?: string
  url?: string
}

export type MatchConfidence = 'alta' | 'media' | 'baja'

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
  const cw = nc.split(' ').filter((w) => w.length > 3)
  const hw = nh.split(' ').filter((w) => w.length > 3)
  if (cw.length && hw.length && cw[0] === hw[0]) return 0.7
  return nameSimilarity(nc, nh)
}

export function pickBestTransfermarktMatch(
  hits: TmSearchHit[],
  target: {
    name: string
    teamName: string
    age: number | null
    nationality: string
  },
): {
  marketValueEur: number | null
  marketValueLabel: string | null
  transfermarktUrl?: string
  matchConfidence: MatchConfidence
} | null {
  if (!hits.length) return null

  let best: { hit: TmSearchHit; score: number } | null = null
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
  const confidence: MatchConfidence =
    best.score >= 75 ? 'alta' : best.score >= 55 ? 'media' : 'baja'

  return {
    marketValueEur: parseMarketValueToEur(label),
    marketValueLabel: label,
    transfermarktUrl: best.hit.playerUrl ?? best.hit.url,
    matchConfidence: confidence,
  }
}
