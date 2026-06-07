import type { Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LINKS_FILE = path.join(__dirname, '../../data/sofascore-links.json')
const ACTOR_ID = 'azzouzana~sofascore-scraper-pro'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

interface GoalActionStep {
  player: string
  eventType: 'interception' | 'pass' | 'cross' | 'goal' | string
  isAssist?: boolean
  from: { x: number; y: number }
  to?: { x: number; y: number }
}

interface GoalAction {
  player: string
  time: number
  bodyPart?: string
  actions: GoalActionStep[]
  goalMouth?: { x: number; y: number }
}

interface CacheEntry {
  data: { goals: GoalAction[]; _debug?: string }
  timestamp: number
}

const cache = new Map<string, CacheEntry>()

function getApifyToken(): string {
  return (process.env.APIFY_TOKEN ?? '').trim()
}

// --- Link storage (data/sofascore-links.json) ---
// { "fixtureId": "https://www.sofascore.com/football/match/..." }

function readLinks(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function writeLinks(links: Record<string, string>) {
  fs.mkdirSync(path.dirname(LINKS_FILE), { recursive: true })
  fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2))
}

// --- Apify actor call ---

async function runActor(sofascoreUrl: string): Promise<unknown[]> {
  const token = getApifyToken()
  if (!token) throw new Error('APIFY_TOKEN no configurado')

  const res = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startUrls: [sofascoreUrl] }),
      signal: AbortSignal.timeout(120_000),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Apify → ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json() as Promise<unknown[]>
}

// --- Parse goals from actor response ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractIncidents(items: any[]): any[] {
  for (const item of items) {
    if (Array.isArray(item?.incidents)) return item.incidents
    if (Array.isArray(item?.data?.incidents)) return item.data.incidents
  }
  return []
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseGoals(incidents: any[]): GoalAction[] {
  const goals: GoalAction[] = []
  for (const inc of incidents) {
    if (inc.incidentType !== 'goal' || !inc.isHome) continue
    const chain = inc.footballPassingNetworkAction
    if (!Array.isArray(chain) || chain.length === 0) continue

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actions: GoalActionStep[] = chain.map((step: any): GoalActionStep => ({
      player: step.player?.shortName ?? step.player?.name ?? '—',
      eventType: step.eventType ?? 'pass',
      isAssist: step.isAssist ?? false,
      from: { x: step.playerCoordinates?.x ?? 0, y: step.playerCoordinates?.y ?? 0 },
      to: step.passEndCoordinates
        ? { x: step.passEndCoordinates.x, y: step.passEndCoordinates.y }
        : undefined,
    }))

    const lastStep = chain[chain.length - 1]
    goals.push({
      player: inc.player?.shortName ?? inc.player?.name ?? '—',
      time: inc.time ?? 0,
      bodyPart: lastStep?.bodyPart,
      actions,
      goalMouth: lastStep?.goalMouthCoordinates
        ? { x: lastStep.goalMouthCoordinates.x, y: lastStep.goalMouthCoordinates.y }
        : undefined,
    })
  }
  return goals
}

// --- Handlers ---

export async function sofascoreMatchHandler(req: Request, res: Response) {
  const fixtureId = String(req.query.fixtureId ?? '')
  if (!fixtureId) {
    res.status(400).json({ error: 'fixtureId requerido' })
    return
  }

  // Check memory cache
  const cacheKey = `sf:${fixtureId}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    res.json(cached.data)
    return
  }

  // Check if we have a linked Sofascore URL
  const links = readLinks()
  const sofascoreUrl = links[fixtureId]
  if (!sofascoreUrl) {
    res.json({ goals: [], _debug: 'no_link' })
    return
  }

  if (!getApifyToken()) {
    res.json({ goals: [], _debug: 'no_apify_token' })
    return
  }

  console.log(`[sofascore] fetching fixture=${fixtureId} url=${sofascoreUrl}`)

  try {
    const items = await runActor(sofascoreUrl)
    console.log(`[sofascore] actor items: ${items.length}, keys: ${Object.keys((items[0] as Record<string,unknown>) ?? {}).join(', ')}`)

    const incidents = extractIncidents(items as Record<string, unknown>[])
    console.log(`[sofascore] incidents: ${incidents.length}`)

    const goals = parseGoals(incidents)
    console.log(`[sofascore] goals with chain: ${goals.length}`)

    const payload = { goals, _debug: `ok:${goals.length}goals` }
    cache.set(cacheKey, { data: payload, timestamp: Date.now() })
    res.json(payload)
  } catch (err) {
    console.error('[sofascore] ERROR:', err)
    res.json({ goals: [], _debug: String(err) })
  }
}

export async function sofascorelinkHandler(req: Request, res: Response) {
  const { fixtureId, url } = req.body as { fixtureId?: string; url?: string }

  if (!fixtureId || !url) {
    res.status(400).json({ error: 'fixtureId y url requeridos' })
    return
  }

  if (!url.includes('sofascore.com')) {
    res.status(400).json({ error: 'La URL debe ser de sofascore.com' })
    return
  }

  // Normalize: remove locale prefix (/es-la/, /pt-br/, etc.) and hash fragment
  const normalized = url.trim()
    .replace(/sofascore\.com\/[a-z]{2}-[a-z]{2}\//, 'sofascore.com/')
    .split('#')[0]
    .split('?')[0]

  const links = readLinks()
  links[fixtureId] = normalized
  writeLinks(links)

  // Invalidate memory cache so next GET re-fetches
  cache.delete(`sf:${fixtureId}`)

  console.log(`[sofascore] link saved fixture=${fixtureId} → ${url}`)
  res.json({ ok: true })
}
