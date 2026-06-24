'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type LucideIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------
// Sidebar compartilhada — serve Patient, Doctor e Admin
// Desktop: fixed left panel (hidden em mobile)
// Mobile: drawer overlay controlado externamente via `open` + `onClose`
// -----------------------------------------------------------------------

export interface SidebarItem {
  href: string
  label: string
  /** Componente LucideIcon (ou qualquer ReactNode legado) */
  icon: LucideIcon | React.ComponentType<{ className?: string }>
  badge?: string | number
}

interface SidebarSection {
  title?: string
  items: SidebarItem[]
}

interface SidebarProps {
  sections: SidebarSection[]
  footer?: React.ReactNode
  /** Mobile drawer: aberto ou fechado */
  open?: boolean
  /** Callback para fechar o drawer mobile */
  onClose?: () => void
  className?: string
}

function NavItem({
  item,
  isActive,
  onClick,
}: {
  item: SidebarItem
  isActive: boolean
  onClick?: () => void
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition',
        isActive
          ? 'bg-brand-50 text-brand-700'
          : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        className={cn(
          'w-5 h-5 flex-shrink-0',
          isActive ? 'text-brand-600' : 'text-surface-400'
        )}
        aria-hidden="true"
      />
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && (
        <span
          className={cn(
            'inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-bold',
            isActive
              ? 'bg-brand-200 text-brand-800'
              : 'bg-surface-200 text-surface-600'
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  )
}

function SidebarContent({
  sections,
  footer,
  onItemClick,
}: {
  sections: SidebarSection[]
  footer?: React.ReactNode
  onItemClick?: () => void
}) {
  const pathname = usePathname()

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {sections.map((section, idx) => (
          <div key={idx}>
            {section.title && (
              <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-wider text-surface-400">
                {section.title}
              </p>
            )}
            <nav className="space-y-1" aria-label={section.title}>
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && pathname?.startsWith(item.href + '/'))
                return (
                  <NavItem
                    key={item.href}
                    item={item}
                    isActive={isActive}
                    onClick={onItemClick}
                  />
                )
              })}
            </nav>
          </div>
        ))}
      </div>
      {footer && (
        <div className="p-4 border-t border-surface-200">{footer}</div>
      )}
    </>
  )
}

export function Sidebar({
  sections,
  footer,
  open = false,
  onClose,
  className,
}: SidebarProps) {
  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside
        className={cn(
          'hidden lg:flex fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-surface-200 flex-col z-40',
          className
        )}
        aria-label="Navegação lateral"
      >
        <SidebarContent sections={sections} footer={footer} />
      </aside>

      {/* Mobile: drawer overlay */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside
            className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white flex flex-col z-50 shadow-xl"
            aria-label="Menu de navegação"
            role="dialog"
            aria-modal="true"
          >
            {/* Header do drawer */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-surface-200">
              <span className="font-heading font-bold text-lg text-surface-900">
                Menu
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-surface-500 hover:text-surface-900 hover:bg-surface-100 transition"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent
              sections={sections}
              footer={footer}
              onItemClick={onClose}
            />
          </aside>
        </>
      )}
    </>
  )
}
