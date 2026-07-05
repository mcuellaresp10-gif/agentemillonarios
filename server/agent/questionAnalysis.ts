/** Detecta qué datos incluir según la pregunta del usuario. */
export interface QuestionHints {
  wantsScouting: boolean
  wantsClassification: boolean
  wantsNextMatch: boolean
  wantsSquad: boolean
  wantsComparison: boolean
  wantsHistory: boolean
  wantsLegends: boolean
  wantsRivalries: boolean
  wantsTitles: boolean
  wantsCulture: boolean
  wantsRecentHistory: boolean
  wantsTactics: boolean
  wantsGeneral: boolean
  searchQuery: string
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function analyzeAgentQuestion(question: string): QuestionHints {
  const q = normalize(question)

  const wantsHistory =
    /historia|historico|fundacion|fundado|origen|cuando se fund|1946|palmares|tradicion|legado|epoca|decada|antiguo/.test(
      q,
    )
  const wantsLegends =
    /idolo|leyenda|mito|goleador histor|valderrama|borja|iguaran|ortiz|valenciano|de avila|macias|jugador mas grande|mejor jugador/.test(
      q,
    )
  const wantsRivalries =
    /clasico|rival|derbi|derby|santa fe|nacional|america de cali|deportivo cali|capitalino/.test(q)
  const wantsTitles =
    /titulo|campeon|libertador|libertadores|copa|trofeo|estrella|bicampeon|tricampeon|palmares/.test(q)
  const wantsCulture =
    /hinchada|identidad|escudo|apodo|embajador|campin|estadio|color|azul|simbolo|significa|por que es grande|equipo mas grande/.test(
      q,
    )
  const wantsRecentHistory =
    /2023|2024|2025|2026|temporada|torneo reciente|ultimos anos|como va|como venimos|racha/.test(q)
  const wantsScouting =
    /scouting|refuerzo|fichaje|mercado|contrat|buscar jugador|candidato|traer|incorpor/.test(q)
  const wantsClassification =
    /clasific|top.?8|octavos|tabla|puntos|posici[oó]n|playoff|cuadrangular|finalizacion|apertura/.test(q)
  const wantsNextMatch =
    /pr[oó]ximo|rival|partido|fecha|calendario|hoy|esta semana|visita|local/.test(q)
  const wantsSquad =
    /plantilla|alineaci[oó]n|jugador|equipo|titular|convocatoria|once|formacion|capitan/.test(q)
  const wantsComparison = /compar|vs|versus|mejor|peor|entre|diferencia/.test(q)
  const wantsTactics = /tactica|sistema|esquema|presion|estilo|dt|entrenador|tecnico/.test(q)

  const specificIntent =
    wantsHistory ||
    wantsLegends ||
    wantsRivalries ||
    wantsTitles ||
    wantsCulture ||
    wantsRecentHistory ||
    wantsScouting ||
    wantsClassification ||
    wantsNextMatch ||
    wantsSquad ||
    wantsComparison ||
    wantsTactics

  const wantsGeneral =
    /quien|que es|cuantos|por que|hablame|cuentame|explicame|millonarios/.test(q) || !specificIntent

  return {
    wantsScouting,
    wantsClassification,
    wantsNextMatch,
    wantsSquad,
    wantsComparison,
    wantsHistory,
    wantsLegends,
    wantsRivalries,
    wantsTitles,
    wantsCulture,
    wantsRecentHistory,
    wantsTactics,
    wantsGeneral,
    searchQuery: question.trim(),
  }
}

export function agentMaxTokens(hints: QuestionHints): number {
  if (hints.wantsHistory || hints.wantsLegends || hints.wantsGeneral) return 1400
  if (hints.wantsScouting || hints.wantsComparison) return 1200
  if (hints.wantsClassification || hints.wantsRivalries) return 1000
  return 800
}
