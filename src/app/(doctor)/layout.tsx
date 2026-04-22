'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NotificationsBell } from '@/components/shared/notifications-bell'

const NAV_ITEMS = [
  { href: '/doctor-dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/patients', label: 'Pacientes (CRM)', icon: '👥' },
  { href: '/doctor-consultations', label: 'Consultas', icon: '🎥' },
  { href: '/prescriptions/new', label: 'Nova Receita', icon: '📋' },
  { href: '/doctor-products', label: 'Catalogo de Produtos', icon: '💊' },
  { href: '/schedule', label: 'Agenda', icon: '📅' },
  { href: '/doctor-finances', label: 'Financeiro', icon: '💰' },
]

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Top Nav */}
      <header className="fixed top-0 w-full bg-white border-b border-surface-200 z-50">
        <div className="flex items-center justify-between h-16 px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-heading font-bold text-lg text-surface-900">
              Wise<span className="text-brand-600">Drops</span>
            </span>
            <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-medium">
              Portal Medico
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              <span className="text-sm text-brand-700 font-medium">3 na fila</span>
            </div>
            <NotificationsBell userId="dr-carlos-oliveira" />
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-700">D</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-surface-200 flex-col p-4 z-40">
        <nav className="space-y-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
          <p className="text-xs text-surface-500 mb-1">IA Clinical Support</p>
          <p className="text-sm font-medium text-surface-900 mb-3">
            Assistente de dosagem e interacoes medicamentosas
          </p>
          <button className="w-full py-2 rounded-lg bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 transition">
            Abrir Assistente IA
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pt-16 lg:pl-64 pb-8">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
