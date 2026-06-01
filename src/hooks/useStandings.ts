import { useQuery } from '@tanstack/react-query'
import { getStandings } from '@/services/apiFootball'
import { LEAGUE_LIGA, LEAGUE_LIBERTADORES, LEAGUE_SUDAMERICANA, SEASON, CACHE_DURATION_MS } from '@/config/constants'

export function useStandings(leagueId: number = LEAGUE_LIGA) {
  return useQuery({
    queryKey: ['standings', leagueId, SEASON],
    queryFn: () => getStandings(leagueId, SEASON),
    staleTime: CACHE_DURATION_MS,
    enabled: leagueId > 0,
  })
}

export function useLigaStandings() {
  return useStandings(LEAGUE_LIGA)
}

export function useLibertadoresStandings() {
  return useStandings(LEAGUE_LIBERTADORES)
}

export function useSudamericanaStandings() {
  return useStandings(LEAGUE_SUDAMERICANA)
}
