'use client'

import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------
// Toast — Radix Toast
// Viewport bottom-right, animate-toast-in, auto-dismiss 5s
// -----------------------------------------------------------------------

const ToastProvider = ToastPrimitive.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-0 right-0 z-[100] flex max-h-screen flex-col-reverse',
      'p-4 gap-2 sm:bottom-4 sm:right-4',
      'w-full sm:max-w-sm',
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitive.Viewport.displayName

// ---------------------------------------------------------------------------
// Variantes de toast
// ---------------------------------------------------------------------------

const toastVariants = cva(
  // base
  'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden ' +
  'rounded-lg border bg-white p-4 shadow-xl ' +
  'transition-all duration-300 ' +
  'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] ' +
  'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none ' +
  'data-[state=open]:animate-[toast-in_300ms_cubic-bezier(0.16,1,0.3,1)] ' +
  'data-[state=closed]:animate-fade-in data-[state=closed]:opacity-0',
  {
    variants: {
      variant: {
        default: 'border-surface-200',
        success: 'border-success-100 bg-success-50',
        error:   'border-error-100   bg-error-50',
        warning: 'border-warning-100 bg-warning-50',
        info:    'border-info-100    bg-info-50',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

const TOAST_ICONS: Record<string, React.ReactNode> = {
  success: <CheckCircle2 size={18} strokeWidth={2} className="text-success-600 shrink-0 mt-0.5" />,
  error:   <AlertCircle  size={18} strokeWidth={2} className="text-error-600   shrink-0 mt-0.5" />,
  warning: <AlertTriangle size={18} strokeWidth={2} className="text-warning-600 shrink-0 mt-0.5" />,
  info:    <Info          size={18} strokeWidth={2} className="text-info-600    shrink-0 mt-0.5" />,
}

type ToastProps = React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> &
  VariantProps<typeof toastVariants>

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  ToastProps
>(({ className, variant, children, ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    duration={5000}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  >
    {variant && variant !== 'default' && TOAST_ICONS[variant]}
    <div className="flex-1 min-w-0">{children}</div>
  </ToastPrimitive.Root>
))
Toast.displayName = ToastPrimitive.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border px-3',
      'text-xs font-medium transition-colors duration-150',
      'border-surface-300 text-surface-700 hover:bg-surface-50',
      'focus:outline-none focus:ring-2 focus:ring-brand-500',
      'disabled:pointer-events-none disabled:opacity-40',
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitive.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md p-1',
      'text-surface-400 hover:text-surface-700 transition-colors duration-150',
      'opacity-0 group-hover:opacity-100',
      'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-500',
      className
    )}
    aria-label="Fechar notificação"
    toast-close=""
    {...props}
  >
    <X size={14} strokeWidth={2} />
  </ToastPrimitive.Close>
))
ToastClose.displayName = ToastPrimitive.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn('text-sm font-semibold text-surface-900', className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitive.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn('text-xs text-surface-600 mt-0.5', className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitive.Description.displayName

// ---------------------------------------------------------------------------
// Toaster — viewport container (montar uma vez no layout root)
// ---------------------------------------------------------------------------

function Toaster() {
  return (
    <ToastProvider swipeDirection="right">
      <ToastViewport />
    </ToastProvider>
  )
}

export {
  Toaster,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastAction,
  ToastClose,
  ToastTitle,
  ToastDescription,
  toastVariants,
}
export type { ToastProps }
