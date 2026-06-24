'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------
// Select — Radix Select com visual idêntico ao Input v2
// -----------------------------------------------------------------------

const SelectRoot = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    hasError?: boolean
  }
>(({ className, children, hasError, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between rounded border bg-white',
      'px-3 py-2.5 text-sm text-surface-800',
      'border-surface-300 placeholder:text-surface-400',
      'transition-colors duration-150',
      'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15',
      'hover:border-surface-400',
      'disabled:bg-surface-50 disabled:text-surface-400 disabled:cursor-not-allowed disabled:border-surface-200',
      '[&>span]:line-clamp-1',
      hasError &&
        'border-error-500 focus:border-error-500 focus:ring-error-500/15',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown size={16} strokeWidth={1.5} className="text-surface-400 shrink-0" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronUp size={14} strokeWidth={1.5} />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronDown size={14} strokeWidth={1.5} />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 min-w-[8rem] overflow-hidden',
        'rounded-lg border border-surface-200 bg-white shadow-md',
        'animate-fade-in',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-[11px] font-semibold text-surface-500 uppercase tracking-widest',
      className
    )}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center',
      'rounded-md py-2 pl-8 pr-2 text-sm text-surface-700',
      'outline-none',
      'focus:bg-surface-100 focus:text-surface-900',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
      'transition-colors duration-100',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check size={14} strokeWidth={2} className="text-brand-600" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-surface-100', className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

// ---------------------------------------------------------------------------
// Select — componente de alto nível com label + helper + error
// ---------------------------------------------------------------------------

interface SelectFieldProps {
  label?: string
  error?: string
  helper?: string
  required?: boolean
  placeholder?: string
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
  id?: string
}

function SelectField({
  label,
  error,
  helper,
  required,
  placeholder,
  value,
  onValueChange,
  disabled,
  children,
  className,
  id,
}: SelectFieldProps) {
  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  const hasError = Boolean(error)

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-surface-700 leading-none">
          {label}
          {required && (
            <span className="text-error-600 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <SelectRoot value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id={fieldId} hasError={hasError} aria-invalid={hasError}>
          <SelectValue placeholder={placeholder ?? 'Selecione...'} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </SelectRoot>

      {hasError ? (
        <p role="alert" className="text-xs text-error-600 flex items-center gap-1">
          <AlertCircle size={12} strokeWidth={2} aria-hidden="true" />
          {error}
        </p>
      ) : helper ? (
        <p className="text-xs text-surface-500">{helper}</p>
      ) : null}
    </div>
  )
}

export {
  SelectRoot,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  SelectField,
}
