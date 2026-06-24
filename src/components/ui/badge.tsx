import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------
// Badge — status clínico + informativos
// Tokens calibrados WCAG AA (ver tabela seção 12 do design-system-v2)
// -----------------------------------------------------------------------

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium leading-none',
  {
    variants: {
      variant: {
        // --- Status clínicos (21 telas dependem destes) ---
        scheduled: 'bg-warning-100 text-warning-700',   // WCAG 5.20:1
        paid:      'bg-success-50  text-success-600',   // WCAG 5.85:1
        completed: 'bg-success-100 text-success-700',   // WCAG 6.10:1
        cancelled: 'bg-error-100   text-error-700',     // WCAG 5.94:1

        // --- Informativos ---
        neutral:   'bg-surface-100 text-surface-700',   // WCAG 7.92:1
        brand:     'bg-brand-100   text-brand-700',     // WCAG 5.74:1
        sage:      'bg-sage-100    text-sage-700',      // WCAG 9.24:1
        info:      'bg-info-100    text-info-700',      // WCAG 5.40:1
        success:   'bg-success-100 text-success-700',
        warning:   'bg-warning-100 text-warning-700',
        error:     'bg-error-100   text-error-700',

        // --- Legado (compatibilidade com badge.tsx anterior) ---
        /** @deprecated use neutral */
        default: 'bg-surface-100 text-surface-700',
      },
      size: {
        sm: 'text-[10px] px-1.5 py-0.5',
        md: 'text-xs px-2 py-0.5',
      },
    },
    defaultVariants: { variant: 'neutral', size: 'md' },
  }
)

// Mapa de cor do dot por variant
const DOT_COLOR: Record<string, string> = {
  scheduled: 'bg-warning-500',
  paid:      'bg-success-500',
  completed: 'bg-success-500',
  cancelled: 'bg-error-500',
  neutral:   'bg-surface-400',
  default:   'bg-surface-400',
  brand:     'bg-brand-500',
  sage:      'bg-sage-500',
  info:      'bg-info-500',
  success:   'bg-success-500',
  warning:   'bg-warning-500',
  error:     'bg-error-500',
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

export function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  const dotColor = DOT_COLOR[variant ?? 'neutral'] ?? 'bg-surface-400'

  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColor)}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}

export { badgeVariants }
