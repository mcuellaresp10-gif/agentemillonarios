import { useQuery } from '@tanstack/react-query'
import { getTeamStatistics } from '@/services/apiFootball'
import { TEAM_MILLONARIOS, LEAGUE_LIGA, SEASON, CACHE_DURATION_MS } from '@/config/constants'

export function useTeamSeasonStats(league = LEAGUE_LIGA) {
  return useQuery({
    queryKey: ['teamStats', TEAM_MILLONARIOS, league, SEASON],
    queryFn: () => getTeamStatistics(TEAM_MILLONARIOS, league, SEASON),
    staleTime: CACHE_DURATION_MS,
  })
}
