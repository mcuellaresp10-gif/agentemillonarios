import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Fixture, PlayerSeasonStats, StandingRow } from '@/types'
import { TEAM_MILLONARIOS, CACHE_DURATION_MS } from '@/config/constants'
import { getHeadToHead, getPlayersStatistics } from '@/services/apiFootball'
import { runScoreSimulation } from '@/utils/matchSimulation'
import { avgGoalsFromFixtures } from '@/utils/matchOutcomeEngine'
import { useRecentFixtures } from '@/hooks/usePartidos'

export function useMatchSimulation(
  fixture: Fixture | null | undefined,
  standings: StandingRow[],
  millPlayers: PlayerSeasonStats[] | undefined,
) {
  const opponentId = fixture?.opponent.id

  const h2h = useQuery({
    queryKey: ['h2h-match-sim', opponentId],
    queryFn: () => getHeadToHead(opponentId!, 15),
    enabled: !!opponentId,
    staleTime: CACHE_DURATION_MS,
  })

  const opponentPlayers = useQuery({
    queryKey: ['opp-players-sim', opponentId],
    queryFn: () => getPlayersStatistics(opponentId!),
    enabled: !!opponentId,
    staleTime: CACHE_DURATION_MS,
  })

  const recent = useRecentFixtures(30)

  return useMemo(() => {
    if (!fixture || !standings.length) return null

    const millStanding = standings.find((s) => s.team.id === TEAM_MILLONARIOS)
    const oppStanding = standings.find((s) => s.team.id === fixture.opponent.id)
    if (!millStanding || !oppStanding) return null

    const isPreSeason = millStanding.played < 3
    const avgGoals = avgGoalsFromFixtures(recent.data ?? [])

    const homeId = fixture.isMillonariosHome ? TEAM_MILLONARIOS : fixture.opponent.id
    const awayId = fixture.isMillonariosHome ? fixture.opponent.id : TEAM_MILLONARIOS
    const homeStanding = fixture.isMillonariosHome ? millStanding : oppStanding
    const awayStanding = fixture.isMillonariosHome ? oppStanding : millStanding
    const homePlayers = fixture.isMillonariosHome ? (millPlayers ?? []) : (opponentPlayers.data ?? [])
    const awayPlayers = fixture.isMillonariosHome ? (opponentPlayers.data ?? []) : (millPlayers ?? [])

    const result = runScoreSimulation({
      teamAId: homeId,
      teamBId: awayId,
      teamAName: homeStanding.team.name,
      teamBName: awayStanding.team.name,
      standingA: homeStanding,
      standingB: awayStanding,
      h2h: h2h.data ?? [],
      playersA: homePlayers,
      playersB: awayPlayers,
      avgGoalsPerMatch: avgGoals,
      isPreSeason,
      simulations: 4000,
    })

    const millWin = fixture.isMillonariosHome ? result.outcomeProbs.winA : result.outcomeProbs.winB
    const millDraw = result.outcomeProbs.draw
    const millLoss = fixture.isMillonariosHome ? result.outcomeProbs.winB : result.outcomeProbs.winA

    return { ...result, millWin, millDraw, millLoss, isMillonariosHome: fixture.isMillonariosHome }
  }, [fixture, standings, millPlayers, h2h.data, opponentPlayers.data, recent.data])
}

export type MatchSimulationResult = NonNullable<ReturnType<typeof useMatchSimulation>>
