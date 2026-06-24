'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // base — inline-flex, font-sans, rounded-md (8px), transition-colors 150ms, disabled opacity-40
  'inline-flex items-center justify-center font-sans font-medium rounded-md ' +
  'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 ' +
  'select-none whitespace-nowrap',
  {
    variants: {
      variant: {
        // Laranja sólido — ação principal única da tela
        primary:
          'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 ' +
          'focus-visible:ring-brand-500 shadow-xs',

        // Sage sólido — ação secundária positiva (confirmar, salvar rascunho)
        secondary:
          'bg-sage-600 text-white hover:bg-sage-700 active:bg-sage-800 ' +
          'focus-visible:ring-sage-500 shadow-xs',

        // Contorno — ação terciária, cancelar, voltar
        outline:
          'border border-surface-300 bg-white text-surface-700 ' +
          'hover:bg-surface-50 hover:border-surface-400 active:bg-surface-100 ' +
          'focus-visible:ring-brand-500',

        // Ghost — ação de baixo peso (editar inline, ver mais)
        ghost:
          'bg-transparent text-surface-600 hover:bg-surface-100 ' +
          'hover:text-surface-800 active:bg-surface-200 ' +
          'focus-visible:ring-surface-400',

        // Destrutivo — excluir, cancelar consulta
        destructive:
          'bg-error-600 text-white hover:bg-error-700 active:bg-error-800 ' +
          'focus-visible:ring-error-500 shadow-xs',

        // Sage outline — variante secundária sem fundo
        sage:
          'border border-sage-300 bg-white text-sage-700 ' +
          'hover:bg-sage-50 hover:border-sage-400 active:bg-sage-100 ' +
          'focus-visible:ring-sage-500',
      },
      size: {
        sm:   'h-8  px-3 text-sm  gap-1.5',
        md:   'h-10 px-4 text-sm  gap-2',
        lg:   'h-12 px-6 text-base gap-2',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading,
      disabled,
      children,
      iconLeft,
      iconRight,
      ...props
    },
    ref
  ) => {
    const iconSize = size === 'lg' ? 20 : 16
    const iconStroke = 2

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading ?? undefined}
        {...props}
      >
        {loading ? (
          <Loader2 size={iconSize} strokeWidth={iconStroke} className="animate-spin shrink-0" />
        ) : iconLeft ? (
          <span className="shrink-0">{iconLeft}</span>
        ) : null}
        {children}
        {!loading && iconRight && (
          <span className="shrink-0">{iconRight}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { buttonVariants }
