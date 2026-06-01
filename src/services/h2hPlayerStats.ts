import { TEAM_MILLONARIOS } from '@/config/constants'
import { getFixtureEvents, getFixtureLineups } from './apiFootball'
import type {
  Fixture,
  FixtureEvent,
  FixtureLineup,
  H2HFixturePlayerMeta,
  H2HPlayerAggregate,
  H2HPlayerStatsBundle,
} from '@/types'

function normName(name: string): string {
  return name.trim()
}

function isMillonariosGoal(e: FixtureEvent): boolean {
  if (e.teamId !== TEAM_MILLONARIOS) return false
  if (e.type !== 'Goal') return false
  const d = e.detail?.toLowerCase() ?? ''
  if (d.includes('own')) return false
  return true
}

function getScorersFromEvents(events: FixtureEvent[]): string[] {
  return events.filter(isMillonariosGoal).map((e) => normName(e.player))
}

function getMillonariosLineup(lineups: FixtureLineup[]): FixtureLineup | undefined {
  return lineups.find((l) => l.teamId === TEAM_MILLONARIOS)
}

function countAppearance(
  map: Map<string, H2HPlayerAggregate>,
  name: string,
  kind: 'goal' | 'assist' | 'appearance',
) {
  const key = normName(name)
  if (!key || key === '—') return
  const cur = map.get(key) ?? { name: key, goals: 0, assists: 0, appearances: 0 }
  if (kind === 'goal') cur.goals += 1
  if (kind === 'assist') cur.assists += 1
  if (kind === 'appearance') cur.appearances += 1
  map.set(key, cur)
}

export function aggregateFromFixtureData(
  fixtures: Fixture[],
  eventsList: FixtureEvent[][],
  lineupsList: FixtureLineup[][],
): H2HPlayerStatsBundle {
  const map = new Map<string, H2HPlayerAggregate>()
  const byFixture: H2HFixturePlayerMeta[] = []
  let analyzed = 0

  fixtures.forEach((fixture, i) => {
    if (fixture.status !== 'FT') return
    analyzed++
    const events = eventsList[i] ?? []
    const lineups = lineupsList[i] ?? []
    const millLineup = getMillonariosLineup(lineups)

    const scorers = getScorersFromEvents(events)
    for (const s of scorers) countAppearance(map, s, 'goal')

    for (const e of events) {
      if (e.teamId === TEAM_MILLONARIOS && e.assist) {
        countAppearance(map, e.assist, 'assist')
      }
    }

    const squad = [
      ...(millLineup?.startXI ?? []),
      ...(millLineup?.substitutes ?? []),
    ]
    for (const p of squad) {
      countAppearance(map, p.name, 'appearance')
    }

    byFixture.push({
      fixtureId: fixture.id,
      scorers,
      formation: millLineup?.formation,
      coach: millLineup?.coach,
    })
  })

  const players = Array.from(map.values()).sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals
    if (b.appearances !== a.appearances) return b.appearances - a.appearances
    return a.name.localeCompare(b.name)
  })

  const topScorer =
    players.filter((p) => p.goals > 0).sort((a, b) => b.goals - a.goals)[0] ?? null

  const mostAppearances =
    players.length > 0
      ? [...players].sort((a, b) => b.appearances - a.appearances)[0]
      : null

  return {
    players,
    topScorer,
    mostAppearances,
    byFixture,
    fixturesAnalyzed: analyzed,
  }
}

export async function fetchH2HPlayerStats(
  fixtures: Fixture[],
): Promise<H2HPlayerStatsBundle> {
  const finished = fixtures.filter((f) => f.status === 'FT')

  const details = await Promise.all(
    finished.map(async (f) => {
      const [events, lineups] = await Promise.all([
        getFixtureEvents(f.id),
        getFixtureLineups(f.id),
      ])
      return { id: f.id, events, lineups }
    }),
  )

  const byId = new Map(details.map((d) => [d.id, d]))

  const orderedEvents: FixtureEvent[][] = []
  const orderedLineups: FixtureLineup[][] = []

  for (const f of fixtures) {
    const d = f.status === 'FT' ? byId.get(f.id) : undefined
    orderedEvents.push(d?.events ?? [])
    orderedLineups.push(d?.lineups ?? [])
  }

  return aggregateFromFixtureData(fixtures, orderedEvents, orderedLineups)
}
