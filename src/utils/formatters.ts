import { format, formatInTimeZone } from 'date-fns-tz'
import { es } from 'date-fns/locale'
import { TIMEZONE } from '@/config/constants'
import type { Fixture } from '@/types'

export function formatFixtureDate(iso: string, pattern = "EEE d MMM · HH:mm") {
  return formatInTimeZone(new Date(iso), TIMEZONE, pattern, { locale: es })
}

export function formatShortDate(iso: string) {
  return formatInTimeZone(new Date(iso), TIMEZONE, 'd MMM yyyy', { locale: es })
}

export function formatScore(fixture: Fixture): string {
  const h = fixture.goalsHome ?? '-'
  const a = fixture.goalsAway ?? '-'
  return `${h} - ${a}`
}

export function formatMillonariosScore(fixture: Fixture): string {
  const m = fixture.millonariosGoals ?? '-'
  const o = fixture.opponentGoals ?? '-'
  return `${m} - ${o}`
}

export function resultLabel(result?: 'W' | 'D' | 'L'): string {
  if (result === 'W') return 'V'
  if (result === 'D') return 'E'
  if (result === 'L') return 'D'
  return '—'
}

export function positionLabel(pos: string): string {
  const map: Record<string, string> = {
    G: 'Portero',
    D: 'Defensa',
    M: 'Mediocampista',
    F: 'Delantero',
    Goalkeeper: 'Portero',
    Defender: 'Defensa',
    Midfielder: 'Mediocampista',
    Attacker: 'Delantero',
  }
  return map[pos] ?? pos
}

export function monthKey(iso: string): string {
  return format(new Date(iso), 'yyyy-MM')
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  return format(date, 'MMMM yyyy', { locale: es })
}
