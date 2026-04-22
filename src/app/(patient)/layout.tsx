'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/use-auth'
import { NotificationsBell } from '@/components/shared/notifications-bell'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/quiz', label: 'Avaliacao', icon: '📋' },
  { href: '/consultations', label: 'Consultas', icon: '🎥' },
  { href: '/prescriptions', label: 'Receitas', icon: '📄' },
  { href: '/treatment', label: 'Tratamento', icon: '💊' },
  { href: '/products', label: 'Produtos', icon: '🛒' },
  { href: '/orders', label: 'Pedidos', icon: '📦' },
  { href: '/medical-records', label: 'Prontuario', icon: '🏥' },
  { href: '/profile', label: 'Perfil', icon: '👤' },
]

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const loaded = !isLoading && user !== null

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    if (user.role !== 'PATIENT') {
      router.push('/')
    }
  }, [isLoading, user, router])

  const handleLogout = async () => {
    await logout()
  }

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  const firstName = user?.fullName?.split(' ')[0] || 'Paciente'

  if (!loaded) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center animate-pulse">
            <span className="text-white font-bold">W</span>
          </div>
          <span className="text-surface-500">Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Top Navigation */}
      <header className="fixed top-0 w-full bg-white border-b border-surface-200 z-50">
        <div className="flex items-center justify-between h-16 px-4 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-heading font-bold text-lg text-surface-900">
              Wise<span className="text-brand-600">Drops</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {user && <NotificationsBell userId={user.id} />}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition"
              >
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-brand-700">{initials}</span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-surface-700">{firstName}</span>
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-surface-200 z-50 overflow-hidden">
                    <div className="p-3 border-b border-surface-100">
                      <p className="text-sm font-semibold text-surface-900">{user?.fullName}</p>
                      <p className="text-xs text-surface-500 truncate">{user?.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
                    >
                      <span>👤</span> Meu Perfil
                    </Link>
                    <Link
                      href="/documents"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
                    >
                      <span>📎</span> Meus Documentos
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-surface-100"
                    >
                      <span>🚪</span> Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-surface-200 flex-col p-4 z-40">
        <nav className="space-y-1 flex-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
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
        <div className="p-4 rounded-xl bg-brand-50 border border-brand-100">
          <p className="text-sm font-medium text-brand-800 mb-1">Precisa de ajuda?</p>
          <p className="text-xs text-brand-600 mb-3">Fale com nosso suporte via WhatsApp</p>
          <button className="w-full py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition">
            Abrir WhatsApp
          </button>
        </div>
      </aside>

      {/* Bottom Navigation - Mobile */}
      <nav className="lg:hidden fixed bottom-0 w-full bg-white border-t border-surface-200 z-50">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-1 px-2 ${
                  isActive ? 'text-brand-600' : 'text-surface-400'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16 lg:pl-64 pb-20 lg:pb-8">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
