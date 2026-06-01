import { useMemo } from 'react'
import { SelectorCompeticion } from '@/components/Calendario/SelectorCompeticion'
import { PartidoCard } from '@/components/Calendario/PartidoCard'
import { useFixturesByCompetition } from '@/hooks/usePartidos'
import { useAppStore } from '@/store/appStore'
import { monthKey, monthLabel } from '@/utils/formatters'
import { DashboardSkeleton } from '@/components/shared/Loading'

export default function Calendario() {
  const competition = useAppStore((s) => s.competitionFilter)
  const { data, isLoading } = useFixturesByCompetition(competition)

  const byMonth = useMemo(() => {
    const map = new Map<string, typeof data>()
    for (const f of data ?? []) {
      const k = monthKey(f.date)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(f)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [data])

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-mill-blue">Calendario</h1>
          <p className="text-slate-500">Resultados y próximos partidos</p>
        </div>
        <SelectorCompeticion />
      </div>
      {byMonth.map(([month, fixtures]) => (
        <section key={month}>
          <h2 className="text-xl font-semibold text-mill-blue mb-3 capitalize">
            {monthLabel(month)}
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {fixtures?.map((f) => (
              <PartidoCard key={f.id} fixture={f} />
            ))}
          </div>
        </section>
      ))}
      {!byMonth.length && (
        <p className="text-slate-500">No hay partidos para esta competición.</p>
      )}
    </div>
  )
}
