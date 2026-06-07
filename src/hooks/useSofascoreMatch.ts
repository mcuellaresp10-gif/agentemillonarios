import { useQuery } from '@tanstack/react-query'

export interface GoalActionStep {
  player: string
  eventType: 'interception' | 'pass' | 'cross' | 'goal' | string
  isAssist?: boolean
  from: { x: number; y: number }
  to?: { x: number; y: number }
}

export interface GoalAction {
  player: string
  time: number
  bodyPart?: string
  actions: GoalActionStep[]
  goalMouth?: { x: number; y: number }
}

export interface SofascoreMatchData {
  goals: GoalAction[]
}

export function useSofascoreMatch(fixtureId: number, status: string) {
  return useQuery<SofascoreMatchData>({
    queryKey: ['sofascore', fixtureId],
    queryFn: async () => {
      const res = await fetch(`/api/sofascore/match?fixtureId=${fixtureId}`)
      if (!res.ok) return { goals: [], _debug: 'http_error' } as SofascoreMatchData
      return res.json()
    },
    enabled: fixtureId > 0 && status === 'FT',
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  })
}

export async function linkSofascoreMatch(fixtureId: number, url: string): Promise<boolean> {
  try {
    const res = await fetch('/api/sofascore/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fixtureId: String(fixtureId), url }),
    })
    return res.ok
  } catch {
    return false
  }
}
