import type { Fixture, StandingRow } from '@/types'
import { TEAM_MILLONARIOS } from '@/config/constants'

export interface Alerta {
  tipo: 'positivo' | 'negativo' | 'neutro'
  emoji: string
  texto: string
  detalle?: string
}

/** Cuenta partidos consecutivos desde el inicio del array (más reciente primero) mientras se cumple la condición. */
function streak(fixtures: Fixture[], fn: (f: Fixture) => boolean): number {
  let count = 0
  for (const f of fixtures) {
    if (!fn(f)) break
    count++
  }
  return count
}

/** Solo considera partidos con resultado conocido (FT). */
function finished(f: Fixture): boolean {
  return f.result === 'W' || f.result === 'D' || f.result === 'L'
}

export function computeAlerts(
  fixtures: Fixture[],
  milloRow?: StandingRow,
): Alerta[] {
  const played = fixtures.filter(finished)
  const alertas: Alerta[] = []

  if (played.length > 0) {
    // --- Victorias consecutivas ---
    const winStreak = streak(played, (f) => f.result === 'W')
    if (winStreak >= 3) {
      alertas.push({
        tipo: 'positivo',
        emoji: '🔥',
        texto: `${winStreak} victorias seguidas`,
        detalle: `Millonarios lleva ${winStreak} partidos ganando consecutivamente`,
      })
    }

    // --- Sin ganar ---
    const winlessStreak = streak(played, (f) => f.result !== 'W')
    if (winlessStreak >= 3) {
      alertas.push({
        tipo: 'negativo',
        emoji: '⚠️',
        texto: `${winlessStreak} partidos sin ganar`,
        detalle: `Millonarios no gana desde hace ${winlessStreak} partidos`,
      })
    }

    // --- Victorias en casa consecutivas ---
    const homeFixtures = played.filter((f) => f.isMillonariosHome)
    const homeWinStreak = streak(homeFixtures, (f) => f.result === 'W')
    if (homeWinStreak >= 3) {
      alertas.push({
        tipo: 'positivo',
        emoji: '🏠',
        texto: `${homeWinStreak} victorias seguidas de local`,
        detalle: `Millonarios lleva ${homeWinStreak} partidos ganando en casa`,
      })
    }

    // --- Sin ganar de visitante ---
    const awayFixtures = played.filter((f) => !f.isMillonariosHome)
    const awayWinlessStreak = streak(awayFixtures, (f) => f.result !== 'W')
    if (awayWinlessStreak >= 3) {
      alertas.push({
        tipo: 'negativo',
        emoji: '✈️',
        texto: `${awayWinlessStreak} partidos sin ganar de visitante`,
        detalle: `Millonarios no gana fuera de casa desde hace ${awayWinlessStreak} partidos`,
      })
    }

    // --- Racha marcando gol ---
    const scoringStreak = streak(played, (f) => (f.millonariosGoals ?? 0) > 0)
    if (scoringStreak >= 5) {
      alertas.push({
        tipo: 'positivo',
        emoji: '⚽',
        texto: `Marcó en los últimos ${scoringStreak} partidos`,
        detalle: `Millonarios ha anotado al menos un gol en sus últimos ${scoringStreak} partidos`,
      })
    }

    // --- Sin marcar ---
    const scorelessStreak = streak(played, (f) => (f.millonariosGoals ?? 0) === 0)
    if (scorelessStreak >= 2) {
      alertas.push({
        tipo: 'negativo',
        emoji: '🔇',
        texto: `${scorelessStreak} partidos sin marcar`,
        detalle: `Millonarios lleva ${scorelessStreak} partidos consecutivos sin anotar`,
      })
    }

    // --- Recibiendo gol en todos ---
    const concedingStreak = streak(played, (f) => (f.opponentGoals ?? 0) > 0)
    if (concedingStreak >= 5) {
      alertas.push({
        tipo: 'negativo',
        emoji: '🔻',
        texto: `Recibió gol en los últimos ${concedingStreak} partidos`,
        detalle: `La defensa de Millonarios ha encajado gol en ${concedingStreak} partidos seguidos`,
      })
    }

    // --- Portería en cero (clean sheets) ---
    const cleanStreak = streak(played, (f) => (f.opponentGoals ?? 1) === 0)
    if (cleanStreak >= 3) {
      alertas.push({
        tipo: 'positivo',
        emoji: '🛡️',
        texto: `${cleanStreak} partidos sin recibir goles`,
        detalle: `Millonarios lleva ${cleanStreak} partidos consecutivos sin encajar`,
      })
    }
  }

  // --- Posición en tabla ---
  if (milloRow) {
    const { rank, points, played: pj } = milloRow
    if (rank != null && pj > 0) {
      const enTop8 = rank <= 8
      alertas.push({
        tipo: enTop8 ? 'positivo' : 'negativo',
        emoji: enTop8 ? '📈' : '📉',
        texto: enTop8
          ? `Puesto ${rank} · ${points} pts`
          : `Puesto ${rank} — fuera del top 8`,
        detalle: enTop8
          ? `Millonarios está clasificando actualmente (puesto ${rank}, ${points} puntos)`
          : `Millonarios está fuera de los 8 clasificatorios (puesto ${rank}, ${points} puntos)`,
      })
    }
  }

  // Negativas primero, luego positivas
  return [
    ...alertas.filter((a) => a.tipo === 'negativo'),
    ...alertas.filter((a) => a.tipo === 'positivo'),
    ...alertas.filter((a) => a.tipo === 'neutro'),
  ]
}

/** Encuentra la fila de Millonarios en el array de standings (deduplicado). */
export function findMilloRow(standings: StandingRow[]): StandingRow | undefined {
  return standings.find((r) => r.team.id === TEAM_MILLONARIOS)
}
