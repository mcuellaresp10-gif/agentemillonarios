import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { useFixture } from '@/hooks/usePartidos'
import { useH2H } from '@/hooks/useH2H'
import { useMillonariosPlayers } from '@/hooks/useJugadores'
import { GeneradorAnalisisIA } from '@/components/Analisis/GeneradorAnalisisIA'
import { Tabs } from '@/components/ui/tabs'
import { formatFixtureDate } from '@/utils/formatters'

export default function AnalisisDetalle() {
  const { fixtureId } = useParams()
  const id = Number(fixtureId)
  const [tab, setTab] = useState<'previa' | 'post'>('previa')
  const { data: fixture } = useFixture(id)
  const { data: h2h } = useH2H(fixture?.opponent.id ?? 0, 5)
  const { data: players } = useMillonariosPlayers()

  if (!fixture) return <p className="text-slate-500">Cargando partido...</p>

  const contexto = {
    fixture,
    h2h: h2h ?? [],
    jugadores: players?.slice(0, 15) ?? [],
    fuente: 'API-Football',
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-mill-blue">
          Millonarios vs {fixture.opponent.name}
        </h1>
        <p className="text-slate-500">{formatFixtureDate(fixture.date)}</p>
      </div>
      <Tabs
        tabs={[
          { id: 'previa', label: 'Análisis previo' },
          { id: 'post', label: 'Análisis post' },
        ]}
        active={tab}
        onChange={(t) => setTab(t as 'previa' | 'post')}
      />
      <GeneradorAnalisisIA partidoId={id} tipo={tab} contexto={contexto} />
    </div>
  )
}
