import { useParams, Link } from 'react-router-dom'
import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useFixture, useFixtureEvents, useFixtureLineups } from '@/hooks/usePartidos'
import { useSofascoreMatch, linkSofascoreMatch } from '@/hooks/useSofascoreMatch'
import { AnatomiaGol } from '@/components/CalendarioDetalle/AnatomiaGol'
import { formatFixtureDate, formatScore } from '@/utils/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { hasAnalisis } from '@/services/analysisAI'
import { DashboardSkeleton } from '@/components/shared/Loading'
import { TEAM_MILLONARIOS } from '@/config/constants'

export default function CalendarioDetalle() {
  const { fixtureId } = useParams()
  const id = Number(fixtureId)
  const { data: fixture, isLoading } = useFixture(id)
  const { data: events } = useFixtureEvents(id)
  const { data: lineups } = useFixtureLineups(id)
  const sofascore = useSofascoreMatch(id, fixture?.status ?? '')
  const queryClient = useQueryClient()
  const [linking, setLinking] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleLink() {
    if (!linkUrl.trim()) return
    setLinkLoading(true)
    const ok = await linkSofascoreMatch(id, linkUrl.trim())
    setLinkLoading(false)
    if (ok) {
      setLinking(false)
      setLinkUrl('')
      queryClient.invalidateQueries({ queryKey: ['sofascore', id] })
    }
  }

  if (isLoading || !fixture) return <DashboardSkeleton />

  const goals = events?.filter((e) => e.type === 'Goal') ?? []
  const subs = events?.filter((e) => e.type === 'subst') ?? []

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to="/calendario" className="text-sm text-mill-blue hover:underline">
        ← Calendario
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>
            {fixture.home.name} vs {fixture.away.name}
          </CardTitle>
          <p className="text-sm text-slate-500">
            {formatFixtureDate(fixture.date)} · {fixture.leagueName}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-3xl font-stats font-bold text-center">
            {formatScore(fixture)} ({fixture.status})
          </p>
          <p className="text-sm text-slate-600 text-center">
            {fixture.venue && `📍 ${fixture.venue}`}
            {fixture.city && ` · ${fixture.city}`}
            {fixture.referee && ` · ⚖️ ${fixture.referee}`}
          </p>
          <div className="flex gap-2 justify-center">
            {hasAnalisis(id, 'previa') && <Badge variant="ai">IA Previa</Badge>}
            {hasAnalisis(id, 'post') && <Badge variant="ai">IA Post</Badge>}
          </div>
          <Link
            to={`/analisis/${id}`}
            className="block text-center py-2 bg-mill-blue text-white rounded-md"
          >
            Análisis táctico
          </Link>
        </CardContent>
      </Card>

      {lineups && lineups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Formaciones</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            {lineups.map((l) => (
              <div key={l.teamId}>
                <p className="font-semibold text-mill-blue mb-1">
                  {l.teamId === TEAM_MILLONARIOS ? 'Millonarios' : 'Rival'} — {l.formation}
                </p>
                <p className="text-xs text-slate-500 mb-2">DT: {l.coach}</p>
                <ul className="text-xs space-y-0.5">
                  {l.startXI.map((p) => (
                    <li key={p.number}>
                      #{p.number} {p.name} ({p.pos})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Goles</CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length ? (
            <ul className="space-y-1 text-sm">
              {goals.map((g, i) => (
                <li key={i}>
                  {g.time}&apos; — {g.player} ({g.detail})
                  {g.assist && ` · Asist: ${g.assist}`}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">Sin datos de goles.</p>
          )}
        </CardContent>
      </Card>

      {fixture.status === 'FT' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Anatomía de goles · Millonarios</CardTitle>
              {!sofascore.isLoading && (sofascore.data?.goals?.length ?? 0) === 0 && (
                <button
                  onClick={() => { setLinking(true); setTimeout(() => inputRef.current?.focus(), 50) }}
                  className="text-xs text-mill-blue hover:underline"
                >
                  + Vincular Sofascore
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {sofascore.isLoading && (
              <p className="text-xs text-slate-400 animate-pulse">Cargando datos de Sofascore…</p>
            )}
            {(sofascore.data?.goals?.length ?? 0) > 0 && (
              <AnatomiaGol goals={sofascore.data!.goals} />
            )}
            {!sofascore.isLoading && (sofascore.data?.goals?.length ?? 0) === 0 && !linking && (
              <p className="text-xs text-slate-400">
                Pega la URL del partido en Sofascore para ver la anatomía de los goles.
              </p>
            )}
            {linking && (
              <div className="flex gap-2 items-center mt-1">
                <input
                  ref={inputRef}
                  type="url"
                  placeholder="https://www.sofascore.com/football/match/..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLink()}
                  className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-mill-blue"
                />
                <button
                  onClick={handleLink}
                  disabled={linkLoading || !linkUrl.trim()}
                  className="text-xs bg-mill-blue text-white px-3 py-1.5 rounded disabled:opacity-50"
                >
                  {linkLoading ? '…' : 'Guardar'}
                </button>
                <button
                  onClick={() => { setLinking(false); setLinkUrl('') }}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cambios</CardTitle>
        </CardHeader>
        <CardContent>
          {subs.length ? (
            <ul className="space-y-1 text-sm">
              {subs.map((s, i) => (
                <li key={i}>
                  {s.time}&apos; — {s.player} ({s.detail})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">Sin datos de cambios.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
