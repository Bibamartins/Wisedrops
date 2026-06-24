import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------
// Card — três níveis de superfície (default / elevated / interactive)
// -----------------------------------------------------------------------

const cardVariants = cva(
  'bg-white border border-surface-200 rounded-lg',
  {
    variants: {
      variant: {
        // Superfície base — shadow xs, sem hover
        default: 'shadow-xs',
        // Elevado — shadow-sm em repouso, hover shadow-md; radius xl
        elevated: 'shadow-sm rounded-xl transition-shadow duration-150 hover:shadow-md',
        // Interativo (clicável) — hover border + shadow + micro-scale
        interactive:
          'shadow-xs cursor-pointer transition-all duration-150 ' +
          'hover:border-surface-300 hover:shadow-sm active:scale-[0.995]',
      },
      padding: {
        none:    'p-0',
        sm:      'p-4',
        default: 'p-5',
        lg:      'p-6',
      },
    },
    defaultVariants: { variant: 'default', padding: 'default' },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** @deprecated use padding="none" */
  noPadding?: boolean
}

export function Card({
  className,
  variant,
  padding,
  noPadding,
  children,
  ...props
}: CardProps) {
  // Retrocompatibilidade com prop noPadding legada
  const effectivePadding = noPadding ? 'none' : padding

  return (
    <div
      className={cn(cardVariants({ variant, padding: effectivePadding }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('font-heading font-semibold text-h3 text-surface-900 tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-surface-500 mt-1', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-4 pt-4 border-t border-surface-100 flex items-center', className)}
      {...props}
    >
      {children}
    </div>
  )
}
