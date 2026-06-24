import * as React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------
// PageHeader — cabeçalho padrão de todas as telas logadas
// Seção 9.6 do design system v2
// -----------------------------------------------------------------------

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Slot de ações — botões, dropdowns, etc. */
  action?: React.ReactNode
  breadcrumb?: BreadcrumbItem[]
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  action,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'py-8 px-6 border-b border-surface-100 bg-white',
        className
      )}
    >
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav
          aria-label="Navegação de migalhas"
          className="flex items-center gap-1 mb-3 flex-wrap"
        >
          {breadcrumb.map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <ChevronRight
                  size={12}
                  strokeWidth={1.5}
                  className="text-surface-300"
                  aria-hidden="true"
                />
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-xs text-surface-400 hover:text-surface-600 transition-colors duration-150"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="text-xs text-surface-500"
                  aria-current={i === breadcrumb.length - 1 ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-surface-900 tracking-tight text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-surface-500">{subtitle}</p>
          )}
        </div>

        {action && (
          <div className="flex items-center gap-3 shrink-0 mt-0.5">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
