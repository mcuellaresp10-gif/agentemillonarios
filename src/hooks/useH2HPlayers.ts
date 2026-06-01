import { useQuery } from '@tanstack/react-query'
import { fetchH2HPlayerStats } from '@/services/h2hPlayerStats'
import type { Fixture } from '@/types'
import { CACHE_DURATION_MS } from '@/config/constants'

export function useH2HPlayerStats(
  opponentId: number,
  fixtures: Fixture[] | undefined,
) {
  const ids = (fixtures ?? []).map((f) => f.id).join(',')

  return useQuery({
    queryKey: ['h2hPlayers', opponentId, ids],
    queryFn: () => fetchH2HPlayerStats(fixtures!),
    enabled: opponentId > 0 && (fixtures?.length ?? 0) > 0,
    staleTime: CACHE_DURATION_MS,
  })
}
