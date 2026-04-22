'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getForUser, markAllRead, markRead, type AppNotification } from '@/lib/notifications-store'

interface NotificationsBellProps {
  userId: string
}

const KIND_LABEL: Record<AppNotification['kind'], { label: string; bg: string }> = {
  booking_request: { label: 'Nova consulta', bg: 'bg-amber-100 text-amber-700' },
  booking_confirmed: { label: 'Consulta confirmada', bg: 'bg-green-100 text-green-700' },
  booking_rejected: { label: 'Consulta recusada', bg: 'bg-red-100 text-red-700' },
  consultation_starting: { label: 'Comecando agora', bg: 'bg-blue-100 text-blue-700' },
  anvisa_update: { label: 'ANVISA', bg: 'bg-purple-100 text-purple-700' },
  prescription_ready: { label: 'Receita', bg: 'bg-brand-100 text-brand-700' },
  docs_uploaded: { label: 'Documentos', bg: 'bg-sky-100 text-sky-700' },
  generic: { label: 'Aviso', bg: 'bg-surface-100 text-surface-600' },
}

function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.round(ms / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `ha ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `ha ${h}h`
  const d = Math.round(h / 24)
  return `ha ${d}d`
}

export function NotificationsBell({ userId }: NotificationsBellProps) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])

  const refresh = () => setItems(getForUser(userId))

  useEffect(() => {
    refresh()
    const onUpdate = () => refresh()
    window.addEventListener('wisedrops:notifications-updated', onUpdate)
    window.addEventListener('storage', onUpdate)
    // Soft poll to catch cross-tab updates that don't fire storage event reliably
    const interval = setInterval(refresh, 4000)
    return () => {
      window.removeEventListener('wisedrops:notifications-updated', onUpdate)
      window.removeEventListener('storage', onUpdate)
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const unread = items.filter((i) => !i.read).length

  const handleClickItem = (id: string) => {
    markRead(id)
    refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-surface-500 hover:text-surface-900 transition"
        aria-label="Notificacoes"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-surface-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
              <p className="font-heading font-semibold text-surface-900">Notificacoes</p>
              {unread > 0 && (
                <button
                  onClick={() => {
                    markAllRead(userId)
                    refresh()
                  }}
                  className="text-xs text-brand-600 hover:underline"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-surface-500">Sem notificacoes</p>
                </div>
              ) : (
                items.slice(0, 12).map((n) => {
                  const meta = KIND_LABEL[n.kind]
                  const body = (
                    <div
                      className={`px-4 py-3 border-b border-surface-100 last:border-0 hover:bg-surface-50 transition cursor-pointer ${
                        !n.read ? 'bg-brand-50/40' : ''
                      }`}
                      onClick={() => handleClickItem(n.id)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${meta.bg}`}>
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-surface-400 flex-shrink-0">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-surface-900 leading-tight">{n.title}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{n.message}</p>
                    </div>
                  )
                  if (n.actionUrl) {
                    return (
                      <Link key={n.id} href={n.actionUrl} onClick={() => setOpen(false)}>
                        {body}
                      </Link>
                    )
                  }
                  return <div key={n.id}>{body}</div>
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
