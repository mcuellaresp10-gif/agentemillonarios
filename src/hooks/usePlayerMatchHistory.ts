import { useQuery } from '@tanstack/react-query'
import { getFixtures, getFixturePlayers } from '@/services/apiFootball'
import { TEAM_MILLONARIOS, CACHE_DURATION_MS } from '@/config/constants'
import type { PlayerMatchRating } from '@/types'

const LAST_FIXTURES = 12

export function usePlayerMatchHistory(playerId: number, teamId = TEAM_MILLONARIOS) {
  return useQuery({
    queryKey: ['playerHistory', playerId, teamId],
    queryFn: async (): Promise<PlayerMatchRating[]> => {
      const fixtures = await getFixtures({ team: teamId, last: LAST_FIXTURES })
      const finished = fixtures.filter((f) => f.status === 'FT')

      const rows: PlayerMatchRating[] = []

      await Promise.all(
        finished.map(async (f) => {
          try {
            const data = await getFixturePlayers(f.id, teamId)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const block = (data.response as any[])?.[0]
            const players = block?.players ?? []
            const entry = players.find(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (p: any) => p.player?.id === playerId,
            )
            if (!entry) return
            const games = entry.statistics?.[0]?.games ?? {}
            rows.push({
              fixtureId: f.id,
              date: f.date,
              opponent: f.opponent.name,
              rating: games.rating ? parseFloat(String(games.rating)) : null,
              minutes: games.minutes ?? 0,
              position: games.position ?? '—',
            })
          } catch {
            /* sin datos en este partido */
          }
        }),
      )

      return rows.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
    },
    enabled: playerId > 0,
    staleTime: CACHE_DURATION_MS,
  })
}
