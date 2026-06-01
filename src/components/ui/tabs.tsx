import { cn } from '@/lib/utils'

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex gap-1 border-b border-slate-200" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 -mb-px',
            active === t.id
              ? 'border-mill-blue text-mill-blue'
              : 'border-transparent text-slate-500 hover:text-mill-blue',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
