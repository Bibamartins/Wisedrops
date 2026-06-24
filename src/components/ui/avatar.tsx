'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------
// Avatar — Radix Avatar com fallback de initials
// Hash consistente: mesmo usuário sempre recebe a mesma cor
// -----------------------------------------------------------------------

const AVATAR_SIZE_CLASSES = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
} as const

type AvatarSize = keyof typeof AVATAR_SIZE_CLASSES

const FALLBACK_COLORS = [
  'bg-brand-100 text-brand-700',
  'bg-sage-100 text-sage-700',
  'bg-info-100 text-info-700',
  'bg-warning-100 text-warning-700',
] as const

/** Gera um index de cor determinístico a partir de uma string (nome/email) */
function colorIndex(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % FALLBACK_COLORS.length
}

/** Extrai até 2 iniciais maiúsculas de um nome completo */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ---------------------------------------------------------------------------
// Primitivos Radix re-exportados para uso avançado
// ---------------------------------------------------------------------------

const AvatarRoot = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
))
AvatarRoot.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full font-medium font-sans',
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// ---------------------------------------------------------------------------
// Avatar — componente de alto nível
// ---------------------------------------------------------------------------

interface AvatarProps {
  /** URL da imagem */
  src?: string
  /** Alt text da imagem */
  alt?: string
  /** Nome completo — usado para gerar iniciais e cor determinística */
  name?: string
  size?: AvatarSize
  className?: string
}

function Avatar({ src, alt, name = '', size = 'md', className }: AvatarProps) {
  const initials = name ? getInitials(name) : '?'
  const fallbackColor = FALLBACK_COLORS[colorIndex(name)]

  return (
    <AvatarRoot
      className={cn(
        AVATAR_SIZE_CLASSES[size],
        className
      )}
    >
      {src && (
        <AvatarImage src={src} alt={alt ?? name} />
      )}
      <AvatarFallback className={fallbackColor}>
        {initials}
      </AvatarFallback>
    </AvatarRoot>
  )
}

export {
  Avatar,
  AvatarRoot,
  AvatarImage,
  AvatarFallback,
}
export type { AvatarSize }
