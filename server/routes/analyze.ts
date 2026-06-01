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
  previa: `Eres analista táctico de Millonarios FC. Genera un ANÁLISIS PREVIO en español con estas secciones en markdown:
## Contexto
## El rival
## Alineación probable
## 3 claves del partido
## Predicción cualitativa
## Últimos H2H
Usa solo los datos del contexto JSON. No inventes lesionados ni rumores.`,
  post: `Eres analista táctico de Millonarios FC. Genera un ANÁLISIS POST-PARTIDO en español con:
## Lectura táctica
## 3 momentos clave (con minutos)
## Jugador destacado
## ¿Se cumplió la previa?
## Proyección siguiente partido
## Opinión (resumen narrativo)
Usa solo datos del contexto JSON.`,
  scout: `Eres scout de Millonarios FC. Genera un REPORTE DE SCOUTING en español:
## Por qué sería buen refuerzo
## Fortalezas para Millonarios
## Riesgos y debilidades
## Formaciones donde encaja
Compara con el jugador de Millonarios del contexto si existe.`,
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
    h2h: Array.isArray(h2h) ? h2h.slice(0, 5) : [],
    jugadores: Array.isArray(jugadores) ? jugadores.slice(0, 12) : [],
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
