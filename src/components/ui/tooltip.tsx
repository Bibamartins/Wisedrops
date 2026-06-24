'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------
// Tooltip — Radix Tooltip
// bg-surface-900 text-white text-small, delay 300ms, fade-in
// -----------------------------------------------------------------------

const TooltipProvider = TooltipPrimitive.Provider
const TooltipRoot = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger
const TooltipPortal = TooltipPrimitive.Portal

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 overflow-hidden rounded-md px-2.5 py-1.5',
        'bg-surface-900 text-white text-xs font-medium',
        'shadow-lg',
        // Radix injeta data-state=delayed-open/instant-open/closed
        'animate-fade-in',
        'select-none',
        className
      )}
      {...props}
    >
      {props.children}
      <TooltipPrimitive.Arrow className="fill-surface-900" width={10} height={5} />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// ---------------------------------------------------------------------------
// Tooltip — componente de alto nível (wraps Provider + Root)
// ---------------------------------------------------------------------------

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  /** Delay em ms (default 300ms conforme design system) */
  delayDuration?: number
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  className?: string
}

function Tooltip({
  content,
  children,
  delayDuration = 300,
  side = 'top',
  align = 'center',
  className,
}: TooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipRoot>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} align={align} className={className}>
          {content}
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  )
}

export {
  Tooltip,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipPortal,
}
