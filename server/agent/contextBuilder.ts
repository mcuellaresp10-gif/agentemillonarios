import type { QuestionHints } from './questionAnalysis.js'

export interface MillonariosAgentContext {
  standings?: Array<{
    rank: number
    team: string
    points: number
    played: number
    form?: string
  }>
  nextFixture?: {
    date: string
    opponent: string
    venue?: string
    isHome: boolean
  }
  millPosition?: {
    rank: number
    points: number
    form?: string
    goalsFor?: number
    goalsAgainst?: number
  }
  squadSummary?: Array<{
    name: string
    position: string
    rating?: number | null
    goals: number
    assists: number
    minutes?: number
    nationality?: string
  }>
  recentResults?: Array<{
    date: string
    opponent: string
    score: string
    result: string
    isHome: boolean
  }>
  alerts?: Array<{ tipo: string; texto: string; detalle?: string }>
  topScoutCandidates?: Array<{
    name: string
    team: string
    position: string
    rating?: number | null
    league?: string
  }>
  simulation?: {
    top8Probability?: number
    expectedPoints?: number
  }
  matchSimulation?: {
    winPct: number
    drawPct: number
    lossPct: number
    expectedGoals: string
  }
  notes?: string
}

export function buildMillonariosContext(ctx: MillonariosAgentContext, hints: QuestionHints): string {
  const lines: string[] = ['=== ACTUALIDAD — TEMPORADA VIGENTE ===']

  if (ctx.millPosition) {
    lines.push(
      `Millonarios hoy: ${ctx.millPosition.rank}º · ${ctx.millPosition.points} pts` +
        (ctx.millPosition.form ? ` · Forma: ${ctx.millPosition.form}` : '') +
        (ctx.millPosition.goalsFor != null
          ? ` · GF ${ctx.millPosition.goalsFor} GC ${ctx.millPosition.goalsAgainst}`
          : ''),
    )
  }

  if (ctx.nextFixture) {
    const f = ctx.nextFixture
    lines.push(
      `Próximo partido: vs ${f.opponent} (${f.isHome ? 'local' : 'visitante'}) — ${f.date}` +
        (f.venue ? ` · ${f.venue}` : ''),
    )
  }

  if (ctx.matchSimulation && (hints.wantsNextMatch || hints.wantsTactics || hints.wantsGeneral)) {
    const m = ctx.matchSimulation
    lines.push(
      `Simulación Poisson próximo partido: V ${m.winPct}% E ${m.drawPct}% D ${m.lossPct}% · xG ${m.expectedGoals}`,
    )
  }

  if (ctx.simulation && (hints.wantsClassification || hints.wantsGeneral)) {
    lines.push(
      `Simulación temporada: P(clasificar top 8) ≈ ${ctx.simulation.top8Probability ?? '?'}% · Pts esperados ${ctx.simulation.expectedPoints ?? '?'}`,
    )
  }

  if (ctx.standings?.length) {
    lines.push('Tabla Liga BetPlay (extracto):')
    for (const row of ctx.standings.slice(0, 12)) {
      lines.push(
        `  ${row.rank}. ${row.team} — ${row.points} pts (${row.played} PJ)${row.form ? ` [${row.form}]` : ''}`,
      )
    }
  }

  if (
    ctx.recentResults?.length &&
    (hints.wantsRecentHistory || hints.wantsGeneral || hints.wantsClassification)
  ) {
    lines.push('Últimos partidos:')
    for (const r of ctx.recentResults.slice(0, 8)) {
      lines.push(
        `  ${r.date.slice(0, 10)} vs ${r.opponent} (${r.isHome ? 'L' : 'V'}): ${r.score} [${r.result}]`,
      )
    }
  }

  if (
    ctx.alerts?.length &&
    (hints.wantsRecentHistory || hints.wantsGeneral || hints.wantsClassification)
  ) {
    lines.push('Alertas de forma:')
    for (const a of ctx.alerts.slice(0, 5)) {
      lines.push(`  [${a.tipo}] ${a.texto}${a.detalle ? ` — ${a.detalle}` : ''}`)
    }
  }

  if (
    ctx.squadSummary?.length &&
    (hints.wantsSquad || hints.wantsScouting || hints.wantsComparison || hints.wantsGeneral)
  ) {
    lines.push('Plantilla actual (extracto):')
    for (const p of ctx.squadSummary.slice(0, 22)) {
      lines.push(
        `  ${p.name} (${p.position}) — ${p.goals}G ${p.assists}A` +
          (p.rating != null ? ` · ${p.rating.toFixed(1)} rating` : '') +
          (p.minutes != null ? ` · ${p.minutes}'` : '') +
          (p.nationality ? ` · ${p.nationality}` : ''),
      )
    }
  }

  if (ctx.topScoutCandidates?.length && hints.wantsScouting) {
    lines.push('Candidatos scouting (extracto):')
    for (const c of ctx.topScoutCandidates.slice(0, 12)) {
      lines.push(
        `  ${c.name} — ${c.team} (${c.position})` +
          (c.rating != null ? ` · ${c.rating.toFixed(1)}` : '') +
          (c.league ? ` · ${c.league}` : ''),
      )
    }
  }

  if (ctx.notes) lines.push(`Notas: ${ctx.notes}`)

  if (lines.length === 1) {
    lines.push('(Sin datos en vivo disponibles — responde con base de conocimiento histórica.)')
  }

  return lines.join('\n')
}
