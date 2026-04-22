'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn, formatDate } from '@/lib/utils'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/lib/use-auth'

// ============================================================
// Types
// ============================================================

interface ConsultationListItem {
  id: string
  type: 'VIDEO' | 'CHAT' | 'IN_PERSON'
  status: ConsultationStatus
  scheduledAt: string
  startedAt: string | null
  endedAt: string | null
  durationMinutes: number | null
  chiefComplaint: string | null
  priceCents: number
  rating: number | null
  doctor: {
    id: string
    specialty: string[]
    user: {
      fullName: string
      avatarUrl: string | null
    }
  }
}

type ConsultationStatus =
  | 'SCHEDULED'
  | 'WAITING_ROOM'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

type TabValue = 'upcoming' | 'past'

const STATUS_CONFIG: Record<
  ConsultationStatus,
  { label: string; color: string; bgColor: string }
> = {
  SCHEDULED: { label: 'Agendada', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  WAITING_ROOM: { label: 'Sala de espera', color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200' },
  IN_PROGRESS: { label: 'Em andamento', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
  COMPLETED: { label: 'Concluida', color: 'text-surface-600', bgColor: 'bg-surface-50 border-surface-200' },
  CANCELLED: { label: 'Cancelada', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
  NO_SHOW: { label: 'Nao compareceu', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' },
}

// ============================================================
// Consultation Card
// ============================================================

interface ConsultationCardProps {
  consultation: ConsultationListItem
  onCancel: (id: string) => void
  isCancelling: boolean
}

function ConsultationCard({ consultation, onCancel, isCancelling }: ConsultationCardProps) {
  const router = useRouter()
  const status = STATUS_CONFIG[consultation.status]
  const scheduledDate = new Date(consultation.scheduledAt)
  const isUpcoming = consultation.status === 'SCHEDULED' || consultation.status === 'WAITING_ROOM'
  const isInProgress = consultation.status === 'IN_PROGRESS'
  const canJoinVideo =
    consultation.type === 'VIDEO' &&
    (isUpcoming || isInProgress) &&
    // Allow joining 10 minutes before
    scheduledDate.getTime() - Date.now() < 10 * 60 * 1000

  const canCancel =
    consultation.status === 'SCHEDULED' &&
    scheduledDate.getTime() - Date.now() > 0

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-4 hover:shadow-md transition">
      <div className="flex items-start gap-4">
        {/* Doctor avatar */}
        <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
          {consultation.doctor.user.avatarUrl ? (
            <img
              src={consultation.doctor.user.avatarUrl}
              alt={consultation.doctor.user.fullName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <span className="text-lg font-bold text-brand-600">
              {consultation.doctor.user.fullName.charAt(0)}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-surface-900">
                Dr(a). {consultation.doctor.user.fullName}
              </h3>
              <p className="text-xs text-surface-500">
                {consultation.doctor.specialty.join(', ')}
              </p>
            </div>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-medium border flex-shrink-0',
                status.bgColor,
                status.color
              )}
            >
              {status.label}
            </span>
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-4 mt-2 text-xs text-surface-600">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              {formatDate(consultation.scheduledAt)}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {consultation.type === 'VIDEO' && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Video
              </span>
            )}
          </div>

          {/* Chief complaint */}
          {consultation.chiefComplaint && (
            <p className="text-xs text-surface-500 mt-2 line-clamp-1">
              {consultation.chiefComplaint}
            </p>
          )}

          {/* Duration (for completed) */}
          {consultation.status === 'COMPLETED' && consultation.durationMinutes && (
            <p className="text-xs text-surface-400 mt-1">
              Duracao: {consultation.durationMinutes} min
            </p>
          )}

          {/* Rating (for completed) */}
          {consultation.status === 'COMPLETED' && consultation.rating && (
            <div className="flex items-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={cn(
                    'w-3 h-3',
                    star <= consultation.rating! ? 'text-yellow-400' : 'text-surface-200'
                  )}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {canJoinVideo && (
              <button
                onClick={() => router.push(`/consultations/${consultation.id}/video`)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Entrar na consulta
              </button>
            )}

            {/* Post-consultation: Upload documents CTA */}
            {consultation.status === 'COMPLETED' && (
              <Link
                href={`/documents?consultationId=${consultation.id}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-500 text-white text-xs font-medium hover:bg-accent-600 transition"
              >
                📎 Enviar documentos
              </Link>
            )}

            <Link
              href={`/consultations/${consultation.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-surface-200 text-xs font-medium text-surface-700 hover:bg-surface-50 transition"
            >
              Ver detalhes
            </Link>

            {canCancel && (
              <button
                onClick={() => onCancel(consultation.id)}
                disabled={isCancelling}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-40"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Empty State
// ============================================================

function EmptyState({ tab }: { tab: TabValue }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto rounded-full bg-surface-100 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-surface-700 mb-1">
        {tab === 'upcoming' ? 'Nenhuma consulta agendada' : 'Nenhuma consulta anterior'}
      </h3>
      <p className="text-xs text-surface-400 mb-6 max-w-sm mx-auto">
        {tab === 'upcoming'
          ? 'Agende uma consulta com um de nossos medicos especialistas em cannabis medicinal.'
          : 'Suas consultas concluidas aparecerao aqui.'}
      </p>
      {tab === 'upcoming' && (
        <Link
          href="/consultations/book"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agendar consulta
        </Link>
      )}
    </div>
  )
}

// ============================================================
// Main Page
// ============================================================

export default function ConsultationsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('upcoming')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Fetch upcoming + past separately so tab switch is instant
  const upcomingQuery = trpc.consultation.listForPatient.useQuery(
    { page: 1, limit: 50 },
    { refetchInterval: 15000 }
  )

  const cancelMutation = trpc.consultation.cancel.useMutation({
    onSuccess: () => upcomingQuery.refetch(),
  })

  // Split results into tabs client-side
  const { upcomingList, pastList } = useMemo(() => {
    const all = upcomingQuery.data?.consultations ?? []
    const mapped: ConsultationListItem[] = all.map((c) => ({
      id: c.id,
      type: c.type as ConsultationListItem['type'],
      status: c.status as ConsultationStatus,
      scheduledAt: (c.scheduledAt instanceof Date ? c.scheduledAt : new Date(c.scheduledAt)).toISOString(),
      startedAt: c.startedAt ? (c.startedAt instanceof Date ? c.startedAt.toISOString() : c.startedAt) : null,
      endedAt: c.endedAt ? (c.endedAt instanceof Date ? c.endedAt.toISOString() : c.endedAt) : null,
      durationMinutes: c.durationMinutes ?? null,
      chiefComplaint: c.chiefComplaint ?? null,
      priceCents: c.priceCents ?? 0,
      rating: c.rating ?? null,
      doctor: {
        id: c.doctorId,
        specialty: c.doctor.specialty ?? [],
        user: {
          fullName: c.doctor.user.fullName,
          avatarUrl: c.doctor.user.avatarUrl ?? null,
        },
      },
    }))

    const upcomingList = mapped
      .filter((c) =>
        c.status === 'SCHEDULED' ||
        c.status === 'WAITING_ROOM' ||
        c.status === 'IN_PROGRESS'
      )
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

    const pastList = mapped
      .filter((c) =>
        c.status === 'COMPLETED' ||
        c.status === 'CANCELLED' ||
        c.status === 'NO_SHOW'
      )
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())

    return { upcomingList, pastList }
  }, [upcomingQuery.data])

  const consultations = activeTab === 'upcoming' ? upcomingList : pastList
  const loading = upcomingQuery.isLoading
  const totalPages = 1

  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab)
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta consulta?')) return
    setCancellingId(id)
    try {
      await cancelMutation.mutateAsync({ id })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao cancelar consulta.'
      alert(msg)
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-surface-900">
            Minhas Consultas
          </h1>
          <p className="text-sm text-surface-500">
            Gerencie suas consultas e agendamentos
          </p>
        </div>
        <Link
          href="/consultations/book"
          className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nova consulta
        </Link>
      </div>

      {/* Mobile new consultation button */}
      <Link
        href="/consultations/book"
        className="sm:hidden flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Agendar nova consulta
      </Link>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface-100 rounded-xl mb-6 w-fit">
        <button
          onClick={() => handleTabChange('upcoming')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition',
            activeTab === 'upcoming'
              ? 'bg-white text-surface-900 shadow-sm'
              : 'text-surface-500 hover:text-surface-700'
          )}
        >
          Proximas
        </button>
        <button
          onClick={() => handleTabChange('past')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition',
            activeTab === 'past'
              ? 'bg-white text-surface-900 shadow-sm'
              : 'text-surface-500 hover:text-surface-700'
          )}
        >
          Anteriores
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
        </div>
      ) : consultations.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <>
          <div className="space-y-3">
            {consultations.map((consultation) => (
              <ConsultationCard
                key={consultation.id}
                consultation={consultation}
                onCancel={handleCancel}
                isCancelling={cancellingId === consultation.id}
              />
            ))}
          </div>

          {/* Pagination removed — using in-memory store */}
          {totalPages > 1 && null}
        </>
      )}
    </div>
  )
}
