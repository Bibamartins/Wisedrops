// Shared notifications store — localStorage-backed
// Per-user bell/dropdown

export type NotificationKind =
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_rejected'
  | 'consultation_starting'
  | 'anvisa_update'
  | 'prescription_ready'
  | 'docs_uploaded'
  | 'generic'

export interface AppNotification {
  id: string
  userId: string // recipient
  kind: NotificationKind
  title: string
  message: string
  actionUrl?: string
  read: boolean
  createdAt: string // ISO
}

const STORAGE_KEY = 'wisedrops_notifications'
const SEED: AppNotification[] = [
  {
    id: 'notif-seed-1',
    userId: 'dr-carlos-oliveira',
    kind: 'generic',
    title: 'Bem-vindo ao WiseDrops',
    message: 'Voce tem 3 pacientes aguardando retorno.',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
]

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function getAll(): AppNotification[] {
  if (!isBrowser()) return SEED
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED))
      return SEED
    }
    return JSON.parse(raw) as AppNotification[]
  } catch {
    return SEED
  }
}

function save(list: AppNotification[]): void {
  if (!isBrowser()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  // Trigger custom event so open tabs reload
  try {
    window.dispatchEvent(new CustomEvent('wisedrops:notifications-updated'))
  } catch {
    // ignore
  }
}

export function getForUser(userId: string): AppNotification[] {
  return getAll()
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getUnreadCount(userId: string): number {
  return getForUser(userId).filter((n) => !n.read).length
}

export function notify(input: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): AppNotification {
  const notif: AppNotification = {
    ...input,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    read: false,
    createdAt: new Date().toISOString(),
  }
  save([notif, ...getAll()])
  return notif
}

export function markRead(id: string): void {
  save(getAll().map((n) => (n.id === id ? { ...n, read: true } : n)))
}

export function markAllRead(userId: string): void {
  save(getAll().map((n) => (n.userId === userId ? { ...n, read: true } : n)))
}
