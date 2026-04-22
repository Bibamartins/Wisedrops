'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export interface SidebarItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: string | number
}

interface SidebarSection {
  title?: string
  items: SidebarItem[]
}

interface SidebarProps {
  sections: SidebarSection[]
  footer?: React.ReactNode
  className?: string
}

export function Sidebar({ sections, footer, className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'hidden lg:flex fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-surface-200 flex-col z-40',
        className
      )}
    >
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.title && (
              <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-wider text-surface-400">
                {section.title}
              </p>
            )}
            <nav className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition',
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                    )}
                  >
                    <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
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
              })}
            </nav>
          </div>
        ))}
      </div>
      {footer && <div className="p-4 border-t border-surface-200">{footer}</div>}
    </aside>
  )
}
