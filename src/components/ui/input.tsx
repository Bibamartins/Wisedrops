'use client'

import { forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  /** @deprecated use error prop */
  helperText?: string
  helper?: string
  required?: boolean
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  /** Show loading spinner no end */
  loading?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      helper,
      id,
      required,
      startIcon,
      endIcon,
      loading,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const helperContent = helper ?? helperText
    const hasError = Boolean(error)

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-surface-700 leading-none"
          >
            {label}
            {required && (
              <span className="text-error-600 ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {startIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
              {startIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${inputId}-error`
                : helperContent
                ? `${inputId}-helper`
                : undefined
            }
            disabled={disabled ?? loading}
            className={cn(
              'w-full rounded border bg-white px-3 py-2.5 text-sm text-surface-800',
              'border-surface-300 placeholder:text-surface-400',
              'transition-colors duration-150',
              'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15',
              'hover:border-surface-400',
              'disabled:bg-surface-50 disabled:text-surface-400 disabled:cursor-not-allowed disabled:border-surface-200',
              hasError &&
                'border-error-500 focus:border-error-500 focus:ring-error-500/15 hover:border-error-500',
              startIcon && 'pl-9',
              (endIcon || loading) && 'pr-9',
              className
            )}
            {...props}
          />

          {(endIcon || loading) && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
              {loading ? (
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                endIcon
              )}
            </span>
          )}
        </div>

        {/* Helper ou erro */}
        {hasError ? (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-error-600 flex items-center gap-1"
          >
            <AlertCircle size={12} strokeWidth={2} aria-hidden="true" />
            {error}
          </p>
        ) : helperContent ? (
          <p id={`${inputId}-helper`} className="text-xs text-surface-500">
            {helperContent}
          </p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
