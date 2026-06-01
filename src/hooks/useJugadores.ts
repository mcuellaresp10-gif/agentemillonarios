import { useQuery } from '@tanstack/react-query'
import { getPlayersStatistics } from '@/services/apiFootball'
import { TEAM_MILLONARIOS, SEASON, CACHE_DURATION_MS } from '@/config/constants'

export function useMillonariosPlayers() {
  return useQuery({
    queryKey: ['players', TEAM_MILLONARIOS, SEASON],
    queryFn: () => getPlayersStatistics(TEAM_MILLONARIOS, SEASON),
    staleTime: CACHE_DURATION_MS,
  })
}
