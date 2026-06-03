import type { PlayerSeasonStats, ScoutTeam } from '@/types'

export type SeasonKey = '2024-2025' | '2025-2026'

export const SEASON_KEYS: SeasonKey[] = ['2024-2025', '2025-2026']

export interface ScoutLeagueSnapshot {
  version: 1
  leagueId: number
  label: string
  seasonKey: SeasonKey
  apiSeason: number
  generatedAt: string
  teams: ScoutTeam[]
  players: PlayerSeasonStats[]
}

export interface MillonariosSnapshot {
  version: 1
  seasonKey: SeasonKey
  apiSeason: number
  generatedAt: string
  players: PlayerSeasonStats[]
}

export interface ScoutSnapshotManifestLeague {
  leagueId: number
  label: string
  short: string
  seasonKey: SeasonKey
  apiSeason: number
  path: string
  teamCount: number
  playerCount: number
}

export interface ScoutSnapshotManifestMillonarios {
  seasonKey: SeasonKey
  apiSeason: number
  path: string
  playerCount: number
}

export interface ScoutSnapshotManifest {
  version: 1
  generatedAt: string
  seasonKeys: SeasonKey[]
  leagues: ScoutSnapshotManifestLeague[]
  millonarios: ScoutSnapshotManifestMillonarios[]
}
