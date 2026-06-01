import { useQuery } from '@tanstack/react-query'
import { getPlayerTransfers } from '@/services/apiFootball'
import { CACHE_DURATION_MS } from '@/config/constants'

export function usePlayerTransfers(playerId: number, enabled = true) {
  return useQuery({
    queryKey: ['playerTransfers', playerId],
    queryFn: () => getPlayerTransfers(playerId),
    enabled: enabled && playerId > 0,
    staleTime: CACHE_DURATION_MS,
  })
}
