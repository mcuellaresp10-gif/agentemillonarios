import { ProximoPartido } from '@/components/Dashboard/ProximoPartido'
import { UltimosPartidos } from '@/components/Dashboard/UltimosPartidos'
import { EstadisticasTemporada } from '@/components/Dashboard/EstadisticasTemporada'
import { AlertasTendencias } from '@/components/Dashboard/AlertasTendencias'
import { AlineacionPredichaCard } from '@/components/Dashboard/AlineacionPredichaCard'
import { DashboardSkeleton } from '@/components/shared/Loading'
import { useNextFixture, useRecentFixtures } from '@/hooks/usePartidos'
import { useLigaStandings } from '@/hooks/useStandings'
import { useTeamSeasonStats } from '@/hooks/useEstadisticas'
import { setUseStaleFallback } from '@/services/apiFootball'
import { useEffect } from 'react'
import { toast } from 'sonner'

export default function Dashboard() {
  const next = useNextFixture()
  const recent = useRecentFixtures(5)
  const standings = useLigaStandings()
  const teamStats = useTeamSeasonStats()

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
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-mill-blue">Dashboard</h1>
        <p className="text-slate-500 mt-1">Resumen de Millonarios FC</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <ProximoPartido
          fixture={next.data}
          standings={standings.data ?? []}
        />
        <EstadisticasTemporada
          fixtures={recent.data ?? []}
          standings={standings.data ?? []}
          teamStats={teamStats.data}
        />
      </div>
      <AlertasTendencias />
      <AlineacionPredichaCard />
      <UltimosPartidos fixtures={recent.data ?? []} />
    </div>
  )
}
