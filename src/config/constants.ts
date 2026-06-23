import { readEnv, readEnvNumber } from '@/config/env'

export const TEAM_MILLONARIOS = readEnvNumber('VITE_TEAM_ID', 1125)
/** Partidos H2H a cargar (×2 requests/partido para goles+alineaciones ≈ 40 req/rival) */
export const H2H_FIXTURES_LAST = 20
export const SEASON = readEnvNumber('VITE_DEFAULT_SEASON', 2026)
export const TIMEZONE = readEnv('VITE_TIMEZONE', 'America/Bogota')

export const LEAGUE_LIGA = 239
export const LEAGUE_COLOMBIA_B = 240
export const LEAGUE_ECUADOR = 242
export const LEAGUE_PERU = 281
export const LEAGUE_ARGENTINA = 128
export const LEAGUE_BRAZIL = 71
export const LEAGUE_CHILE = 265
export const LEAGUE_BOLIVIA = 344
export const LEAGUE_PARAGUAY = 250
export const LEAGUE_URUGUAY = 268
export const LEAGUE_VENEZUELA = 299
export const LEAGUE_MEXICO = 262
export const LEAGUE_LIBERTADORES = 13
export const LEAGUE_SUDAMERICANA = 11
export const LEAGUE_COPA_COLOMBIA = 712

/** Ligas disponibles en Scouting (refuerzos y reemplazos): Sudamérica + Liga MX */
export const SCOUT_LEAGUES = [
  { id: LEAGUE_LIGA, label: 'Colombia — Liga BetPlay', short: 'COL A' },
  { id: LEAGUE_COLOMBIA_B, label: 'Colombia — Segunda división', short: 'COL B' },
  { id: LEAGUE_ARGENTINA, label: 'Argentina — Liga Profesional', short: 'ARG' },
  { id: LEAGUE_BOLIVIA, label: 'Bolivia — División Profesional', short: 'BOL' },
  { id: LEAGUE_BRAZIL, label: 'Brasil — Serie A', short: 'BRA' },
  { id: LEAGUE_CHILE, label: 'Chile — Primera División', short: 'CHI' },
  { id: LEAGUE_ECUADOR, label: 'Ecuador — Liga Pro', short: 'ECU' },
  { id: LEAGUE_MEXICO, label: 'México — Liga MX', short: 'MEX' },
  { id: LEAGUE_PARAGUAY, label: 'Paraguay — Primera División', short: 'PAR' },
  { id: LEAGUE_PERU, label: 'Perú — Liga 1', short: 'PER' },
  { id: LEAGUE_URUGUAY, label: 'Uruguay — Primera División', short: 'URU' },
  { id: LEAGUE_VENEZUELA, label: 'Venezuela — Primera División', short: 'VEN' },
] as const

export type ScoutLeagueConfig = {
  id: number
  label: string
  short: string
}

export type ScoutLeagueId = (typeof SCOUT_LEAGUES)[number]['id']

/** Ligas fuera de Colombia donde suelen jugar colombianos en el exterior */
export const COLOMBIANOS_EXTERIOR_LEAGUES: ScoutLeagueConfig[] = [
  { id: 39, label: 'Inglaterra — Premier League', short: 'ENG' },
  { id: 140, label: 'España — La Liga', short: 'ESP' },
  { id: 135, label: 'Italia — Serie A', short: 'ITA' },
  { id: 78, label: 'Alemania — Bundesliga', short: 'GER' },
  { id: 61, label: 'Francia — Ligue 1', short: 'FRA' },
  { id: 88, label: 'Países Bajos — Eredivisie', short: 'NED' },
  { id: 94, label: 'Portugal — Primeira Liga', short: 'POR' },
  { id: 71, label: 'Brasil — Serie A', short: 'BRA' },
  { id: 128, label: 'Argentina — Liga Profesional', short: 'ARG' },
  { id: 265, label: 'Chile — Primera División', short: 'CHI' },
  { id: 262, label: 'México — Liga MX', short: 'MEX' },
  { id: 253, label: 'Estados Unidos — MLS', short: 'MLS' },
  { id: 268, label: 'Uruguay — Primera División', short: 'URU' },
  { id: 250, label: 'Paraguay — Primera División', short: 'PAR' },
  { id: 242, label: 'Ecuador — Liga Pro', short: 'ECU' },
  { id: 281, label: 'Perú — Liga 1', short: 'PER' },
  { id: 307, label: 'Arabia Saudita — Pro League', short: 'KSA' },
  { id: 203, label: 'Turquía — Süper Lig', short: 'TUR' },
  { id: 235, label: 'Rusia — Premier League', short: 'RUS' },
]

export const COMPETITIONS = {
  all: { id: 0, label: 'Todas las competiciones' },
  liga: { id: LEAGUE_LIGA, label: 'Liga BetPlay' },
  copa: { id: LEAGUE_COPA_COLOMBIA, label: 'Copa Colombia' },
  libertadores: { id: LEAGUE_LIBERTADORES, label: 'Copa Libertadores' },
  sudamericana: { id: LEAGUE_SUDAMERICANA, label: 'Copa Sudamericana' },
} as const

export type CompetitionKey = keyof typeof COMPETITIONS

export const COLORS = {
  millonariosBlue: '#1E3A8A',
  white: '#FFFFFF',
  gold: '#FCD116',
  gray: '#64748B',
  green: '#10B981',
  red: '#EF4444',
  yellow: '#F59E0B',
  muted: '#9CA3AF',
  sidebar: '#0F172A',
} as const

export const CACHE_DURATION_MS =
  readEnvNumber('VITE_CACHE_DURATION', 14400000)

export const SCOUT_POSITIONS = [
  'Portero',
  'Lateral D',
  'Lateral I',
  'Central D',
  'Central I',
  'Mediocampista Defensivo',
  'Mediocampista Centro',
  'Mediocampista Ofensivo',
  'Extremo D',
  'Extremo I',
  'Delantero',
] as const

export const PLAYER_POSITIONS = [
  'Portero',
  'Defensa',
  'Mediocampista',
  'Delantero',
] as const
