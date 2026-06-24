'use client'

/**
 * Logo — wordmark editorial WiseDrops
 *
 * v2 (PR de recalibração premium): saiu do placeholder "W em caixa laranja"
 * (que parecia projeto em desenvolvimento) e virou WORDMARK puramente
 * tipográfico — Sora 800, letter-spacing negativo, "Drops" em brand-700
 * como acento sutil. Premium é o que você TIRA.
 *
 * Variants:
 *   default — "WiseDrops" wordmark
 *   compact — "WD" wordmark compacto (usar em navbars mobile / favicon-like)
 *   dark    — wordmark sobre fundo escuro (video room, hero invertido)
 *
 * Sizes: sm | md | lg | xl
 */

import Link from 'next/link'
import { cn } from '@/lib/utils'

const SIZE_MAP = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-3xl md:text-4xl',
} as const

type LogoSize = keyof typeof SIZE_MAP
type LogoVariant = 'default' | 'compact' | 'dark'

interface LogoProps {
  size?: LogoSize
  variant?: LogoVariant
  href?: string
  className?: string
}

export function Logo({
  size = 'md',
  variant = 'default',
  href = '/',
  className,
}: LogoProps) {
  const isDark = variant === 'dark'

  const text = (
    <span
      className={cn(
        'font-heading font-extrabold leading-none tracking-[-0.04em] inline-flex items-baseline',
        SIZE_MAP[size],
        isDark ? 'text-white' : 'text-surface-900',
        className,
      )}
      aria-label="WiseDrops"
    >
      {variant === 'compact' ? (
        <>
          W<span className={isDark ? 'text-brand-400' : 'text-brand-700'}>D</span>
        </>
      ) : (
        <>
          Wise<span className={isDark ? 'text-brand-400' : 'text-brand-700'}>Drops</span>
        </>
      )}
    </span>
  )

  if (!href) return text

  return (
    <Link
      href={href}
      className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-sm"
    >
      {text}
    </Link>
  )
}
