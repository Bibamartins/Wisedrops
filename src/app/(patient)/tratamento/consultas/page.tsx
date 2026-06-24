'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Clock,
  Video,
  Plus,
  Paperclip,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type ConsultationStatus =
  | 'SCHEDULED'
  | 'WAITING_ROOM'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

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

type TabValue = 'upcoming' | 'past'

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_BADGE_VARIANT: Record<
  ConsultationStatus,
  React.ComponentProps<typeof Badge>['variant']
> = {
  SCHEDULED:    'scheduled',
  WAITING_ROOM: 'warning',
  IN_PROGRESS:  'info',
  COMPLETED:    'completed',
  CANCELLED:    'cancelled',
  NO_SHOW:      'neutral',
}

const STATUS_LABEL: Record<ConsultationStatus, string> = {
  SCHEDULED:    'Agendada',
  WAITING_ROOM: 'Sala de espera',
  IN_PROGRESS:  'Em andamento',
  COMPLETED:    'Concluída',
  CANCELLED:    'Cancelada',
  NO_SHOW:      'Não compareceu',
}

// ---------------------------------------------------------------------------
// Skeleton de card de consulta
// ---------------------------------------------------------------------------

function ConsultationCardSkeleton() {
  return (
    <Card variant="default" padding="default">
      <div className="flex items-start gap-4">
        <Skeleton circle width={48} height={48} className="shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-20 rounded-sm" />
          </div>
          <Skeleton className="h-3 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Card de consulta
// ---------------------------------------------------------------------------

interface ConsultationCardProps {
  consultation: ConsultationListItem
  onCancel: (id: string) => void
  isCancelling: boolean
}

function ConsultationCard({ consultation, onCancel, isCancelling }: ConsultationCardProps) {
  const router = useRouter()
  const scheduledDate = new Date(consultation.scheduledAt)
  const isUpcoming =
    consultation.status === 'SCHEDULED' || consultation.status === 'WAITING_ROOM'
  const isInProgress = consultation.status === 'IN_PROGRESS'

  const canJoinVideo =
    consultation.type === 'VIDEO' &&
    (isUpcoming || isInProgress) &&
    scheduledDate.getTime() - Date.now() < 10 * 60 * 1000

  const canCancel =
    consultation.status === 'SCHEDULED' && scheduledDate.getTime() - Date.now() > 0

  const badgeVariant = STATUS_BADGE_VARIANT[consultation.status]
  const badgeLabel = STATUS_LABEL[consultation.status]

  return (
    <Card variant="default" padding="default">
      <div className="flex items-start gap-4">
        {/* Avatar do médico */}
        <Avatar
          src={consultation.doctor.user.avatarUrl ?? undefined}
          name={consultation.doctor.user.fullName}
          size="lg"
          className="shrink-0"
        />

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {/* Nome + status */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-surface-900 truncate">
                Dr(a). {consultation.doctor.user.fullName}
              </h3>
              <p className="text-xs text-surface-500 mt-0.5">
                {consultation.doctor.specialty.join(', ')}
              </p>
            </div>
            <Badge variant={badgeVariant} dot className="shrink-0">
              {badgeLabel}
            </Badge>
          </div>

          {/* Data, hora e tipo */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-surface-600">
            <span className="flex items-center gap-1">
              <Calendar size={12} strokeWidth={1.5} className="text-surface-400" aria-hidden="true" />
              {formatDate(consultation.scheduledAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} strokeWidth={1.5} className="text-surface-400" aria-hidden="true" />
              {scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {consultation.type === 'VIDEO' && (
              <span className="flex items-center gap-1">
                <Video size={12} strokeWidth={1.5} className="text-surface-400" aria-hidden="true" />
                Vídeo
              </span>
            )}
          </div>

          {/* Queixa principal */}
          {consultation.chiefComplaint && (
            <p className="text-xs text-surface-500 mt-2 line-clamp-1">
              {consultation.chiefComplaint}
            </p>
          )}

          {/* Duração para concluídas */}
          {consultation.status === 'COMPLETED' && consultation.durationMinutes && (
            <p className="text-xs text-surface-400 mt-1">
              Duração: {consultation.durationMinutes} min
            </p>
          )}

          {/* Avaliação por estrelas */}
          {consultation.status === 'COMPLETED' && consultation.rating && (
            <div className="flex items-center gap-0.5 mt-1" aria-label={`Avaliação: ${consultation.rating} de 5`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={cn('w-3 h-3', star <= consultation.rating! ? 'text-warning-500' : 'text-surface-200')}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {canJoinVideo && (
              <Button
                size="sm"
                variant="primary"
                iconLeft={<Video size={14} strokeWidth={2} />}
                onClick={() => router.push(`/consultations/${consultation.id}/video`)}
              >
                Entrar na consulta
              </Button>
            )}

            {consultation.status === 'COMPLETED' && (
              <Link
                href={`/documents?consultationId=${consultation.id}`}
                className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded-md bg-sage-600 text-white hover:bg-sage-700 active:bg-sage-800 transition-colors duration-150"
              >
                <Paperclip size={14} strokeWidth={2} aria-hidden="true" />
                Enviar documentos
              </Link>
            )}

            <Link
              href={`/consultations/${consultation.id}`}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded-md border border-surface-300 bg-white text-surface-700 hover:bg-surface-50 hover:border-surface-400 active:bg-surface-100 transition-colors duration-150"
            >
              Ver detalhes
            </Link>

            {canCancel && (
              <Button
                size="sm"
                variant="ghost"
                iconLeft={<XCircle size={14} strokeWidth={2} />}
                onClick={() => onCancel(consultation.id)}
                disabled={isCancelling}
                className="text-error-600 hover:text-error-700 hover:bg-error-50"
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default function ConsultasPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('upcoming')
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = trpc.consultation.listForPatient.useQuery(
    { page: 1, limit: 50 },
    { refetchInterval: 15_000 }
  )

  const cancelMutation = trpc.consultation.cancel.useMutation({
    onSuccess: () => void refetch(),
  })

  const { upcomingList, pastList } = useMemo(() => {
    const all = data?.consultations ?? []
    const mapped: ConsultationListItem[] = all.map((c) => ({
      id: c.id,
      type: c.type as ConsultationListItem['type'],
      status: c.status as ConsultationStatus,
      scheduledAt: (c.scheduledAt instanceof Date ? c.scheduledAt : new Date(c.scheduledAt)).toISOString(),
      startedAt: c.startedAt
        ? (c.startedAt instanceof Date ? c.startedAt.toISOString() : c.startedAt)
        : null,
      endedAt: c.endedAt
        ? (c.endedAt instanceof Date ? c.endedAt.toISOString() : c.endedAt)
        : null,
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

    return {
      upcomingList: mapped
        .filter((c) =>
          c.status === 'SCHEDULED' || c.status === 'WAITING_ROOM' || c.status === 'IN_PROGRESS'
        )
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
      pastList: mapped
        .filter((c) =>
          c.status === 'COMPLETED' || c.status === 'CANCELLED' || c.status === 'NO_SHOW'
        )
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()),
    }
  }, [data])

  const consultations = activeTab === 'upcoming' ? upcomingList : pastList

  async function handleCancel(id: string) {
    if (!confirm('Tem certeza que deseja cancelar esta consulta?')) return
    setCancellingId(id)
    setCancelError(null)
    try {
      await cancelMutation.mutateAsync({ id })
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Erro ao cancelar consulta.')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Minhas consultas"
        subtitle="Gerencie seus agendamentos e acompanhe o histórico."
        breadcrumb={[
          { label: 'Tratamento', href: '/tratamento' },
          { label: 'Consultas' },
        ]}
        className="-mx-4 -mt-4 lg:-mx-8 lg:-mt-8"
        action={
          <Link
            href="/consultations/book"
            className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium rounded-md bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 transition-colors duration-150 shadow-xs"
          >
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            Nova consulta
          </Link>
        }
      />

      <div className="pt-6 space-y-6">
        {/* Erro de cancelamento */}
        {cancelError && (
          <div
            role="alert"
            className="flex items-start gap-3 p-4 rounded-lg bg-error-50 border border-error-100"
          >
            <AlertCircle size={16} strokeWidth={2} className="text-error-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm text-error-700">{cancelError}</p>
            </div>
            <button
              onClick={() => setCancelError(null)}
              className="text-error-400 hover:text-error-600 transition-colors duration-150"
              aria-label="Fechar alerta"
            >
              <XCircle size={16} strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex items-center gap-1 p-1 bg-surface-100 rounded-xl w-fit"
          role="tablist"
          aria-label="Filtrar consultas"
        >
          {([
            { value: 'upcoming' as TabValue, label: 'Próximas' },
            { value: 'past' as TabValue, label: 'Anteriores' },
          ]).map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={activeTab === tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                activeTab === tab.value
                  ? 'bg-white text-surface-900 shadow-xs'
                  : 'text-surface-500 hover:text-surface-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Estado 1: Loading */}
        {isLoading && (
          <div className="space-y-3" aria-busy="true" aria-label="Carregando consultas">
            {[1, 2, 3].map((i) => (
              <ConsultationCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Estado 2: Erro */}
        {isError && !isLoading && (
          <div
            role="alert"
            className="flex flex-col items-center py-16 text-center gap-4"
          >
            <div className="rounded-2xl bg-error-50 p-4">
              <AlertCircle size={40} strokeWidth={1} className="text-error-300" aria-hidden="true" />
            </div>
            <div>
              <p className="font-heading font-semibold text-surface-700 mb-1">
                Erro ao carregar consultas
              </p>
              <p className="text-sm text-surface-500 max-w-xs">
                Não conseguimos buscar suas consultas. Verifique sua conexão e tente novamente.
              </p>
            </div>
            <Button
              variant="outline"
              size="md"
              iconLeft={<RefreshCcw size={16} strokeWidth={2} />}
              onClick={() => void refetch()}
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Estado 3: Vazio */}
        {!isLoading && !isError && consultations.length === 0 && (
          <EmptyState
            icon={
              activeTab === 'upcoming'
                ? <Calendar size={40} strokeWidth={1} className="text-surface-300" />
                : <CheckCircle size={40} strokeWidth={1} className="text-surface-300" />
            }
            title={
              activeTab === 'upcoming'
                ? 'Nenhuma consulta agendada'
                : 'Nenhuma consulta anterior'
            }
            description={
              activeTab === 'upcoming'
                ? 'Agende uma consulta com um de nossos médicos especialistas.'
                : 'Suas consultas concluídas aparecerão aqui.'
            }
            action={
              activeTab === 'upcoming' ? (
                <Link
                  href="/consultations/book"
                  className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium rounded-md bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 transition-colors duration-150 shadow-xs"
                >
                  <Plus size={16} strokeWidth={2} aria-hidden="true" />
                  Agendar consulta
                </Link>
              ) : undefined
            }
          />
        )}

        {/* Estado 4: Dados */}
        {!isLoading && !isError && consultations.length > 0 && (
          <div className="space-y-3" role="list" aria-label={activeTab === 'upcoming' ? 'Próximas consultas' : 'Consultas anteriores'}>
            {consultations.map((consultation) => (
              <div key={consultation.id} role="listitem">
                <ConsultationCard
                  consultation={consultation}
                  onCancel={handleCancel}
                  isCancelling={cancellingId === consultation.id}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
