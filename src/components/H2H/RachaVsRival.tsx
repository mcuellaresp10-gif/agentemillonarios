import { lastWinlessStreak } from '@/utils/calculators'
import type { Fixture } from '@/types'
import { resultLabel } from '@/utils/formatters'
import { cn } from '@/lib/utils'

export function RachaVsRival({ fixtures }: { fixtures: Fixture[] }) {
  const last3 = fixtures.slice(0, 3)
  const winless = lastWinlessStreak(fixtures)
  const lastWin = fixtures.find((f) => f.result === 'W')
  const lastWinDate = lastWin ? new Date(lastWin.date).toLocaleDateString('es-CO') : null

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <h4 className="font-semibold text-mill-blue">Racha vs este rival</h4>
      <div className="flex gap-2">
        {last3.map((f) => (
          <span
            key={f.id}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm',
              f.result === 'W' && 'bg-emerald-500',
              f.result === 'D' && 'bg-amber-500',
              f.result === 'L' && 'bg-red-500',
            )}
          >
            {resultLabel(f.result)}
          </span>
        ))}
      </div>
      <p className="text-sm text-slate-600">
        Partidos sin ganar consecutivos: <strong>{winless}</strong>
      </p>
      {lastWinDate ? (
        <p className="text-sm text-slate-600">
          Última victoria: <strong>{lastWinDate}</strong>
        </p>
      ) : (
        <p className="text-sm text-red-500">Sin victorias en el histórico mostrado</p>
      )}
    </div>
  )
}
