import type { PlayerSeasonStats, ScoutTeam } from '@/types'
import type {
  MillonariosSnapshot,
  ScoutLeagueSnapshot,
  ScoutSnapshotManifest,
  SeasonKey,
} from '@/types/scoutSnapshot'

const SNAPSHOT_BASE =
  import.meta.env.VITE_SNAPSHOT_URL ?? '/data/snapshot'

let manifestCache: ScoutSnapshotManifest | null = null
let manifestPromise: Promise<ScoutSnapshotManifest | null> | null = null

const leagueCache = new Map<string, ScoutLeagueSnapshot>()
const leaguePromises = new Map<string, Promise<ScoutLeagueSnapshot | null>>()

const millCache = new Map<SeasonKey, MillonariosSnapshot>()
const millPromises = new Map<SeasonKey, Promise<MillonariosSnapshot | null>>()

function leagueCacheKey(leagueId: number, seasonKey: SeasonKey): string {
  return `${leagueId}:${seasonKey}`
}

export function isSnapshotAvailable(): boolean {
  return manifestCache != null && manifestCache.leagues.length > 0
}

export async function loadManifest(force = false): Promise<ScoutSnapshotManifest | null> {
  if (typeof window === 'undefined') return null
  if (manifestCache && !force) return manifestCache
  if (manifestPromise && !force) return manifestPromise

  manifestPromise = (async () => {
    try {
      const res = await fetch(`${SNAPSHOT_BASE}/manifest.json`, {
        cache: force ? 'no-cache' : 'default',
      })
      if (!res.ok) return null
      const data = (await res.json()) as ScoutSnapshotManifest
      if (!data?.leagues?.length) return null
      manifestCache = data
      return data
    } catch {
      return null
    }
  })()

  return manifestPromise
}

export async function getManifestGeneratedAt(): Promise<string | null> {
  const m = await loadManifest()
  return m?.generatedAt ?? null
}

async function loadLeagueSnapshot(
  leagueId: number,
  seasonKey: SeasonKey,
): Promise<ScoutLeagueSnapshot | null> {
  const key = leagueCacheKey(leagueId, seasonKey)
  if (leagueCache.has(key)) return leagueCache.get(key)!

  const existing = leaguePromises.get(key)
  if (existing) return existing

  const promise = (async () => {
    const manifest = await loadManifest()
    if (!manifest) return null
    const entry = manifest.leagues.find(
      (l) => l.leagueId === leagueId && l.seasonKey === seasonKey,
    )
    if (!entry) return null
    try {
      const res = await fetch(`${SNAPSHOT_BASE}/${entry.path}`)
      if (!res.ok) return null
      const data = (await res.json()) as ScoutLeagueSnapshot
      if (!data?.teams?.length) return null
      leagueCache.set(key, data)
      return data
    } catch {
      return null
    }
  })()

  leaguePromises.set(key, promise)
  return promise
}

async function loadMillonariosSnapshot(
  seasonKey: SeasonKey,
): Promise<MillonariosSnapshot | null> {
  if (millCache.has(seasonKey)) return millCache.get(seasonKey)!

  const existing = millPromises.get(seasonKey)
  if (existing) return existing

  const promise = (async () => {
    const manifest = await loadManifest()
    if (!manifest) return null
    const entry = manifest.millonarios.find((m) => m.seasonKey === seasonKey)
    if (!entry) return null
    try {
      const res = await fetch(`${SNAPSHOT_BASE}/${entry.path}`)
      if (!res.ok) return null
      const data = (await res.json()) as MillonariosSnapshot
      if (!data?.players?.length) return null
      millCache.set(seasonKey, data)
      return data
    } catch {
      return null
    }
  })()

  millPromises.set(seasonKey, promise)
  return promise
}

export async function getSnapshotTeamsForLeagues(
  seasonKey: SeasonKey,
  leagueIds: number[],
): Promise<ScoutTeam[]> {
  const all: ScoutTeam[] = []
  for (const leagueId of leagueIds) {
    const snap = await loadLeagueSnapshot(leagueId, seasonKey)
    if (snap?.teams.length) all.push(...snap.teams)
  }
  return all.sort(
    (a, b) =>
      a.leagueLabel.localeCompare(b.leagueLabel, 'es') ||
      a.name.localeCompare(b.name, 'es'),
  )
}

export interface SnapshotPoolEntry {
  teamId: number
  leagueId: number
  leagueLabel: string
}

export async function getSnapshotPlayersForTeams(
  seasonKey: SeasonKey,
  entries: SnapshotPoolEntry[],
): Promise<PlayerSeasonStats[]> {
  const byLeague = new Map<number, SnapshotPoolEntry[]>()
  for (const e of entries) {
    if (!byLeague.has(e.leagueId)) byLeague.set(e.leagueId, [])
    byLeague.get(e.leagueId)!.push(e)
  }

  const results: PlayerSeasonStats[] = []
  for (const [leagueId, leagueEntries] of byLeague) {
    const snap = await loadLeagueSnapshot(leagueId, seasonKey)
    if (!snap) continue
    const teamIds = new Set(leagueEntries.map((e) => e.teamId))
    for (const p of snap.players) {
      if (teamIds.has(p.teamId)) {
        results.push({
          ...p,
          leagueId: p.leagueId ?? leagueId,
          leagueLabel:
            p.leagueLabel ??
            leagueEntries.find((e) => e.teamId === p.teamId)?.leagueLabel ??
            snap.label,
        })
      }
    }
  }
  return results
}

export async function getSnapshotTeamPlayers(
  seasonKey: SeasonKey,
  teamId: number,
  leagueId: number,
  leagueLabel: string,
): Promise<PlayerSeasonStats[] | null> {
  const snap = await loadLeagueSnapshot(leagueId, seasonKey)
  if (!snap) return null
  const players = snap.players.filter((p) => p.teamId === teamId)
  if (!players.length) return null
  return players.map((p) => ({
    ...p,
    leagueId,
    leagueLabel,
  }))
}

export async function getAllLeaguePlayers(
  leagueId: number,
  seasonKey: SeasonKey,
): Promise<PlayerSeasonStats[]> {
  const snap = await loadLeagueSnapshot(leagueId, seasonKey)
  if (!snap) return []
  return snap.players.map((p) => ({
    ...p,
    leagueId: p.leagueId ?? leagueId,
    leagueLabel: p.leagueLabel ?? snap.label,
  }))
}

export async function getSnapshotMillonariosPlayers(
  seasonKey: SeasonKey,
): Promise<PlayerSeasonStats[] | null> {
  const snap = await loadMillonariosSnapshot(seasonKey)
  return snap?.players ?? null
}

export function clearSnapshotCaches(): void {
  manifestCache = null
  manifestPromise = null
  leagueCache.clear()
  leaguePromises.clear()
  millCache.clear()
  millPromises.clear()
}
