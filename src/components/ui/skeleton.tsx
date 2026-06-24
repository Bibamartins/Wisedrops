import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------
// Skeleton — base animate-pulse bg-surface-100 rounded
// -----------------------------------------------------------------------

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  /** Forma circular (avatar) */
  circle?: boolean
}

export function Skeleton({ className, width, height, circle, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-surface-100 animate-pulse',
        circle ? 'rounded-full' : 'rounded',
        className
      )}
      style={{
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// Compostos prontos para uso
// ---------------------------------------------------------------------------

/** Skeleton de linha de texto */
export function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{
            width: i === lines - 1 && lines > 1 ? '60%' : `${80 + (i % 2) * 15}%`,
          }}
        />
      ))}
    </div>
  )
}

/** Skeleton de card completo (label + valor + comparação) */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white border border-surface-200 rounded-lg p-5 space-y-3', className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

/** Skeleton de row de tabela */
export function SkeletonTableRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex gap-4 py-3 px-4 border-b border-surface-100">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4 flex-1"
          style={{ maxWidth: `${60 + (i % 3) * 15}%` }}
        />
      ))}
    </div>
  )
}
