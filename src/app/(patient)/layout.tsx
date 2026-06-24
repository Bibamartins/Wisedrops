'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  FileText,
  FolderOpen,
  Pill,
  Package,
  ShoppingBag,
  HeartPulse,
  User,
} from 'lucide-react'
import { useAuth } from '@/lib/use-auth'
import { Navbar } from '@/components/shared/navbar'
import { Sidebar, type SidebarItem } from '@/components/shared/sidebar'

// -----------------------------------------------------------------------
// Itens de navegação do portal Paciente
// -----------------------------------------------------------------------

const PATIENT_NAV: SidebarItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/quiz', label: 'Avaliacao', icon: ClipboardList },
  { href: '/consultations', label: 'Consultas', icon: Calendar },
  { href: '/prescriptions', label: 'Receitas', icon: FileText },
  { href: '/documents', label: 'Documentos', icon: FolderOpen },
  { href: '/treatment', label: 'Tratamento', icon: Pill },
  { href: '/products', label: 'Produtos', icon: Package },
  { href: '/orders', label: 'Pedidos', icon: ShoppingBag },
  { href: '/medical-records', label: 'Prontuario', icon: HeartPulse },
  { href: '/profile', label: 'Perfil', icon: User },
]

const PATIENT_SECTIONS = [
  { title: 'Principal', items: PATIENT_NAV.slice(0, 1) },
  { title: 'Saude', items: PATIENT_NAV.slice(1, 5) },
  { title: 'Produtos', items: PATIENT_NAV.slice(5, 8) },
  { title: 'Conta', items: PATIENT_NAV.slice(8) },
]

// -----------------------------------------------------------------------
// Layout
// -----------------------------------------------------------------------

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

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

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center animate-pulse">
            <span className="text-white font-bold">W</span>
          </div>
          <span className="text-surface-500">Carregando...</span>
        </div>
      </div>
    )
  }

  const sidebarFooter = (
    <div className="p-3 rounded-xl bg-brand-50 border border-brand-100">
      <p className="text-sm font-medium text-brand-800 mb-1">Precisa de ajuda?</p>
      <p className="text-xs text-brand-600 mb-3">
        Fale com nosso suporte via WhatsApp
      </p>
      <button className="w-full py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition">
        Abrir WhatsApp
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar
        user={{ id: user.id, name: user.fullName, email: user.email, avatarUrl: user.avatarUrl }}
        portalLabel="Portal Paciente"
        portalColor="bg-brand-50 text-brand-600"
        onLogout={logout}
        onMenuToggle={() => setMenuOpen((v) => !v)}
        menuOpen={menuOpen}
        logoHref="/dashboard"
      />

      <Sidebar
        sections={PATIENT_SECTIONS}
        footer={sidebarFooter}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <main className="pt-16 lg:pl-64 pb-20 lg:pb-8">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
