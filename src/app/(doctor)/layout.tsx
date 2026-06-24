'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  CalendarClock,
  Package,
  DollarSign,
} from 'lucide-react'
import { useAuth } from '@/lib/use-auth'
import { Navbar } from '@/components/shared/navbar'
import { Sidebar, type SidebarItem } from '@/components/shared/sidebar'

// -----------------------------------------------------------------------
// Itens de navegação do portal Médico
// -----------------------------------------------------------------------

const DOCTOR_NAV: SidebarItem[] = [
  { href: '/doctor-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patients', label: 'Pacientes', icon: Users },
  { href: '/doctor-consultations', label: 'Consultas', icon: Calendar },
  { href: '/prescriptions/new', label: 'Nova Receita', icon: FileText },
  { href: '/schedule', label: 'Agenda', icon: CalendarClock },
  { href: '/doctor-products', label: 'Produtos', icon: Package },
  { href: '/doctor-finances', label: 'Financeiro', icon: DollarSign },
]

const DOCTOR_SECTIONS = [
  { title: 'Principal', items: DOCTOR_NAV.slice(0, 1) },
  { title: 'Clinica', items: DOCTOR_NAV.slice(1, 5) },
  { title: 'Gestao', items: DOCTOR_NAV.slice(5) },
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
        logoHref="/doctor-dashboard"
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
