import { useState } from 'react'
import { TablaBasica } from '@/components/shared/TablaBasica'
import { Tabs } from '@/components/ui/tabs'
import {
  useLigaStandings,
  useLibertadoresStandings,
  useSudamericanaStandings,
} from '@/hooks/useStandings'
import { TableSkeleton } from '@/components/shared/Loading'
import {
  LEAGUE_LIGA,
  LEAGUE_LIBERTADORES,
  LEAGUE_SUDAMERICANA,
} from '@/config/constants'

export default function Tabla() {
  const [tab, setTab] = useState('liga')
  const liga = useLigaStandings()
  const lib = useLibertadoresStandings()
  const sud = useSudamericanaStandings()

  const active =
    tab === 'liga' ? liga : tab === 'lib' ? lib : sud

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-mill-blue">Tabla de posiciones</h1>
        <p className="text-slate-500">Millonarios destacado en oro</p>
      </div>
      <Tabs
        tabs={[
          { id: 'liga', label: 'Liga BetPlay' },
          { id: 'lib', label: 'Libertadores' },
          { id: 'sud', label: 'Sudamericana' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {active.isLoading ? (
        <TableSkeleton />
      ) : active.data?.length ? (
        <TablaBasica rows={active.data} />
      ) : (
        <p className="text-slate-500">
          No hay tabla disponible para{' '}
          {tab === 'liga'
            ? `liga ${LEAGUE_LIGA}`
            : tab === 'lib'
              ? `Libertadores ${LEAGUE_LIBERTADORES}`
              : `Sudamericana ${LEAGUE_SUDAMERICANA}`}
          .
        </p>
      )}
    </div>
  )
}
