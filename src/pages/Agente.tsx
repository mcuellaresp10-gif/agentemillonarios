import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { sendAgentMessage, type AgentChatMessage } from '@/services/agentApi'
import { useLigaStandings } from '@/hooks/useStandings'
import { useNextFixture, useRecentFixtures } from '@/hooks/usePartidos'
import { useMillonariosPlayers } from '@/hooks/useJugadores'
import { useMonteCarlo } from '@/hooks/useMonteCarlo'
import { useMatchSimulation } from '@/hooks/useMatchSimulation'
import { MatchSimulationPreview } from '@/components/Dashboard/MatchSimulationPreview'
import { TEAM_MILLONARIOS } from '@/config/constants'
import { computeAlerts } from '@/utils/alerts'
import { toast } from 'sonner'

const EXAMPLE_QUESTIONS = [
  '¿Cuántos títulos de liga tiene Millonarios?',
  '¿Quién es el máximo goleador histórico del club?',
  'Háblame del clásico con Santa Fe',
  '¿Millonarios tiene Libertadores?',
  '¿Qué refuerzo deberíamos fichar en mediocampo?',
  'Análisis del próximo rival',
]

export default function Agente() {
  const [messages, setMessages] = useState<AgentChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const standings = useLigaStandings()
  const next = useNextFixture()
  const recent = useRecentFixtures(10)
  const millPlayers = useMillonariosPlayers()
  const mc = useMonteCarlo()
  const matchSim = useMatchSimulation(next.data, standings.data ?? [], millPlayers.data)

  const agentContext = useMemo(() => {
    const rows = standings.data ?? []
    const mill = rows.find((s) => s.team.id === TEAM_MILLONARIOS)
    const finished = (recent.data ?? []).filter(
      (f) => f.result === 'W' || f.result === 'D' || f.result === 'L',
    )
    const alerts = computeAlerts(finished, mill)

    return {
      standings: rows.slice(0, 12).map((s) => ({
        rank: s.rank,
        team: s.team.name,
        points: s.points,
        played: s.played,
        form: s.form,
      })),
      millPosition: mill
        ? {
            rank: mill.rank,
            points: mill.points,
            form: mill.form,
            goalsFor: mill.goalsFor,
            goalsAgainst: mill.goalsAgainst,
          }
        : undefined,
      nextFixture: next.data
        ? {
            date: next.data.date,
            opponent: next.data.opponent.name,
            venue: next.data.venue,
            isHome: next.data.isMillonariosHome,
          }
        : undefined,
      recentResults: finished.slice(0, 8).map((f) => ({
        date: f.date,
        opponent: f.opponent.name,
        score: `${f.millonariosGoals ?? 0}-${f.opponentGoals ?? 0}`,
        result: f.result ?? '?',
        isHome: f.isMillonariosHome,
      })),
      alerts: alerts.map((a) => ({
        tipo: a.tipo,
        texto: a.texto,
        detalle: a.detalle,
      })),
      squadSummary: (millPlayers.data ?? []).slice(0, 25).map((p) => ({
        name: p.name,
        position: p.position,
        rating: p.ratingAvg,
        goals: p.goals,
        assists: p.assists,
        minutes: p.minutes,
        nationality: p.nationality,
      })),
      simulation: mc.result
        ? {
            top8Probability: Math.round(mc.result.probability * 100),
            expectedPoints: Math.round(mc.result.expectedPoints),
          }
        : undefined,
      matchSimulation: matchSim
        ? {
            winPct: Math.round(matchSim.millWin * 100),
            drawPct: Math.round(matchSim.millDraw * 100),
            lossPct: Math.round(matchSim.millLoss * 100),
            expectedGoals: `${matchSim.expectedGoals.home.toFixed(1)}-${matchSim.expectedGoals.away.toFixed(1)}`,
          }
        : undefined,
    }
  }, [standings.data, next.data, recent.data, millPlayers.data, mc.result, matchSim])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text?: string) => {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setInput('')
    const userMsg: AgentChatMessage = { role: 'user', content: q }
    setMessages((m) => [...m, userMsg])
    setLoading(true)
    try {
      const { answer } = await sendAgentMessage(q, messages, agentContext)
      setMessages((m) => [...m, { role: 'assistant', content: answer }])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error del agente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-mill-blue">Agente Experto Millonarios</h1>
        <p className="text-slate-500 mt-1">
          Historia, ídolos, clásicos, plantilla, clasificación, scouting y actualidad del club
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="min-h-[320px] max-h-[480px] overflow-y-auto space-y-3 rounded-lg border p-4 bg-slate-50">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  Pregúntame lo que quieras sobre Millonarios: desde su fundación en 1946 hasta
                  el próximo partido.
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void handleSend(q)}
                      className="text-xs rounded-full border border-mill-blue/30 bg-white px-3 py-1.5 text-mill-blue hover:bg-mill-blue/5 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 text-sm max-w-[90%] ${
                  msg.role === 'user'
                    ? 'ml-auto bg-mill-blue text-white'
                    : 'bg-white border text-slate-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Pensando…
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void handleSend()}
              placeholder="Historia, actualidad, plantilla, clásicos…"
              className="flex-1 rounded-md border px-3 py-2 text-sm"
              disabled={loading}
            />
            <Button onClick={() => void handleSend()} disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {next.data && (
        <MatchSimulationPreview
          fixture={next.data}
          standings={standings.data ?? []}
          millPlayers={millPlayers.data}
        />
      )}
    </div>
  )
}
