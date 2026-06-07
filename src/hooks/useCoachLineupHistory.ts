import { useQueries } from '@tanstack/react-query'
import { getFixtureLineups } from '@/services/apiFootball'
import { useRecentFixtures } from '@/hooks/usePartidos'
import { TEAM_MILLONARIOS, CACHE_DURATION_MS } from '@/config/constants'

export interface PlayerFrequency {
  name: string
  number: number
  pos: string   // posición más frecuente
  starts: number
}

export interface CoachLineupResult {
  coach: string
  topFormation: string
  formationCounts: Array<{ formation: string; count: number }>
  predictedXI: PlayerFrequency[]
  bench: PlayerFrequency[]
  isLoading: boolean
  loadedCount: number
  totalCount: number
}

const POS_ORDER: Record<string, number> = {
  G: 0, GK: 0,                                       // Portero
  CB: 1, DC: 1,                                       // Central
  D: 1.5, LB: 1.5, RB: 1.5, LWB: 1.5, RWB: 1.5, WB: 1.5, // Lateral
  CDM: 2, DM: 2, DH: 2,                              // MC Defensivo
  M: 2.5, CM: 2.5, MF: 2.5,                          // Mediocampista
  CAM: 3, AM: 3, OM: 3,                              // MC Ofensivo
  LM: 3.5, RM: 3.5, LW: 3.5, RW: 3.5, WF: 3.5, AML: 3.5, AMR: 3.5, // Extremo
  F: 4, ST: 4, CF: 4, FW: 4, ATT: 4, SS: 4,         // Delantero
}

function posOrder(pos: string) {
  return POS_ORDER[pos.toUpperCase()] ?? 2
}

export function useCoachLineupHistory(last = 15): CoachLineupResult {
  const { data: fixtures } = useRecentFixtures(last)

  const finishedIds = (fixtures ?? [])
    .filter((f) => f.status === 'FT')
    .map((f) => f.id)

  const results = useQueries({
    queries: finishedIds.map((id) => ({
      queryKey: ['fixtureLineups', id],
      queryFn: () => getFixtureLineups(id),
      staleTime: CACHE_DURATION_MS,
      enabled: id > 0,
    })),
  })

  const totalCount = finishedIds.length
  const loadedCount = results.filter((r) => r.isSuccess).length
  const isLoading = results.some((r) => r.isLoading)

  // Aggregate
  const formationMap: Record<string, number> = {}
  const coachMap: Record<string, number> = {}
  const playerMap: Record<string, { name: string; number: number; posCounts: Record<string, number>; starts: number }> = {}

  for (const result of results) {
    if (!result.data) continue
    const milloLineup = result.data.find((l) => l.teamId === TEAM_MILLONARIOS)
    if (!milloLineup) continue

    // Formation
    const formation = milloLineup.formation
    if (formation && formation !== '—') {
      formationMap[formation] = (formationMap[formation] ?? 0) + 1
    }

    // Coach
    const coach = milloLineup.coach
    if (coach && coach !== '—') {
      coachMap[coach] = (coachMap[coach] ?? 0) + 1
    }

    // Players
    for (const p of milloLineup.startXI) {
      if (!p.name || p.name === '—') continue
      if (!playerMap[p.name]) {
        playerMap[p.name] = { name: p.name, number: p.number, posCounts: {}, starts: 0 }
      }
      playerMap[p.name].starts++
      if (p.pos) {
        playerMap[p.name].posCounts[p.pos] = (playerMap[p.name].posCounts[p.pos] ?? 0) + 1
      }
    }
  }

  // Top formation
  const formationCounts = Object.entries(formationMap)
    .map(([formation, count]) => ({ formation, count }))
    .sort((a, b) => b.count - a.count)
  const topFormation = formationCounts[0]?.formation ?? '—'

  // Top coach
  const coach = Object.entries(coachMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  // Players sorted by starts desc
  const allPlayers: PlayerFrequency[] = Object.values(playerMap)
    .map((p) => {
      const pos = Object.entries(p.posCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'M'
      return { name: p.name, number: p.number, pos, starts: p.starts }
    })
    .sort((a, b) => b.starts - a.starts)

  // predictedXI: top 11 sorted by field position
  const predictedXI = allPlayers
    .slice(0, 11)
    .sort((a, b) => posOrder(a.pos) - posOrder(b.pos))

  const bench = allPlayers.slice(11, 16)

  return { coach, topFormation, formationCounts, predictedXI, bench, isLoading, loadedCount, totalCount }
}
