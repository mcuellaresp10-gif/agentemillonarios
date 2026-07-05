/** Base de conocimiento curada sobre Millonarios FC para el agente experto. */

export interface LigaSeasonRecord {
  torneo: string
  pts: number
  pos: number | null
  clasifico: boolean
}

export interface TitleRecord {
  name: string
  count: number
  years?: number[]
  note?: string
}

export interface LegendPlayer {
  name: string
  era: string
  role: string
  highlights: string
}

export interface RivalryRecord {
  rival: string
  derby?: string
  note: string
}

export const MILLONARIOS_IDENTITY = {
  fullName: 'Millonarios Fútbol Club',
  founded: '18 de junio de 1946',
  city: 'Bogotá, Colombia',
  stadium: 'Estadio El Campín (Nemesio Camacho El Azul)',
  capacity: '~36.000 espectadores',
  colors: 'Azul y blanco',
  nicknames: ['El Embajador', 'El Azul', 'El Equipo Más Grande', 'Los Embajadores'],
  motto: 'El club más laureado de Colombia',
  confederation: 'CONMEBOL',
  league: 'Liga BetPlay (Categoría Primera A)',
}

export const MILLONARIOS_TITLES: TitleRecord[] = [
  {
    name: 'Liga Colombiana (Primera A)',
    count: 16,
    note: 'Récord histórico de títulos en Colombia. Último campeonato destacado: Finalización 2023.',
  },
  {
    name: 'Copa Colombia',
    count: 3,
    years: [1962, 1963, 2011],
  },
  {
    name: 'Copa Merconorte',
    count: 1,
    years: [2001],
    note: 'Principal título continental del club (competición regional CONMEBOL).',
  },
  {
    name: 'Superliga de Colombia',
    count: 1,
    years: [2018],
  },
]

/** Hecho explícito para evitar alucinaciones sobre Libertadores. */
export const LIBERTADORES_FACT =
  'Millonarios NO ha ganado la Copa Libertadores en su historia. Participa cuando clasifica por liga, pero su único título continental reconocido en palmarés es la Copa Merconorte (2001).'

export const RECENT_LIGA_HISTORY: LigaSeasonRecord[] = [
  { torneo: '2023-1', pts: 38, pos: 2, clasifico: true },
  { torneo: '2023-2', pts: 30, pos: 7, clasifico: true },
  { torneo: '2024-1', pts: 31, pos: 6, clasifico: true },
  { torneo: '2024-2', pts: 35, pos: 3, clasifico: true },
  { torneo: '2025-1', pts: 31, pos: null, clasifico: true },
  { torneo: '2025-2', pts: 26, pos: null, clasifico: false },
  { torneo: '2026-1', pts: 26, pos: null, clasifico: false },
]

export const LEGENDARY_PLAYERS: LegendPlayer[] = [
  {
    name: 'Alfredo Di Stéfano',
    era: '1949',
    role: 'Delantero',
    highlights: 'Paso breve pero marcó el ADN ganador del club en sus inicios.',
  },
  {
    name: 'Arnoldo Iguarán',
    era: '1970s-1980s',
    role: 'Delantero',
    highlights: 'Máximo goleador histórico del club. Ídolo de las décadas 70 y 80.',
  },
  {
    name: 'Willington Ortiz',
    era: '1970s-1980s',
    role: 'Volante',
    highlights: 'Ídolo del mediocampo, referente de la era dorada del club.',
  },
  {
    name: 'Anthony de Ávila',
    era: '1980s-1990s',
    role: 'Delantero',
    highlights: 'Goleador clave en la década de 1980 y referente generacional.',
  },
  {
    name: 'Carlos Valderrama',
    era: '1980s',
    role: 'Volante',
    highlights: 'Debutó y brilló en Millonarios antes de consagrarse como leyenda mundial.',
  },
  {
    name: 'Iván Valenciano',
    era: '1990s',
    role: 'Delantero',
    highlights: 'Goleador histórico, referente de la década de 1990.',
  },
  {
    name: 'Adolpho Valencia',
    era: '1980s-1990s',
    role: 'Delantero',
    highlights: 'El Pollo Valencia, goleador y símbolo de la hinchada.',
  },
  {
    name: 'Miguel Borja',
    era: '2020s',
    role: 'Delantero',
    highlights: 'Goleador decisivo y referente reciente del ataque azul.',
  },
  {
    name: 'David Macías',
    era: '2020s',
    role: 'Defensa',
    highlights: 'Capitán y referente defensivo en la era reciente del club.',
  },
]

export const CLASSIC_RIVALRIES: RivalryRecord[] = [
  {
    rival: 'Independiente Santa Fe',
    derby: 'Clásico Capitalino',
    note: 'El derby más importante de Bogotá. Partido extra en el calendario (clásico). Alta intensidad histórica.',
  },
  {
    rival: 'Atlético Nacional',
    note: 'Rivalidad histórica a nivel nacional por protagonismo y títulos. Clásico del fútbol colombiano.',
  },
  {
    rival: 'América de Cali',
    note: 'Rivalidad tradicional por protagonismo histórico en Colombia.',
  },
  {
    rival: 'Deportivo Cali',
    note: 'Clásico de interés nacional entre dos de los clubes más grandes.',
  },
]

export const HISTORICAL_MILESTONES = [
  '1946: Fundación del club en Bogotá.',
  '1951: Primer título de liga (Campeonato Profesional).',
  '1962-1963: Bicampeonato de Copa Colombia.',
  '2001: Copa Merconorte — título continental regional.',
  '2011: Copa Colombia tras larga sequía.',
  '2018: Superliga de Colombia.',
  '2023: Campeón Finalización — título de liga más reciente.',
]

export const CULTURAL_NOTES = [
  'Millonarios es el club con más títulos de liga en Colombia.',
  'No ha ganado la Copa Libertadores; su título continental es la Copa Merconorte (2001).',
  'El Campín es su fortaleza histórica; jugar de local es factor clave en la identidad del club.',
  'El azul es el color distintivo; la frase "El Equipo Más Grande" resume la autoimagen institucional.',
  'El club ha formado y exportado jugadores a Europa y a la Selección Colombia durante décadas.',
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function searchMillonariosHistory(query: string): string[] {
  const q = normalize(query)
  if (!q) return []

  const blocks: string[] = []
  const haystack = [
    ...HISTORICAL_MILESTONES,
    ...LEGENDARY_PLAYERS.map((p) => `${p.name} ${p.highlights} ${p.era}`),
    ...CLASSIC_RIVALRIES.map((r) => `${r.rival} ${r.derby ?? ''} ${r.note}`),
    ...MILLONARIOS_TITLES.map((t) => `${t.name} ${t.note ?? ''} ${t.years?.join(' ')}`),
    ...CULTURAL_NOTES,
    LIBERTADORES_FACT,
    JSON.stringify(MILLONARIOS_IDENTITY),
  ].join(' ')

  const tokens = q.split(/\s+/).filter((t) => t.length >= 3)
  const matches = tokens.filter((t) => normalize(haystack).includes(t))

  if (
    matches.length > 0 ||
    /historia|idolo|leyenda|libertador|titulo|campeon|clasico|rival|fundacion|campin|embajador/.test(q)
  ) {
    if (/libertador|continental|cop[a]?\s*libertad/.test(q)) {
      blocks.push(formatLibertadoresSection())
    }
    if (/idolo|leyenda|jugador|goleador|valderrama|borja|iguaran|ortiz/.test(q)) {
      blocks.push(formatLegendsSection(query))
    }
    if (/clasico|rival|santa\s*fe|nacional|america|cali/.test(q)) {
      blocks.push(formatRivalriesSection(query))
    }
    if (/titulo|campeon|liga|cop[a]|trofeo|palmares/.test(q)) {
      blocks.push(formatTitlesSection())
    }
    if (/2023|2024|2025|2026|temporada|torneo|reciente|actualidad/.test(q)) {
      blocks.push(formatRecentHistorySection())
    }
    if (blocks.length === 0) {
      blocks.push(formatIdentitySection())
      blocks.push(formatMilestonesSection(5))
    }
  }

  return blocks
}

export function formatIdentitySection(): string {
  const i = MILLONARIOS_IDENTITY
  return [
    'IDENTIDAD DEL CLUB:',
    `${i.fullName} · Fundado ${i.founded}`,
    `Sede: ${i.city} · Estadio: ${i.stadium}`,
    `Colores: ${i.colors} · Apodos: ${i.nicknames.join(', ')}`,
    `Liga: ${i.league}`,
  ].join('\n')
}

export function formatLibertadoresSection(): string {
  return ['COPA LIBERTADORES:', `- ${LIBERTADORES_FACT}`].join('\n')
}

export function formatTitlesSection(): string {
  const lines = ['PALMARÉS (referencia histórica):']
  for (const t of MILLONARIOS_TITLES) {
    const years = t.years?.length ? ` (${t.years.join(', ')})` : ''
    lines.push(`- ${t.name}: ${t.count} título(s)${years}${t.note ? ` — ${t.note}` : ''}`)
  }
  return lines.join('\n')
}

export function formatLegendsSection(query?: string): string {
  const q = query ? normalize(query) : ''
  let players = LEGENDARY_PLAYERS
  if (q) {
    const filtered = players.filter(
      (p) =>
        normalize(p.name).includes(q) ||
        q.split(/\s+/).some((t) => t.length >= 4 && normalize(p.name).includes(t)),
    )
    if (filtered.length > 0) players = filtered
  }
  const lines = ['ÍDOLOS Y LEYENDAS:']
  for (const p of players.slice(0, 8)) {
    lines.push(`- ${p.name} (${p.era}, ${p.role}): ${p.highlights}`)
  }
  return lines.join('\n')
}

export function formatRivalriesSection(query?: string): string {
  const q = query ? normalize(query) : ''
  let rivals = CLASSIC_RIVALRIES
  if (q) {
    const filtered = rivals.filter(
      (r) => normalize(r.rival).includes(q) || q.includes(normalize(r.rival)),
    )
    if (filtered.length > 0) rivals = filtered
  }
  const lines = ['CLÁSICOS Y RIVALIDADES:']
  for (const r of rivals) {
    lines.push(`- vs ${r.rival}${r.derby ? ` (${r.derby})` : ''}: ${r.note}`)
  }
  return lines.join('\n')
}

export function formatRecentHistorySection(): string {
  const lines = ['HISTORIAL RECIENTE LIGA (torneos cortos):']
  for (const s of RECENT_LIGA_HISTORY) {
    lines.push(
      `- ${s.torneo}: ${s.pts} pts${s.pos != null ? `, ${s.pos}º` : ''} — ${s.clasifico ? 'clasificó a cuadrangulares' : 'NO clasificó'}`,
    )
  }
  lines.push(
    'Nota: 2025-2 y 2026-1 fueron torneos sin clasificación a fase final — contexto de exigencia actual.',
  )
  return lines.join('\n')
}

export function formatMilestonesSection(limit = 8): string {
  return ['HITOS HISTÓRICOS:', ...HISTORICAL_MILESTONES.slice(-limit).map((m) => `- ${m}`)].join('\n')
}

export function formatCultureSection(): string {
  return ['CULTURA E IDENTIDAD:', ...CULTURAL_NOTES.map((n) => `- ${n}`)].join('\n')
}

export function formatExpertKnowledgeBase(hints: {
  wantsHistory?: boolean
  wantsLegends?: boolean
  wantsRivalries?: boolean
  wantsTitles?: boolean
  wantsCulture?: boolean
  wantsRecentHistory?: boolean
  searchQuery?: string
}): string {
  const sections: string[] = []

  if (hints.searchQuery) {
    sections.push(...searchMillonariosHistory(hints.searchQuery))
  }

  if (hints.wantsHistory || hints.wantsCulture) {
    sections.push(formatIdentitySection())
    sections.push(formatMilestonesSection(6))
  }
  if (hints.wantsTitles) {
    sections.push(formatTitlesSection())
    sections.push(formatLibertadoresSection())
  }
  if (hints.wantsLegends) sections.push(formatLegendsSection(hints.searchQuery))
  if (hints.wantsRivalries) sections.push(formatRivalriesSection(hints.searchQuery))
  if (hints.wantsRecentHistory) sections.push(formatRecentHistorySection())
  if (hints.wantsCulture) sections.push(formatCultureSection())

  if (sections.length === 0) {
    sections.push(formatIdentitySection())
    sections.push(formatTitlesSection())
    sections.push(formatLibertadoresSection())
  }

  return [...new Set(sections)].join('\n\n')
}
