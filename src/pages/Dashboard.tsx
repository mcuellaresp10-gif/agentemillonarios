import { ProximoPartido } from '@/components/Dashboard/ProximoPartido'
import { UltimosPartidos } from '@/components/Dashboard/UltimosPartidos'
import { EstadisticasTemporada } from '@/components/Dashboard/EstadisticasTemporada'
import { AlertasTendencias } from '@/components/Dashboard/AlertasTendencias'
import { AlineacionPredichaCard } from '@/components/Dashboard/AlineacionPredichaCard'
import { DashboardHero } from '@/components/Dashboard/DashboardHero'
import { MillonariosFocus } from '@/components/Dashboard/MillonariosFocus'
import { DashboardSkeleton } from '@/components/shared/Loading'
import { useNextFixture, useRecentFixtures } from '@/hooks/usePartidos'
import { useLigaStandings } from '@/hooks/useStandings'
import { useTeamSeasonStats } from '@/hooks/useEstadisticas'
import { useMillonariosPlayers } from '@/hooks/useJugadores'
import { setUseStaleFallback } from '@/services/apiFootball'
import { useEffect } from 'react'
import { toast } from 'sonner'

export default function Dashboard() {
  const next = useNextFixture()
  const recent = useRecentFixtures(5)
  const standings = useLigaStandings()
  const teamStats = useTeamSeasonStats()
  const millPlayers = useMillonariosPlayers()

  useEffect(() => {
    setUseStaleFallback(true)
  }, [])

  useEffect(() => {
    const err = next.error || recent.error
    if (err) toast.error('Conexión limitada — mostrando caché si existe')
  }, [next.error, recent.error])

  const loading = next.isLoading || recent.isLoading

  if (loading) return <DashboardSkeleton />

  return (
    <div className="@container/dashboard w-full space-y-8 animate-in fade-in">
      <DashboardHero />

      <div
        className="
          grid min-w-0 gap-6 lg:gap-8
          grid-cols-1
          xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]
          xl:grid-rows-[auto_auto_auto]
        "
      >
        <section className="min-w-0 xl:col-start-1 xl:row-start-1">
          <ProximoPartido
            fixture={next.data}
            standings={standings.data ?? []}
            millPlayers={millPlayers.data}
          />
        </section>

        <aside
          className="
            min-w-0 order-first xl:order-none
            xl:col-start-2 xl:row-start-1 xl:row-span-3
            xl:sticky xl:top-24 xl:self-start
            xl:max-h-[calc(100vh-6.5rem)] xl:overflow-y-auto
          "
        >
          <MillonariosFocus standings={standings.data ?? []} />
        </aside>

        <section className="min-w-0 xl:col-start-1 xl:row-start-2 space-y-6">
          <div className="dashboard-grid">
            <div className="area-stats">
              <EstadisticasTemporada
                fixtures={recent.data ?? []}
                standings={standings.data ?? []}
                teamStats={teamStats.data}
              />
            </div>
            <div className="area-alertas">
              <AlertasTendencias />
            </div>
            <div className="area-alineacion">
              <AlineacionPredichaCard />
            </div>
            <div className="area-ultimos">
              <UltimosPartidos fixtures={recent.data ?? []} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
