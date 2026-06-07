import { useQueries } from '@tanstack/react-query'
import { getAllLeaguePlayers } from '@/services/snapshotStore'
import { SCOUT_LEAGUES } from '@/config/constants'
import { defaultSeasonKey } from '@/config/scoutSnapshotSeasons'
import { computeRankingBenchmarks, type RankingBenchmarks } from '@/utils/leagueRanking'
import type { PlayerSeasonStats } from '@/types'
import type { SeasonKey } from '@/types/scoutSnapshot'

const WEEK = 7 * 24 * 60 * 60 * 1000

export function useLeagueRanking(
  player: PlayerSeasonStats | null | undefined,
  seasonKey: SeasonKey = defaultSeasonKey(),
): {
  benchmarks: RankingBenchmarks | null
  isLoading: boolean
  poolSize: number
  colombiaPoolSize: number
} {
  const results = useQueries({
    queries: SCOUT_LEAGUES.map((league) => ({
      queryKey: ['leagueAllPlayers', league.id, seasonKey],
      queryFn: () => getAllLeaguePlayers(league.id, seasonKey),
      staleTime: WEEK,
      enabled: player != null,
    })),
  })

  const isLoading = results.some((r) => r.isLoading)
  const allPlayers = results.flatMap((r) => r.data ?? [])

  const benchmarks =
    !isLoading && player && allPlayers.length > 0
      ? computeRankingBenchmarks(player, allPlayers)
      : null

  return {
    benchmarks,
    isLoading,
    poolSize: benchmarks?.poolSize ?? 0,
    colombiaPoolSize: benchmarks?.colombiaPoolSize ?? 0,
  }
}
