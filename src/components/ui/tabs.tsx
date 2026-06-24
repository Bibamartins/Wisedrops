'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------
// Tabs — migrado para Radix Tabs
// Mantém API legada (tabs array + defaultTab + onChange) via wrapper Tabs
// PLUS: exporta primitivos Radix para uso avançado
// -----------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Primitivos Radix (re-exportados)
// ---------------------------------------------------------------------------

const RadixTabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1 p-1 rounded-xl bg-surface-100',
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base — pill premium
      'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
      'transition-all duration-150 select-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
      // Inativo
      'text-surface-500 hover:text-surface-700',
      // Ativo — bg branco + sombra xs (pill highlight)
      'data-[state=active]:bg-white data-[state=active]:text-surface-900 data-[state=active]:shadow-xs',
      // Disabled
      'disabled:pointer-events-none disabled:opacity-40',
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'animate-fade-in focus-visible:outline-none',
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

// ---------------------------------------------------------------------------
// Wrapper de alto nível — mantém API legada
// ---------------------------------------------------------------------------

interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (tabId: string) => void
  className?: string
}

function Tabs({ tabs, defaultTab, onChange, className }: TabsProps) {
  return (
    <RadixTabs
      defaultValue={defaultTab ?? tabs[0]?.id}
      onValueChange={onChange}
    >
      <TabsList className={className}>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center justify-center h-5 min-w-[20px] px-1.5',
                  'rounded-full text-[10px] font-bold',
                  'bg-surface-200 text-surface-500',
                  // Override quando ativo via CSS adjacente (Radix adiciona data attr no pai)
                  'group-data-[state=active]:bg-brand-100 group-data-[state=active]:text-brand-700'
                )}
              >
                {tab.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </RadixTabs>
  )
}

// TabContent legado — mantido para retrocompatibilidade
interface TabContentProps {
  active: boolean
  children: React.ReactNode
  className?: string
}

function TabContent({ active, children, className }: TabContentProps) {
  if (!active) return null
  return <div className={cn('animate-fade-in', className)}>{children}</div>
}

export {
  Tabs,
  TabContent,
  RadixTabs,
  TabsList,
  TabsTrigger,
  TabsContent,
}
