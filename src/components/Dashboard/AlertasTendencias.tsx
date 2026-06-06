import { useMemo } from 'react'
import { useRecentFixtures } from '@/hooks/usePartidos'
import { useLigaStandings } from '@/hooks/useStandings'
import { computeAlerts, findMilloRow, type Alerta } from '@/utils/alerts'
import { cn } from '@/lib/utils'

function chipClass(tipo: Alerta['tipo']): string {
  return cn(
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
    tipo === 'positivo' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
    tipo === 'negativo' && 'border-red-200 bg-red-50 text-red-700',
    tipo === 'neutro' && 'border-slate-200 bg-slate-50 text-slate-600',
  )
}

function SkeletonChip() {
  return <div className="h-7 w-36 animate-pulse rounded-full bg-slate-200" />
}

export function AlertasTendencias() {
  const { data: fixtures, isLoading: fixturesLoading } = useRecentFixtures(10)
  const { data: standings, isLoading: standingsLoading } = useLigaStandings()

  const alertas = useMemo(() => {
    if (!fixtures) return []
    const milloRow = standings ? findMilloRow(standings) : undefined
    return computeAlerts(fixtures, milloRow)
  }, [fixtures, standings])

  const isLoading = fixturesLoading || standingsLoading

  if (isLoading) {
    return (
      <section aria-label="Tendencias">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-3">
          Tendencias
        </p>
        <div className="flex flex-wrap gap-2">
          <SkeletonChip />
          <SkeletonChip />
          <SkeletonChip />
        </div>
      </section>
    )
  }

  if (alertas.length === 0) return null

  return (
    <section aria-label="Tendencias">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-3">
        Tendencias
      </p>
      <div className="flex flex-wrap gap-2">
        {alertas.map((a, i) => (
          <span
            key={i}
            className={chipClass(a.tipo)}
            title={a.detalle}
          >
            <span aria-hidden="true">{a.emoji}</span>
            {a.texto}
          </span>
        ))}
      </div>
    </section>
  )
}
