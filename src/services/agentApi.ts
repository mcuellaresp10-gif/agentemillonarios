import type { MillonariosAgentContext } from '@/types/agent'

export interface AgentChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function sendAgentMessage(
  question: string,
  messages: AgentChatMessage[],
  context: MillonariosAgentContext,
): Promise<{ answer: string; sources: string[] }> {
  const res = await fetch('/api/ai/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, messages, context }),
  })
  const data = (await res.json()) as { answer?: string; sources?: string[]; error?: string }
  if (!res.ok) throw new Error(data.error ?? 'Error del agente')
  return { answer: data.answer ?? '', sources: data.sources ?? [] }
}

export type { MillonariosAgentContext }
