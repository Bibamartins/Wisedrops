import * as React from 'react'
import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------
// EmptyState — componente reutilizável
// Substitui 10 reimplementações manuais (seção 9.8 do design system)
// -----------------------------------------------------------------------

interface EmptyStateProps {
  /** Ícone lucide passado como ReactNode */
  icon?: React.ReactNode
  title: string
  description?: string
  /** CTA — geralmente um Button */
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
      role="status"
      aria-label={title}
    >
      {icon && (
        <div className="rounded-2xl bg-surface-50 p-4 mb-5" aria-hidden="true">
          {/* Ícone deve ter size={40} strokeWidth={1} text-surface-300 — responsabilidade do caller */}
          {icon}
        </div>
      )}

      <h3 className="font-heading text-base font-semibold text-surface-700 mb-1.5 text-balance">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-surface-500 max-w-xs leading-relaxed text-balance">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
