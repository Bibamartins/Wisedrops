'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  DollarSign,
} from 'lucide-react'
import { useAuth } from '@/lib/use-auth'
import { Navbar } from '@/components/shared/navbar'
import { Sidebar, type SidebarItem } from '@/components/shared/sidebar'

// -----------------------------------------------------------------------
// Itens de navegação do portal Médico
// -----------------------------------------------------------------------

const DOCTOR_NAV: SidebarItem[] = [
  { href: '/hoje', label: 'Hoje', icon: LayoutDashboard },
  { href: '/pacientes', label: 'Pacientes', icon: Users },
  { href: '/agenda', label: 'Agenda', icon: CalendarClock },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign },
]

const DOCTOR_SECTIONS = [
  { title: '', items: DOCTOR_NAV },
]

// -----------------------------------------------------------------------
// Layout
// -----------------------------------------------------------------------

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

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
        portalLabel="Portal Medico"
        portalColor="bg-blue-50 text-blue-600"
        onLogout={logout}
        onMenuToggle={() => setMenuOpen((v) => !v)}
        menuOpen={menuOpen}
        logoHref="/hoje"
      />

      <Sidebar
        sections={DOCTOR_SECTIONS}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <main className="pt-16 lg:pl-64 pb-8">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
