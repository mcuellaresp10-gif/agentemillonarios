import type { QuestionHints } from './questionAnalysis.js'
import { formatExpertKnowledgeBase } from '../data/millonariosKnowledge.js'

export interface AgentChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `Eres el Agente Experto de Millonarios FC: historiador, analista táctico, scout y guía para la hinchada.

TU EXPERTISE:
- Historia completa del club desde 1946: títulos de liga, Copa Colombia, Merconorte, ídolos e hitos.
- IMPORTANTE: Millonarios NO ha ganado la Copa Libertadores. Nunca afirmes lo contrario.
- Identidad: El Embajador, El Campín, hinchada, rivalidades (Santa Fe, Nacional, etc.).
- Actualidad: plantilla, tabla, próximo partido, scouting y simulaciones (cuando estén en contexto).
- Puedes responder preguntas generales, curiosidades, comparaciones históricas y de actualidad.

REGLAS DE DATOS:
1. HISTORIA / PALMARÉS / ÍDOLOS / CULTURA: usa la BASE DE CONOCIMIENTO curada del sistema.
2. TEMPORADA ACTUAL (plantilla, tabla, partidos, stats): usa SOLO el CONTEXTO EN VIVO.
3. NO inventes resultados recientes, goleadores actuales ni fichajes no mencionados en contexto.
4. NO des probabilidades numéricas de victoria salvo las incluidas en simulaciones del contexto.
5. Si mezclas historia y actualidad, separa claramente qué es histórico y qué es dato vivo.
6. Tono: apasionado pero riguroso, hincha analítico de Millonarios. Idioma: español.
7. Si no sabes algo con certeza, dilo; puedes dar contexto histórico relacionado.

FORMATO:
- Respuestas claras y completas; usa listas cuando ayude.
- Para preguntas amplias ("hablame de Millonarios"), estructura: identidad → palmarés → época actual.`

function buildFocusHints(hints: QuestionHints): string {
  const parts: string[] = []
  if (hints.wantsHistory) parts.push('Prioriza historia y hitos del club.')
  if (hints.wantsLegends) parts.push('Prioriza ídolos y jugadores legendarios.')
  if (hints.wantsRivalries) parts.push('Prioriza clásicos y rivalidades.')
  if (hints.wantsTitles) parts.push('Prioriza palmarés y títulos.')
  if (hints.wantsCulture) parts.push('Prioriza identidad, hinchada y cultura.')
  if (hints.wantsRecentHistory) parts.push('Prioriza temporadas recientes y tendencia.')
  if (hints.wantsScouting) parts.push('Prioriza mercado y candidatos.')
  if (hints.wantsClassification) parts.push('Prioriza tabla y clasificación.')
  if (hints.wantsNextMatch) parts.push('Prioriza próximo partido y rival.')
  if (hints.wantsSquad) parts.push('Prioriza plantilla actual.')
  if (hints.wantsTactics) parts.push('Prioriza análisis táctico.')
  if (hints.wantsComparison) parts.push('Prioriza comparación estructurada.')
  if (hints.wantsGeneral) parts.push('Responde de forma amplia como experto del club.')
  return parts.length ? '\nEnfoque: ' + parts.join(' ') : ''
}

export function buildAgentMessages(
  context: string,
  knowledge: string,
  history: AgentChatMessage[],
  question: string,
  hints: QuestionHints,
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT + buildFocusHints(hints) },
    { role: 'system', content: `BASE DE CONOCIMIENTO MILLONARIOS:\n${knowledge}` },
    { role: 'system', content: `CONTEXTO EN VIVO (temporada actual):\n${context}` },
  ]

  for (const msg of history.slice(-8)) {
    messages.push({ role: msg.role, content: msg.content })
  }
  messages.push({ role: 'user', content: question })
  return messages
}

export function buildKnowledgeBlock(hints: QuestionHints): string {
  return formatExpertKnowledgeBase({
    wantsHistory: hints.wantsHistory || hints.wantsGeneral,
    wantsLegends: hints.wantsLegends || hints.wantsGeneral,
    wantsRivalries: hints.wantsRivalries || hints.wantsGeneral,
    wantsTitles: hints.wantsTitles || hints.wantsGeneral,
    wantsCulture: hints.wantsCulture || hints.wantsGeneral,
    wantsRecentHistory: hints.wantsRecentHistory || hints.wantsGeneral,
    searchQuery: hints.searchQuery,
  })
}
