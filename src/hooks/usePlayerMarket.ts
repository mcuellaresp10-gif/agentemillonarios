import { useQuery } from '@tanstack/react-query'
import { fetchPlayerMarketValue } from '@/services/playerMarket'
import type { ScoutCandidate } from '@/types'

const WEEK = 7 * 24 * 60 * 60 * 1000

export function usePlayerMarketValue(
  player: Pick<
    ScoutCandidate,
    'playerId' | 'name' | 'teamName' | 'age' | 'nationality' | 'position'
  > | null,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      'playerMarket',
      player?.playerId,
      player?.name,
      player?.teamName,
    ],
    queryFn: () =>
      fetchPlayerMarketValue({
        playerId: player!.playerId,
        name: player!.name,
        teamName: player!.teamName,
        age: player!.age,
        nationality: player!.nationality,
        position: player!.position,
      }),
    enabled: enabled && !!player && player.playerId > 0,
    staleTime: WEEK,
  })
}
