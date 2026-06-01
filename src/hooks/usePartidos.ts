import { useQuery } from '@tanstack/react-query'
import {
  getFixtures,
  getNextFixture,
  getFixtureById,
  getFixtureEvents,
  getFixtureLineups,
} from '@/services/apiFootball'
import { COMPETITIONS, SEASON, type CompetitionKey } from '@/config/constants'
import { CACHE_DURATION_MS } from '@/config/constants'

const stale = CACHE_DURATION_MS

export function useNextFixture() {
  return useQuery({
    queryKey: ['nextFixture'],
    queryFn: getNextFixture,
    staleTime: stale,
  })
}

export function useRecentFixtures(last = 5) {
  return useQuery({
    queryKey: ['fixtures', 'last', last],
    queryFn: () => getFixtures({ last }),
    staleTime: stale,
  })
}

export function useFixturesByCompetition(competition: CompetitionKey) {
  const leagueId = COMPETITIONS[competition]?.id
  return useQuery({
    queryKey: ['fixtures', competition, SEASON],
    queryFn: () =>
      leagueId && leagueId > 0
        ? getFixtures({ league: leagueId, season: SEASON })
        : getFixtures({ season: SEASON }),
    staleTime: stale,
  })
}

export function useFixture(id: number) {
  return useQuery({
    queryKey: ['fixture', id],
    queryFn: () => getFixtureById(id),
    enabled: id > 0,
    staleTime: stale,
  })
}

export function useFixtureEvents(id: number) {
  return useQuery({
    queryKey: ['fixtureEvents', id],
    queryFn: () => getFixtureEvents(id),
    enabled: id > 0,
    staleTime: stale,
  })
}

export function useFixtureLineups(id: number) {
  return useQuery({
    queryKey: ['fixtureLineups', id],
    queryFn: () => getFixtureLineups(id),
    enabled: id > 0,
    staleTime: stale,
  })
}
