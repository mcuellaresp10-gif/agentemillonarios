import { cn } from '@/lib/utils'

export function Badge({
  className,
  variant = 'default',
  children,
}: {
  className?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'ai'
  children: React.ReactNode
}) {
  const variants = {
    default: 'bg-blue-100 text-mill-blue',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-600',
    ai: 'bg-mill-gold/30 text-mill-blue border border-mill-gold',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
