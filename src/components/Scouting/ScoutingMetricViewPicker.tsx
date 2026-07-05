import type { ScoutingMetricViewId } from '@/config/scoutingMetricViews'
import { getMetricViewsForPosition } from '@/config/scoutingMetricViews'
import type { ScoutingPosition } from '@/config/positionMetricProfiles'
import { cn } from '@/lib/utils'

export function ScoutingMetricViewPicker({
  position,
  value,
  onChange,
}: {
  position: ScoutingPosition
  value: ScoutingMetricViewId
  onChange: (id: ScoutingMetricViewId) => void
}) {
  const views = getMetricViewsForPosition(position)

  return (
    <div className="flex flex-wrap gap-1.5">
      {views.map((view) => (
        <button
          key={view.id}
          type="button"
          title={view.description}
          onClick={() => onChange(view.id)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            value === view.id
              ? 'bg-mill-blue text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
          )}
        >
          {view.label}
        </button>
      ))}
    </div>
  )
}
