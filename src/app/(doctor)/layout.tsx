'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NotificationsBell } from '@/components/shared/notifications-bell'
import { useAuth } from '@/lib/use-auth'

const NAV_ITEMS = [
  { href: '/doctor-dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/patients', label: 'Pacientes (CRM)', icon: '👥' },
  { href: '/doctor-consultations', label: 'Consultas', icon: '🎥' },
  { href: '/prescriptions/new', label: 'Nova Receita', icon: '📋' },
  { href: '/doctor-products', label: 'Catálogo de Produtos', icon: '💊' },
  { href: '/schedule', label: 'Agenda', icon: '📅' },
  { href: '/doctor-finances', label: 'Financeiro', icon: '💰' },
]

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const initial = (user?.fullName ?? 'M').charAt(0).toUpperCase()

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
              Portal Médico
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user && <NotificationsBell userId={user.id} />}
            <div
              className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"
              title={user?.fullName ?? ''}
            >
              <span className="text-sm font-medium text-blue-700">{initial}</span>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="text-xs text-surface-500 hover:text-surface-700 transition"
              title="Sair"
            >
              Sair
            </button>
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
      </aside>

      {/* Main Content */}
      <main className="pt-16 lg:pl-64 pb-8">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
