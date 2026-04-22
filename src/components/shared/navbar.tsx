'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { NotificationsBell } from './notifications-bell'

interface NavbarProps {
  portalLabel?: string
  portalColor?: string
  userName?: string
  userInitial?: string
  avatarColor?: string
  notificationCount?: number
  notificationsUserId?: string
  rightContent?: React.ReactNode
  className?: string
}

export function Navbar({
  portalLabel,
  portalColor = 'bg-blue-50 text-blue-600',
  userName,
  userInitial = 'U',
  avatarColor = 'bg-brand-100 text-brand-700',
  notificationCount = 0,
  notificationsUserId,
  rightContent,
  className,
}: NavbarProps) {
  return (
    <header className={cn('fixed top-0 w-full bg-white border-b border-surface-200 z-50', className)}>
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-heading font-bold text-lg text-surface-900">
              Wise<span className="text-brand-600">Drops</span>
            </span>
          </Link>
          {portalLabel && (
            <span className={cn('hidden sm:inline px-2 py-0.5 rounded-md text-xs font-medium', portalColor)}>
              {portalLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {rightContent}
          {notificationsUserId ? (
            <NotificationsBell userId={notificationsUserId} />
          ) : (
            <button className="relative p-2 text-surface-500 hover:text-surface-900 transition" aria-label="Notificacoes">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', avatarColor)}>
              <span className="text-sm font-medium">{userInitial}</span>
            </div>
            {userName && (
              <span className="hidden md:inline text-sm font-medium text-surface-700">{userName}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
