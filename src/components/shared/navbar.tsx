'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LogOut, User, FileText, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from './logo'
import { Avatar } from '@/components/ui/avatar'
import { NotificationsBell } from './notifications-bell'

// -----------------------------------------------------------------------
// Navbar compartilhada — serve Patient, Doctor e Admin
// -----------------------------------------------------------------------

interface NavbarUser {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
}

interface NavbarProps {
  /** Usuário autenticado — exibido no avatar + dropdown */
  user?: NavbarUser
  /** Label do portal (ex: "Portal Médico") */
  portalLabel?: string
  /** Cor de fundo + texto do badge do portal */
  portalColor?: string
  /** Callback de logout */
  onLogout?: () => void
  /** Callback para abrir/fechar sidebar em mobile (hambúrguer) */
  onMenuToggle?: () => void
  /** Se o menu mobile está aberto (controla ícone do hambúrguer) */
  menuOpen?: boolean
  /** href para o logo — padrão é o dashboard do portal */
  logoHref?: string
  className?: string
}

export function Navbar({
  user,
  portalLabel,
  portalColor = 'bg-surface-100 text-surface-600',
  onLogout,
  onMenuToggle,
  menuOpen = false,
  logoHref = '/',
  className,
}: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U'

  const firstName = user?.name?.split(' ')[0] ?? 'Usuário'

  return (
    <header
      className={cn(
        'fixed top-0 w-full bg-white border-b border-surface-200 z-50',
        className
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Esquerda: hambúrguer (mobile) + logo + badge portal */}
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <button
              type="button"
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg text-surface-500 hover:text-surface-900 hover:bg-surface-100 transition"
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <Logo href={logoHref} size="md" />
          {portalLabel && (
            <span
              className={cn(
                'hidden sm:inline px-2 py-0.5 rounded-md text-xs font-medium',
                portalColor
              )}
            >
              {portalLabel}
            </span>
          )}
        </div>

        {/* Direita: notificações + avatar + dropdown */}
        <div className="flex items-center gap-3">
          {user && <NotificationsBell userId={user.id} />}

          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 hover:opacity-80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg p-1"
                aria-label="Menu do usuário"
                aria-expanded={dropdownOpen}
              >
                <Avatar name={user.name} src={user.avatarUrl ?? undefined} size="sm" />
                <span className="hidden sm:block text-sm font-medium text-surface-700">
                  {firstName}
                </span>
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                    aria-hidden="true"
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-surface-200 z-50 overflow-hidden"
                  >
                    {/* Info do usuário */}
                    <div className="p-3 border-b border-surface-100">
                      <p className="text-sm font-semibold text-surface-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-surface-500 truncate">{user.email}</p>
                    </div>

                    {/* Links */}
                    <Link
                      href="/profile"
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 transition"
                    >
                      <User className="w-4 h-4" aria-hidden="true" />
                      Meu Perfil
                    </Link>
                    <Link
                      href="/documents"
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 transition"
                    >
                      <FileText className="w-4 h-4" aria-hidden="true" />
                      Meus Documentos
                    </Link>

                    {/* Logout */}
                    {onLogout && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setDropdownOpen(false)
                          onLogout()
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-surface-100 transition"
                      >
                        <LogOut className="w-4 h-4" aria-hidden="true" />
                        Sair
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
