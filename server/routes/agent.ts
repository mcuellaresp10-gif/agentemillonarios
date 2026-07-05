import type { Request, Response } from 'express'
import { analyzeAgentQuestion, agentMaxTokens } from '../agent/questionAnalysis.js'
import { buildAgentMessages, buildKnowledgeBlock, type AgentChatMessage } from '../agent/prompts.js'
import {
  buildMillonariosContext,
  type MillonariosAgentContext,
} from '../agent/contextBuilder.js'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const DEFAULT_MODELS = [
  'anthropic/claude-sonnet-4',
  'google/gemini-2.0-flash-001:free',
] as const

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
): Promise<{ ok: true; text: string } | { ok: false; status: number; body: string }> {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
      'X-Title': 'Millonarios Analytics Agent',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.4,
    }),
  })
  const body = await res.text()
  if (!res.ok) return { ok: false, status: res.status, body }
  try {
    const json = JSON.parse(body) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const text = json.choices?.[0]?.message?.content?.trim() ?? ''
    return { ok: true, text }
  } catch {
    return { ok: false, status: 502, body }
  }
}

export async function agentHandler(req: Request, res: Response) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim()
  if (!apiKey) {
    res.status(503).json({ error: 'OPENROUTER_API_KEY no configurada' })
    return
  }

  const { question, messages = [], context = {} } = req.body as {
    question?: string
    messages?: AgentChatMessage[]
    context?: MillonariosAgentContext
  }

  const trimmed = question?.trim()
  if (!trimmed) {
    res.status(400).json({ error: 'question requerida' })
    return
  }

  const hints = analyzeAgentQuestion(trimmed)
  const knowledgeBlock = buildKnowledgeBlock(hints)
  const contextBlock = buildMillonariosContext(context, hints)
  const chatMessages = buildAgentMessages(contextBlock, knowledgeBlock, messages, trimmed, hints)
  const maxTokens = agentMaxTokens(hints)

  let lastError = { status: 502, body: 'Error desconocido' }
  for (const model of DEFAULT_MODELS) {
    const result = await callOpenRouter(apiKey, model, chatMessages, maxTokens)
    if (result.ok) {
      res.json({
        answer: result.text,
        sources: ['Base conocimiento Millonarios', 'Contexto en vivo', 'OpenRouter'],
      })
      return
    }
    lastError = { status: result.status, body: result.body }
    if (result.status !== 404) break
  }

  res.status(lastError.status >= 400 ? lastError.status : 502).json({
    error: 'No se pudo obtener respuesta del agente',
  })
}
