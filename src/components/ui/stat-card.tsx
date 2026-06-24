import * as React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------
// StatCard — métrica de dashboard
// Seção 9.7 do design system v2
// -----------------------------------------------------------------------

interface StatCardProps {
  label: string
  value: string | number
  /** Delta em percentual (positivo = alta, negativo = queda, null = sem comparação) */
  delta?: number | null
  /** Ícone lucide no canto — deve ter size={18} strokeWidth={1.5} */
  icon?: React.ReactNode
  deltaLabel?: string
  className?: string
}

export function StatCard({
  label,
  value,
  delta,
  icon,
  deltaLabel = 'vs. mês anterior',
  className,
}: StatCardProps) {
  const isPositive = typeof delta === 'number' && delta > 0
  const isNegative = typeof delta === 'number' && delta < 0

  return (
    <div
      className={cn(
        'bg-white border border-surface-200 rounded-lg shadow-xs p-5',
        className
      )}
    >
      {/* Label + ícone */}
      <div className="flex items-start justify-between">
        <p className="text-sm text-surface-500 font-medium">{label}</p>
        {icon && (
          <span
            className="p-2 rounded-md bg-surface-50 text-surface-400 shrink-0"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>

      {/* Valor principal */}
      <p className="mt-3 font-heading text-3xl font-semibold text-surface-900 tracking-tight">
        {value}
      </p>

      {/* Delta */}
      {typeof delta === 'number' && (
        <p
          className={cn(
            'mt-1.5 text-xs font-medium flex items-center gap-1',
            isPositive && 'text-success-600',
            isNegative && 'text-error-600',
            !isPositive && !isNegative && 'text-surface-500'
          )}
          aria-label={`${Math.abs(delta)}% ${deltaLabel}`}
        >
          {isPositive && (
            <TrendingUp size={12} strokeWidth={2} aria-hidden="true" />
          )}
          {isNegative && (
            <TrendingDown size={12} strokeWidth={2} aria-hidden="true" />
          )}
          {Math.abs(delta)}% {deltaLabel}
        </p>
      )}
    </div>
  )
}
