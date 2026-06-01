import type { Fixture, H2HFixturePlayerMeta } from '@/types'
import { formatShortDate, formatMillonariosScore, resultLabel } from '@/utils/formatters'
import { resultColor } from '@/utils/calculators'
import { cn } from '@/lib/utils'

export function H2HTable({
  fixtures,
  byFixture = [],
}: {
  fixtures: Fixture[]
  byFixture?: H2HFixturePlayerMeta[]
}) {
  const metaMap = new Map(byFixture.map((m) => [m.fixtureId, m]))

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-left">
            <th className="px-3 py-2">Fecha</th>
            <th className="px-3 py-2">Resultado</th>
            <th className="px-3 py-2">Formación</th>
            <th className="px-3 py-2">Goleadores M.</th>
            <th className="px-3 py-2">Competición</th>
          </tr>
        </thead>
        <tbody>
          {fixtures.map((f) => {
            const meta = metaMap.get(f.id)
            const scorers = meta?.scorers?.length
              ? meta.scorers.join(', ')
              : '—'
            return (
              <tr key={f.id} className="border-b">
                <td className="px-3 py-2 whitespace-nowrap">
                  {formatShortDate(f.date)}
                </td>
                <td
                  className={cn(
                    'px-3 py-2 font-bold font-stats whitespace-nowrap',
                    resultColor(f.result),
                  )}
                >
                  {formatMillonariosScore(f)} ({resultLabel(f.result)})
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {meta?.formation ?? '—'}
                  {meta?.coach && (
                    <span className="block text-xs text-slate-400">
                      DT: {meta.coach}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-mill-blue font-medium max-w-[200px]">
                  {scorers}
                </td>
                <td className="px-3 py-2 text-slate-500">{f.leagueName}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
