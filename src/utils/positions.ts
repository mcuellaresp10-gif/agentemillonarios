/** Zonas del campo (viewBox 0–100 × 0–140) para mapa tipo heatmap */
export const PITCH_ZONES = [
  { id: 'gk', label: 'Portería', x: 38, y: 118, w: 24, h: 18 },
  { id: 'lb', label: 'Lateral izq.', x: 8, y: 88, w: 22, h: 28 },
  { id: 'cb_l', label: 'Central izq.', x: 28, y: 92, w: 20, h: 26 },
  { id: 'cb_r', label: 'Central der.', x: 52, y: 92, w: 20, h: 26 },
  { id: 'rb', label: 'Lateral der.', x: 70, y: 88, w: 22, h: 28 },
  { id: 'dm', label: 'Medio def.', x: 32, y: 68, w: 36, h: 18 },
  { id: 'cm_l', label: 'Medio izq.', x: 12, y: 52, w: 24, h: 22 },
  { id: 'cm_c', label: 'Medio centro', x: 38, y: 50, w: 24, h: 24 },
  { id: 'cm_r', label: 'Medio der.', x: 64, y: 52, w: 24, h: 22 },
  { id: 'am', label: 'Medio of.', x: 32, y: 32, w: 36, h: 18 },
  { id: 'lw', label: 'Extremo izq.', x: 8, y: 22, w: 22, h: 24 },
  { id: 'st', label: 'Delantero', x: 38, y: 8, w: 24, h: 22 },
  { id: 'rw', label: 'Extremo der.', x: 70, y: 22, w: 22, h: 24 },
] as const

export type PitchZoneId = (typeof PITCH_ZONES)[number]['id']

const POSITION_TO_ZONES: Record<string, PitchZoneId[]> = {
  Portero: ['gk'],
  Goalkeeper: ['gk'],
  G: ['gk'],
  'Lateral D': ['rb'],
  'Lateral I': ['lb'],
  'Lateral Derecho': ['rb'],
  'Lateral Izquierdo': ['lb'],
  'Central D': ['cb_r'],
  'Central I': ['cb_l'],
  'Central Derecho': ['cb_r'],
  'Central Izquierdo': ['cb_l'],
  'Mediocampista Defensivo': ['dm'],
  'Mediocampista Centro': ['cm_c'],
  'Mediocampista Ofensivo': ['am'],
  'Extremo D': ['rw'],
  'Extremo I': ['lw'],
  Delantero: ['st'],
  Attacker: ['st', 'am'],
  Midfielder: ['cm_c', 'cm_l', 'cm_r', 'am'],
  Defender: ['cb_l', 'cb_r', 'lb', 'rb'],
  D: ['cb_l', 'cb_r'],
  M: ['cm_c', 'am'],
  F: ['st'],
  DF: ['cb_l', 'cb_r'],
  MF: ['cm_c'],
  FW: ['st'],
}

export const POSICIONES_FILTRO = [
  { value: 'all', label: 'Todas las posiciones' },
  { value: 'Portero', label: 'Portero' },
  { value: 'Defensa', label: 'Defensa' },
  { value: 'Mediocampista', label: 'Mediocampista' },
  { value: 'Delantero', label: 'Delantero' },
  { value: 'Lateral D', label: 'Lateral derecho' },
  { value: 'Lateral I', label: 'Lateral izquierdo' },
  { value: 'Central', label: 'Central' },
  { value: 'Mediocampista Defensivo', label: 'Mediocampista defensivo' },
  { value: 'Mediocampista Ofensivo', label: 'Mediocampista ofensivo' },
  { value: 'Extremo', label: 'Extremo' },
] as const

export const ORDENAR_LABELS: Record<string, string> = {
  ratingAvg: 'Rating',
  goals: 'Goles',
  assists: 'Asistencias',
  minutes: 'Minutos',
  age: 'Edad',
  xG90: 'xG/90',
  keyPasses: 'Pases clave',
  duelsWonPct: '% Duelos',
  shotsOn: 'Tiros a puerta',
  fitScore: 'Afinidad',
  tackles: 'Entradas',
  passAccuracy: '% Pases',
  interceptions: 'Intercepciones',
  marketValueEur: 'Valor mercado',
}

/** Código G/D/M/F para perfiles de scouting. */
export function positionToCode(pos: string): 'G' | 'D' | 'M' | 'F' {
  const p = pos.toLowerCase()
  if (p.includes('goal') || p.includes('porter') || p === 'g' || p === 'gk') return 'G'
  if (
    p.includes('def') ||
    p === 'd' ||
    p.includes('lateral') ||
    p.includes('central') ||
    p.includes('back')
  )
    return 'D'
  if (
    p.includes('att') ||
    p === 'f' ||
    p.includes('delant') ||
    p.includes('strik') ||
    p.includes('forward') ||
    p.includes('extremo')
  )
    return 'F'
  return 'M'
}

export function posicionEnEspanol(pos: string): string {
  const map: Record<string, string> = {
    // Portero
    G: 'Portero', GK: 'Portero', Goalkeeper: 'Portero',
    // Central
    CB: 'Central', DC: 'Central',
    // Lateral
    LB: 'Lateral', RB: 'Lateral', LWB: 'Lateral', RWB: 'Lateral', WB: 'Lateral',
    // Defensa genérico (cuando la API solo dice "D")
    D: 'Defensa', Defender: 'Defensa',
    // MC Defensivo
    CDM: 'MC Defensivo', DM: 'MC Defensivo', DH: 'MC Defensivo',
    // MC Ofensivo / "10"
    CAM: 'MC Ofensivo', AM: 'MC Ofensivo', OM: 'MC Ofensivo',
    // Extremo
    LW: 'Extremo', RW: 'Extremo', WF: 'Extremo',
    AML: 'Extremo', AMR: 'Extremo', LM: 'Extremo', RM: 'Extremo',
    // Mediocampista central (genérico)
    M: 'Mediocampista', CM: 'Mediocampista', MF: 'Mediocampista', Midfielder: 'Mediocampista',
    // Delantero
    ST: 'Delantero', CF: 'Delantero', FW: 'Delantero',
    ATT: 'Delantero', SS: 'Delantero',
    F: 'Delantero', Attacker: 'Delantero',
  }
  return map[pos] ?? pos
}

export function zonasDesdePosiciones(positions: string[]): Map<PitchZoneId, number> {
  const weights = new Map<PitchZoneId, number>()
  for (const raw of positions) {
    const key = raw.trim()
    const zones =
      POSITION_TO_ZONES[key] ??
      POSITION_TO_ZONES[posicionEnEspanol(key)] ??
      inferZones(key)
    for (const z of zones) {
      weights.set(z, (weights.get(z) ?? 0) + 1)
    }
  }
  return weights
}

function inferZones(pos: string): PitchZoneId[] {
  const p = pos.toLowerCase()
  if (p.includes('goal') || p.includes('porter')) return ['gk']
  if (p.includes('left') && p.includes('back')) return ['lb']
  if (p.includes('right') && p.includes('back')) return ['rb']
  if (p.includes('lateral') && p.includes('i')) return ['lb']
  if (p.includes('lateral') && p.includes('d')) return ['rb']
  if (p.includes('centre') && p.includes('back')) return ['cb_l', 'cb_r']
  if (p.includes('central')) return ['cb_l', 'cb_r']
  if (p.includes('defens') && p.includes('mid')) return ['dm']
  if (p.includes('offens') && p.includes('mid')) return ['am']
  if (p.includes('mid')) return ['cm_c']
  if (p.includes('wing') && p.includes('left')) return ['lw']
  if (p.includes('wing') && p.includes('right')) return ['rw']
  if (p.includes('extremo') && p.includes('i')) return ['lw']
  if (p.includes('extremo') && p.includes('d')) return ['rw']
  if (p.includes('strik') || p.includes('delant') || p.includes('forward'))
    return ['st']
  if (p.includes('attack')) return ['st', 'am']
  if (p.includes('defen')) return ['cb_l', 'cb_r']
  return ['cm_c']
}

export function matchesPositionFilter(
  playerPos: string,
  filter: string | undefined,
): boolean {
  if (!filter || filter === 'all') return true
  const p = playerPos.toLowerCase()
  const f = filter.toLowerCase()
  if (f === 'defensa') return p.includes('def') || p === 'd' || p.includes('lateral') || p.includes('central')
  if (f === 'mediocampista') return p.includes('mid') || p === 'm' || p.includes('medio')
  if (f === 'delantero') return p.includes('att') || p === 'f' || p.includes('delant') || p.includes('extremo')
  if (f === 'portero') return p.includes('goal') || p === 'g' || p.includes('porter')
  if (f === 'central') return p.includes('central') || p.includes('centre-back')
  if (f === 'extremo') return p.includes('extrem') || p.includes('wing')
  return p.includes(f.slice(0, 5))
}
