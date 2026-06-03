import { useQuery } from '@tanstack/react-query'
import { getPlayersStatistics } from '@/services/apiFootball'
import { TEAM_MILLONARIOS } from '@/config/constants'
import {
  defaultSeasonKey,
  getApiSeason,
} from '@/config/scoutSnapshotSeasons'
import { resolveMillonariosPlayers } from '@/services/scoutCatalogResolver'
import type { SeasonKey } from '@/types/scoutSnapshot'

const WEEK = 7 * 24 * 60 * 60 * 1000

export function useMillonariosPlayers(seasonKey: SeasonKey = defaultSeasonKey()) {
  return useQuery({
    queryKey: ['players', TEAM_MILLONARIOS, seasonKey],
    queryFn: () =>
      resolveMillonariosPlayers(seasonKey, () => {
        const apiSeason = getApiSeason(239, seasonKey)
        return getPlayersStatistics(TEAM_MILLONARIOS, apiSeason)
      }),
    staleTime: WEEK,
  })
}
