'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------
// Logo — componente canônico do WiseDrops
// Variants: default (W + "WiseDrops"), compact (só W), dark (para video room)
// Sizes: sm | md | lg
// -----------------------------------------------------------------------

const SIZE_MAP = {
  sm: {
    badge: 'w-7 h-7 rounded-lg text-xs',
    text: 'text-base',
  },
  md: {
    badge: 'w-8 h-8 rounded-lg text-sm',
    text: 'text-lg',
  },
  lg: {
    badge: 'w-10 h-10 rounded-xl text-base',
    text: 'text-2xl',
  },
} as const

type LogoSize = keyof typeof SIZE_MAP
type LogoVariant = 'default' | 'compact' | 'dark'

interface LogoProps {
  size?: LogoSize
  variant?: LogoVariant
  href?: string
  className?: string
}

function LogoBadge({ size, variant }: { size: LogoSize; variant: LogoVariant }) {
  return (
    <div
      className={cn(
        SIZE_MAP[size].badge,
        'flex items-center justify-center font-bold text-white flex-shrink-0',
        variant === 'dark' ? 'bg-brand-600 opacity-90' : 'bg-brand-600'
      )}
      aria-hidden="true"
    >
      W
    </div>
  )
}

export function Logo({
  size = 'md',
  variant = 'default',
  href = '/',
  className,
}: LogoProps) {
  const inner = (
    <span
      className={cn('flex items-center gap-2', className)}
      aria-label="WiseDrops"
    >
      <LogoBadge size={size} variant={variant} />
      {variant !== 'compact' && (
        <span
          className={cn(
            'font-heading font-bold leading-none',
            SIZE_MAP[size].text,
            variant === 'dark' ? 'text-white' : 'text-surface-900'
          )}
        >
          Wise
          <span className={variant === 'dark' ? 'text-brand-400' : 'text-brand-600'}>
            Drops
          </span>
        </span>
      )}
    </span>
  )

  if (!href) return inner

  return (
    <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg">
      {inner}
    </Link>
  )
}
