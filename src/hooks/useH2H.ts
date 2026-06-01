import { useQuery } from '@tanstack/react-query'
import { getHeadToHead, getFixtures } from '@/services/apiFootball'
import { CACHE_DURATION_MS, H2H_FIXTURES_LAST } from '@/config/constants'

export function useH2H(opponentId: number, last = H2H_FIXTURES_LAST) {
  return useQuery({
    queryKey: ['h2h', opponentId, last],
    queryFn: () => getHeadToHead(opponentId, last),
    enabled: opponentId > 0,
    staleTime: CACHE_DURATION_MS,
  })
}

export function useOpponentsFromFixtures() {
  return useQuery({
    queryKey: ['opponents'],
    queryFn: async () => {
      const fixtures = await getFixtures({ season: 2026, last: 50 })
      const map = new Map<number, { id: number; name: string; logo: string }>()
      for (const f of fixtures) {
        map.set(f.opponent.id, f.opponent)
      }
      return Array.from(map.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      )
    },
    staleTime: CACHE_DURATION_MS,
  })
}
