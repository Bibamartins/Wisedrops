'use client'

import { useState } from 'react'
import {
  Inbox,
  ShoppingBag,
  Package,
  DollarSign,
  UsersRound,
} from 'lucide-react'
import { useAuth } from '@/lib/use-auth'
import { Navbar } from '@/components/shared/navbar'
import { Sidebar, type SidebarItem } from '@/components/shared/sidebar'

// -----------------------------------------------------------------------
// Itens de navegação do portal Admin
// -----------------------------------------------------------------------

const ADMIN_NAV: SidebarItem[] = [
  { href: '/operacional', label: 'Operacional', icon: Inbox, badge: 15 },
  { href: '/pedidos-admin', label: 'Pedidos', icon: ShoppingBag },
  { href: '/catalogo', label: 'Catalogo', icon: Package },
  { href: '/financeiro-admin', label: 'Financeiro', icon: DollarSign },
  { href: '/pessoas', label: 'Pessoas', icon: UsersRound, badge: 3 },
]

const ADMIN_SECTIONS = [
  { title: '', items: ADMIN_NAV },
]

// -----------------------------------------------------------------------
// Layout
// -----------------------------------------------------------------------

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const sidebarFooter = (
    <div className="p-3 rounded-xl bg-red-50 border border-red-100">
      <p className="text-xs font-medium text-red-800 mb-1">Ambiente de Producao</p>
      <p className="text-[10px] text-red-600">v1.0.0 — Todas as acoes sao auditadas</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar
        user={
          user
            ? {
                id: user.id,
                name: user.fullName,
                email: user.email,
                avatarUrl: user.avatarUrl,
              }
            : undefined
        }
        portalLabel="Painel Admin"
        portalColor="bg-red-50 text-red-600"
        onLogout={logout}
        onMenuToggle={() => setMenuOpen((v) => !v)}
        menuOpen={menuOpen}
        logoHref="/operacional"
      />

      <Sidebar
        sections={ADMIN_SECTIONS}
        footer={sidebarFooter}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <main className="pt-16 lg:pl-64 pb-8">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
