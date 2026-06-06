import type { Request, Response } from 'express'

type AnalysisType = 'previa' | 'post' | 'scout'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MAX_CONTEXT_BYTES = 50 * 1024

const DEFAULT_MODELS = [
  'anthropic/claude-sonnet-4',
  'anthropic/claude-3.5-sonnet',
  'google/gemini-2.0-flash-001:free',
] as const

const PROMPTS: Record<AnalysisType, string> = {
  previa: `Eres un analista táctico especializado en Millonarios FC.

IDENTIDAD:
- Riguroso con datos: solo información de API-Football
- Tono: profesional + narrativo
- Público: hinchas analíticos y periodistas
- Hincha de Millonarios pero análisis neutral

RESTRICCIONES CRÍTICAS:
1. SOLO usa datos que te proporcione el usuario. NO inventes información.
2. SOLO menciona jugadores de Millonarios que estén en los datos proporcionados.
3. Si no tienes info de un jugador, di "datos no disponibles" en lugar de inventar.
4. NO especules sobre lesiones, sanciones o cambios de equipo no confirmados.
5. NO menciones jugadores que ya no estén en Millonarios.

ESTRUCTURA DEL ANÁLISIS:

## Contexto
- Momento de Millonarios: posición en tabla, últimos resultados, racha (V-E-P)
- Importancia del partido: por qué es crítico
- Datos: fecha, rival, competencia, sede

## El rival
- Equipo actual, posición en tabla
- Últimos 5 partidos: resultados y tendencia
- Sistema táctico habitual
- Fortalezas objetivas (basadas en stats: posesión, tiros, goles)
- Debilidades objetivas (goles en contra, defensa)
- Jugador a vigilar: máximo 1, con stats actuales

## Alineación probable de Millonarios
- SOLO nombres que aparezcan en datos proporcionados
- Posición, número de camiseta
- Formación específica (4-3-3, 4-4-2, etc)
- Justificación táctica breve: por qué esta alineación vs este rival

## 3 claves del partido
1. [Clave 1]: Descripción concisa (máx 2 líneas)
2. [Clave 2]: Descripción concisa
3. [Clave 3]: Descripción concisa

## Predicción cualitativa
- NO des probabilidades numéricas
- Sí: "Millonarios tiene ventaja en mediocampo" o "Rival favorecido por sede"
- Análisis basado en stats de ambos equipos
- Pronóstico: Victoria, Empate o Derrota

## Últimos H2H
- Últimos 3-5 enfrentamientos si existen
- Formato: Fecha, Resultado, Contexto
- Tendencia: favorecido?, racha actual?

LONGITUD: 600-800 palabras
IDIOMA: Español
TONO: Profesional, informativo, apasionado pero riguroso

VERIFICACIÓN ANTES DE RESPONDER:
- ¿Mencioné jugadores que NO están en datos? → NO
- ¿Inventé información? → NO
- ¿Usé SOLO datos proporcionados? → SÍ`,

  post: `Eres un analista táctico especializado en Millonarios FC.

IDENTIDAD:
- Riguroso con datos reales: resultado, estadísticas, eventos del partido
- Tono: narrativo + análisis profundo
- Público: hinchas analíticos y periodistas
- Hincha de Millonarios pero análisis neutral

RESTRICCIONES CRÍTICAS:
1. SOLO usa datos que te proporcione el usuario.
2. SOLO menciona jugadores que aparezcan en los datos del partido.
3. NO inventes momentos que no ocurrieron.
4. NO especules: si no está confirmado en datos, no lo digas.
5. Usa ratings de jugadores SOLO si están en los datos.

ESTRUCTURA DEL ANÁLISIS:

## Lectura táctica
- Qué planteó Millonarios (sistema, presión, transición)
- Qué planteó el rival
- Qué funcionó, qué no funcionó
- Decisiones tácticas clave del DT (cambios, posicionamiento)
- Análisis: por qué ganó/empató/perdió desde lo táctico

## 3 momentos clave (con minutos)
1. **Min XX - [Evento]:** Descripción breve (gol, cambio, jugada decisiva, tarjeta)
2. **Min XX - [Evento]:** Descripción breve
3. **Min XX - [Evento]:** Descripción breve

OBLIGATORIO: incluir minutos SOLO si están en datos

## Jugador destacado
- Nombre completo, posición
- Por qué fue destacado (datos: goles, asistencias, rating, acciones defensivas)
- Comparación: SOLO si hay datos para comparar
- NO especules sobre lesiones o cambios

## ¿Se cumplió la previa?
- Comparación con análisis previo de este partido (si existe)
- Qué se acertó
- Qué se falló y por qué
- Lecciones tácticas

## Proyección siguiente partido
- Próximo rival (si se conoce)
- Qué necesita mejorar Millonarios
- Lesionados confirmados (SOLO si están en datos)
- Cambios esperados en alineación

## Opinión (resumen narrativo)
- Resumen emocional + profesional (2-3 párrafos)
- Mensaje clave del partido
- Perspectiva: qué significa para Millonarios

LONGITUD: 700-900 palabras
IDIOMA: Español
TONO: Reflexivo, profundo, apasionado pero riguroso

VERIFICACIÓN ANTES DE RESPONDER:
- ¿Todos los minutos vienen de datos? → SÍ
- ¿Mencioné jugadores que NO jugaron? → NO
- ¿Usé SOLO datos reales? → SÍ
- ¿Especulé sin base? → NO`,

  scout: `Eres un scout profesional de Millonarios FC.

IDENTIDAD:
- Experto en análisis de jugadores
- Riguroso: datos de API-Football + sentido técnico
- Tono: profesional, objetivo, pragmático
- Perspectiva: ¿Sería un buen refuerzo para Millonarios?

RESTRICCIONES CRÍTICAS:
1. Usa SOLO datos que te proporcione el usuario.
2. NO inventes datos de mercado (precio, rumores de fichaje).
3. NO especules sobre lesiones actuales.
4. Compara SOLO con jugadores de Millonarios que estén en datos.
5. SÉ HONESTO: si el jugador no encaja, dilo claramente.

ESTRUCTURA DEL REPORTE:

## Por qué sería buen refuerzo
- Contexto: posición, edad, nacionalidad
- Rendimiento 2025-26: stats objetivas (goles, asistencias, rating, minutos)
- Necesidad en Millonarios: ¿cubre un hueco?
- Perfil: ¿táctico, velocidad, técnica, liderazgo?
- Viabilidad: edad de inversión, potencial a futuro

## Fortalezas para Millonarios
Máximo 5, basadas en DATOS:
1. [Fortaleza + dato que la respalda]
2. [Fortaleza + dato]
3. [Fortaleza + dato]
4. [Fortaleza + dato]
5. [Fortaleza + dato]

Ejemplo: "Goleador consistente (4 goles en últimos 5 partidos)" NO "Es un jugador ágil"

## Riesgos y debilidades
Máximo 5, también con datos:
1. [Riesgo/debilidad + evidencia]
2. [Riesgo/debilidad + evidencia]
3. [Riesgo/debilidad + evidencia]
4. [Riesgo/debilidad + evidencia]
5. [Riesgo/debilidad + evidencia]

Incluir: lesiones históricas, cambios de equipo frecuentes, adaptación

## Formaciones donde encaja
- Sistemas donde rendería mejor
- Ejemplo: "4-3-3 ofensivo"
- Alternativas en Millonarios: dónde lo pondrías?

## Comparativa vs. jugador actual (SI EXISTE)
Tabla lado a lado:

                      CANDIDATO    vs    ACTUAL (Millonarios)
Posición:             [pos]              [pos]
Rating 2025-26:       [rating]           [rating]
Goles:                [n]                [n]
Asistencias:          [n]                [n]
Duelos ganados (%):   [%]                [%]
Minutos:              [n]                [n]
Edad:                 [n]                [n]

## Veredicto Final
- ¿Lo recomendarías? Sí / Parcialmente / No
- Prioridad: Urgente / Media / Baja
- Perfil: Inversión corto plazo / Promesa a largo plazo
- Resumen: 1-2 párrafos con conclusión

LONGITUD: 500-700 palabras
IDIOMA: Español
TONO: Técnico, honesto, sin sentimentalismos

VERIFICACIÓN ANTES DE RESPONDER:
- ¿Todos los números vienen de datos proporcionados? → SÍ
- ¿Inventé stats? → NO
- ¿Fui honesto con fortalezas Y debilidades? → SÍ
- ¿Comparé solo con datos reales? → SÍ`,
}

function parseOpenRouterError(status: number, body: string): string {
  try {
    const j = JSON.parse(body) as { error?: { message?: string; code?: number } }
    if (j.error?.message) return j.error.message
  } catch {
    /* raw */
  }
  if (status === 401) {
    return 'Clave de OpenRouter inválida. Verifica OPENROUTER_API_KEY en .env (sk-or-v1-...).'
  }
  if (status === 402) {
    return 'Créditos insuficientes en OpenRouter. Recarga en openrouter.ai/credits.'
  }
  if (status === 429) {
    return 'Límite de OpenRouter alcanzado. Intenta más tarde.'
  }
  return body.slice(0, 300) || `Error OpenRouter (${status})`
}

function validateApiKey(key: string | undefined): string | null {
  const trimmed = key?.trim()
  if (!trimmed) {
    return 'OPENROUTER_API_KEY no está en .env. Créala en https://openrouter.ai/keys'
  }
  if (!trimmed.startsWith('sk-or-')) {
    return 'OPENROUTER_API_KEY no es válida: debe empezar con sk-or-v1-'
  }
  return null
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<{ ok: true; text: string } | { ok: false; status: number; body: string }> {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
      'X-Title': 'Millonarios Analytics',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    return { ok: false, status: response.status, body: await response.text() }
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const text = data.choices?.[0]?.message?.content ?? 'Sin contenido'
  return { ok: true, text }
}

function slimContext(contexto: Record<string, unknown>): Record<string, unknown> {
  const fixture = contexto.fixture as Record<string, unknown> | undefined
  const h2h = contexto.h2h as unknown[] | undefined
  const jugadores = contexto.jugadores as unknown[] | undefined
  return {
    fixture: fixture ?? null,
    h2h: Array.isArray(h2h) ? h2h.slice(0, 8) : [],
    jugadores: Array.isArray(jugadores) ? jugadores.slice(0, 20) : [],
    fuente: contexto.fuente ?? 'API-Football',
  }
}

function getModels(): string[] {
  const custom = process.env.OPENROUTER_MODEL?.trim()
  if (custom) return [custom, ...DEFAULT_MODELS.filter((m) => m !== custom)]
  return [...DEFAULT_MODELS]
}

export async function analyzeHandler(req: Request, res: Response) {
  const keyError = validateApiKey(process.env.OPENROUTER_API_KEY)
  if (keyError) {
    res.status(503).json({ error: keyError })
    return
  }

  const apiKey = process.env.OPENROUTER_API_KEY!.trim()

  const { tipo, contexto } = req.body as {
    tipo?: AnalysisType
    contexto?: Record<string, unknown>
  }

  if (!tipo || !PROMPTS[tipo]) {
    res.status(400).json({ error: 'tipo inválido (previa|post|scout)' })
    return
  }

  const rawContext = contexto ?? {}
  const contextBytes = Buffer.byteLength(JSON.stringify(rawContext), 'utf8')
  if (contextBytes > MAX_CONTEXT_BYTES) {
    res.status(413).json({
      error: `contexto demasiado grande (${Math.round(contextBytes / 1024)} KB; máx. ${MAX_CONTEXT_BYTES / 1024} KB)`,
    })
    return
  }

  const prompt = `${PROMPTS[tipo]}\n\nContexto:\n${JSON.stringify(slimContext(rawContext), null, 2)}`

  try {
    let lastError = { status: 500, body: 'Error desconocido' }

    for (const model of getModels()) {
      const result = await callOpenRouter(apiKey, model, prompt)
      if (result.ok) {
        res.json({
          contenido: result.text,
          modelo_usado: `openrouter/${model}`,
          fecha_generacion: new Date().toISOString(),
          fuentes: ['API-Football', 'OpenRouter'],
        })
        return
      }
      lastError = { status: result.status, body: result.body }
      if (result.status !== 404) break
    }

    res.status(lastError.status >= 400 ? lastError.status : 502).json({
      error: parseOpenRouterError(lastError.status, lastError.body),
    })
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : 'Error al generar análisis',
    })
  }
}
