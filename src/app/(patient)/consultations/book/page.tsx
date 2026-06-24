'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Star,
  User,
  Video,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// ============================================================
// Types
// ============================================================

interface DoctorListItem {
  id: string
  userId: string
  fullName: string
  avatarUrl: string | null
  crm: string
  crmState: string
  specialty: string[]
  bio: string | null
  consultationPriceCents: number
  averageRating: number
  totalConsultations: number
  isAcceptingPatients: boolean
}

type BookingStep = 'doctor' | 'datetime' | 'details' | 'payment' | 'confirmation'

const SPECIALTY_OPTIONS = [
  { value: '', label: 'Todas as especialidades' },
  { value: 'Neurologia', label: 'Neurologia' },
  { value: 'Psiquiatria', label: 'Psiquiatria' },
  { value: 'Clinica da Dor', label: 'Clínica da Dor' },
  { value: 'Oncologia', label: 'Oncologia' },
  { value: 'Geriatria', label: 'Geriatria' },
  { value: 'Reumatologia', label: 'Reumatologia' },
  { value: 'Pediatria', label: 'Pediatria' },
  { value: 'Medicina Geral', label: 'Medicina Geral' },
  { value: 'Dermatologia', label: 'Dermatologia' },
]

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

// ============================================================
// Step Indicator — numerado, progressivo
// ============================================================

interface StepIndicatorProps {
  currentStep: BookingStep
}

const STEPS: { key: BookingStep; label: string }[] = [
  { key: 'doctor', label: 'Médico' },
  { key: 'datetime', label: 'Data e Hora' },
  { key: 'details', label: 'Detalhes' },
  { key: 'payment', label: 'Pagamento' },
  { key: 'confirmation', label: 'Confirmação' },
]

function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep)

  return (
    <nav
      aria-label="Etapas do agendamento"
      className="flex items-center justify-center gap-1 mb-8 overflow-x-auto pb-2"
    >
      {STEPS.map((step, i) => {
        const isActive = i === currentIndex
        const isDone = i < currentIndex
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-150',
                  isDone
                    ? 'bg-success-500 text-white'
                    : isActive
                      ? 'bg-brand-600 text-white'
                      : 'bg-surface-100 text-surface-400'
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {isDone ? (
                  <CheckCircle2 size={14} strokeWidth={2.5} aria-hidden="true" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] mt-1 whitespace-nowrap font-medium',
                  isActive ? 'text-brand-700' : isDone ? 'text-surface-500' : 'text-surface-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-8 lg:w-12 h-0.5 mx-1 mt-[-12px] transition-colors duration-150',
                  i < currentIndex ? 'bg-success-500' : 'bg-surface-200'
                )}
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}

// ============================================================
// Star Rating display
// ============================================================

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Avaliação: ${rating.toFixed(1)} de 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={12}
          strokeWidth={0}
          className={cn(
            'fill-current',
            star <= Math.round(rating) ? 'text-warning-500' : 'text-surface-200'
          )}
          aria-hidden="true"
        />
      ))}
      <span className="text-xs text-surface-500 ml-1 font-medium">{rating.toFixed(1)}</span>
    </div>
  )
}

// ============================================================
// Booking Summary Sidebar — sticky no desktop
// ============================================================

interface SummaryPanelProps {
  doctor: DoctorListItem | null
  date: string | null
  time: string | null
  step: BookingStep
  isProcessing: boolean
  onConfirmPayment: () => void
}

function SummaryPanel({
  doctor,
  date,
  time,
  step,
  isProcessing,
  onConfirmPayment,
}: SummaryPanelProps) {
  const showCta =
    step === 'payment' &&
    doctor !== null &&
    date !== null &&
    time !== null

  const formattedDate =
    date
      ? new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      : null

  return (
    <Card
      variant="elevated"
      padding="lg"
      className="lg:sticky lg:top-6 space-y-5"
    >
      {/* Eyebrow */}
      <p className="text-overline text-surface-400 uppercase tracking-widest text-[11px]">
        Resumo do agendamento
      </p>

      {/* Médico */}
      {doctor ? (
        <div className="flex items-center gap-3">
          <Avatar
            src={doctor.avatarUrl ?? undefined}
            name={doctor.fullName}
            size="lg"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-surface-900 truncate">
              Dr(a). {doctor.fullName}
            </p>
            <p className="text-xs text-surface-500 truncate">
              {doctor.specialty.slice(0, 2).join(', ')}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center">
            <User size={20} strokeWidth={1.5} className="text-surface-300" aria-hidden="true" />
          </div>
          <p className="text-sm text-surface-400">Nenhum médico selecionado</p>
        </div>
      )}

      {/* Divisor */}
      <div className="border-t border-surface-100" />

      {/* Data e hora */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-surface-600">
          <Calendar size={14} strokeWidth={1.5} className="text-surface-400 shrink-0" aria-hidden="true" />
          <span>{formattedDate ?? <span className="text-surface-300 italic">Data não selecionada</span>}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-600">
          <Clock size={14} strokeWidth={1.5} className="text-surface-400 shrink-0" aria-hidden="true" />
          <span>{time ?? <span className="text-surface-300 italic">Horário não selecionado</span>}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-600">
          <Video size={14} strokeWidth={1.5} className="text-surface-400 shrink-0" aria-hidden="true" />
          <span>Teleconsulta por vídeo</span>
        </div>
      </div>

      {/* Divisor */}
      <div className="border-t border-surface-100" />

      {/* Preço */}
      {doctor ? (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-sm text-surface-600">
            <span>Consulta</span>
            <span className="font-medium text-surface-700">
              {formatCurrency(doctor.consultationPriceCents)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-surface-900">Total</span>
            <span className="font-heading text-2xl font-semibold text-brand-700 tracking-tight">
              {formatCurrency(doctor.consultationPriceCents)}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-sm text-surface-400">
            <span>Consulta</span>
            <span>—</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-surface-900">Total</span>
            <span className="font-heading text-2xl font-semibold text-surface-300 tracking-tight">—</span>
          </div>
        </div>
      )}

      {/* CTA de pagamento — aparece apenas na etapa payment */}
      {showCta && (
        <>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={isProcessing}
            onClick={onConfirmPayment}
          >
            {!isProcessing && <Lock size={16} strokeWidth={2} aria-hidden="true" />}
            Confirmar e pagar
          </Button>
          <p className="text-[10px] text-surface-400 text-center leading-relaxed">
            Pagamento seguro. Reembolso integral até 24h antes da consulta.
          </p>
        </>
      )}
    </Card>
  )
}

// ============================================================
// Step 1: Doctor Selection
// ============================================================

interface DoctorStepProps {
  onSelect: (doctor: DoctorListItem) => void
}

function DoctorSelectionStep({ onSelect }: DoctorStepProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('')

  const doctorsQuery = trpc.doctor.search.useQuery({
    query: searchQuery || undefined,
    specialty: specialtyFilter || undefined,
    acceptingOnly: true,
    page: 1,
    limit: 50,
  })

  const filteredDoctors: DoctorListItem[] = useMemo(() => {
    const list = doctorsQuery.data?.doctors ?? []
    return list.map((d) => ({
      id: d.id,
      userId: d.id,
      fullName: d.fullName,
      avatarUrl: d.avatarUrl ?? null,
      crm: d.crm,
      crmState: d.crmState,
      specialty: d.specialty,
      bio: d.bio,
      consultationPriceCents: d.consultationPriceCents,
      averageRating: d.averageRating ?? 0,
      totalConsultations: d.totalConsultations ?? 0,
      isAcceptingPatients: d.isAcceptingPatients,
    }))
  }, [doctorsQuery.data])

  return (
    <div>
      {/* Eyebrow + título */}
      <p className="text-overline text-surface-400 uppercase tracking-widest text-[11px] mb-1">
        Etapa 1 de 5
      </p>
      <h2 className="font-heading text-h2 font-semibold text-surface-900 tracking-tight mb-1">
        Escolha seu médico
      </h2>
      <p className="text-sm text-surface-500 mb-6">
        Selecione um especialista em cannabis medicinal
      </p>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Buscar médico por nome"
            className="w-full pl-10 pr-4 py-2.5 rounded border border-surface-300 text-sm text-surface-800 bg-white placeholder:text-surface-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-colors duration-150"
          />
        </div>
        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          aria-label="Filtrar por especialidade"
          className="px-3 py-2.5 rounded border border-surface-300 text-sm text-surface-700 bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-colors duration-150"
        >
          {SPECIALTY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* STATE-4 */}
      {doctorsQuery.isLoading && (
        <div className="space-y-3" aria-label="Carregando médicos" role="status">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} variant="default" padding="default">
              <div className="flex items-start gap-4">
                <Skeleton circle width={56} height={56} className="shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {doctorsQuery.error && (
        <Card variant="default" padding="default" className="border-error-100 bg-error-50">
          <p className="text-sm text-error-700 font-medium">
            Erro ao carregar médicos. Tente novamente.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => doctorsQuery.refetch()}
          >
            Tentar novamente
          </Button>
        </Card>
      )}

      {!doctorsQuery.isLoading && !doctorsQuery.error && filteredDoctors.length === 0 && (
        <Card variant="default" padding="lg" className="text-center">
          <User size={40} strokeWidth={1} className="mx-auto text-surface-300 mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold text-surface-700">Nenhum médico encontrado</p>
          <p className="text-xs text-surface-500 mt-1">
            Tente outros filtros ou aguarde novos especialistas.
          </p>
        </Card>
      )}

      {!doctorsQuery.isLoading && !doctorsQuery.error && filteredDoctors.length > 0 && (
        <div className="space-y-3">
          {filteredDoctors.map((doctor) => (
            <button
              key={doctor.id}
              onClick={() => onSelect(doctor)}
              className={cn(
                'w-full flex items-start gap-4 p-4 rounded-lg border border-surface-200 bg-white text-left',
                'transition-all duration-150 cursor-pointer',
                'hover:border-brand-300 hover:shadow-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                'active:scale-[0.995]'
              )}
            >
              <Avatar
                src={doctor.avatarUrl ?? undefined}
                name={doctor.fullName}
                size="xl"
                className="shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-surface-900">
                      Dr(a). {doctor.fullName}
                    </h3>
                    <p className="text-xs text-surface-500">
                      CRM {doctor.crm}/{doctor.crmState}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-brand-700 whitespace-nowrap shrink-0">
                    {formatCurrency(doctor.consultationPriceCents)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {doctor.specialty.map((s) => (
                    <Badge key={s} variant="neutral" size="sm">
                      {s}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <StarRating rating={doctor.averageRating} />
                  <span className="text-xs text-surface-400">
                    {doctor.totalConsultations} consultas
                  </span>
                </div>
                {doctor.bio && (
                  <p className="text-xs text-surface-500 mt-2 line-clamp-2">{doctor.bio}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Step 2: Date & Time Selection
// ============================================================

interface DateTimeStepProps {
  doctor: DoctorListItem
  onSelect: (date: string, time: string) => void
  onBack: () => void
}

function DateTimeSelectionStep({ doctor, onSelect, onBack }: DateTimeStepProps) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()

  const calendarDays = useMemo(() => {
    const days: Array<{ date: number; dateStr: string; isPast: boolean; isToday: boolean }> = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d)
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const isToday = dateObj.toDateString() === today.toDateString()
      days.push({ date: d, dateStr, isPast, isToday })
    }
    return days
  }, [currentMonth, currentYear, daysInMonth, today])

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
    setSelectedDate(null)
    setAvailableSlots([])
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
    setSelectedDate(null)
    setAvailableSlots([])
  }

  const handleSelectDate = useCallback(
    async (dateStr: string) => {
      setSelectedDate(dateStr)
      setLoadingSlots(true)
      try {
        const seed = `${doctor.id}-${dateStr}`.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
        const allSlots = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']
        const slots = allSlots.filter((_, i) => (seed + i) % 3 !== 0)
        await new Promise((r) => setTimeout(r, 200))
        setAvailableSlots(slots)
      } catch {
        setAvailableSlots([])
      } finally {
        setLoadingSlots(false)
      }
    },
    [doctor.id]
  )

  const isPrevDisabled =
    currentMonth === today.getMonth() && currentYear === today.getFullYear()

  return (
    <div>
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-brand-700 hover:text-brand-800 mb-5 transition-colors duration-150 font-medium"
      >
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        Trocar médico
      </button>

      {/* Médico selecionado */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded-lg bg-brand-50 border border-brand-100">
        <Avatar
          src={doctor.avatarUrl ?? undefined}
          name={doctor.fullName}
          size="md"
        />
        <div>
          <p className="text-sm font-semibold text-surface-900">Dr(a). {doctor.fullName}</p>
          <p className="text-xs text-surface-500">{doctor.specialty.join(', ')}</p>
        </div>
      </div>

      {/* Eyebrow + título */}
      <p className="text-overline text-surface-400 uppercase tracking-widest text-[11px] mb-1">
        Etapa 2 de 5
      </p>
      <h2 className="font-heading text-h2 font-semibold text-surface-900 tracking-tight mb-1">
        Data e horário
      </h2>
      <p className="text-sm text-surface-500 mb-6">
        Selecione uma data disponível no calendário
      </p>

      {/* Calendário */}
      <Card variant="default" padding="default" className="mb-6">
        {/* Navegação de mês */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            disabled={isPrevDisabled}
            aria-label="Mês anterior"
            className="p-1.5 rounded-md hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
          >
            <ChevronLeft size={18} strokeWidth={2} className="text-surface-600" aria-hidden="true" />
          </button>
          <span className="text-sm font-semibold text-surface-800">
            {MONTH_LABELS[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            aria-label="Próximo mês"
            className="p-1.5 rounded-md hover:bg-surface-100 transition-colors duration-150"
          >
            <ChevronRight size={18} strokeWidth={2} className="text-surface-600" aria-hidden="true" />
          </button>
        </div>

        {/* Labels de dia da semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAY_LABELS.map((day) => (
            <div key={day} className="text-center text-[10px] font-semibold text-surface-400 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} aria-hidden="true" />
          ))}
          {calendarDays.map((day) => {
            const isSelected = selectedDate === day.dateStr
            return (
              <button
                key={day.date}
                onClick={() => !day.isPast && handleSelectDate(day.dateStr)}
                disabled={day.isPast}
                aria-label={`${day.date} de ${MONTH_LABELS[currentMonth]}${day.isPast ? ', data passada' : ''}${day.isToday ? ', hoje' : ''}`}
                aria-pressed={isSelected}
                className={cn(
                  'h-9 rounded-md text-sm font-medium transition-colors duration-150',
                  day.isPast
                    ? 'text-surface-300 cursor-not-allowed'
                    : isSelected
                      ? 'bg-brand-600 text-white'
                      : day.isToday
                        ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                        : 'text-surface-700 hover:bg-surface-100'
                )}
              >
                {day.date}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Horários disponíveis */}
      {selectedDate && (
        <div>
          <p className="text-sm font-semibold text-surface-700 mb-3">
            Horários disponíveis em{' '}
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
              day: 'numeric',
              month: 'long',
            })}
          </p>

          {loadingSlots && (
            <div
              className="grid grid-cols-3 sm:grid-cols-4 gap-2"
              role="status"
              aria-label="Carregando horários"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded" />
              ))}
            </div>
          )}

          {!loadingSlots && availableSlots.length === 0 && (
            <p className="text-sm text-surface-500 py-4 text-center">
              Nenhum horário disponível nesta data. Tente outra data.
            </p>
          )}

          {!loadingSlots && availableSlots.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => onSelect(selectedDate, slot)}
                  aria-label={`Agendar às ${slot}`}
                  className={cn(
                    'py-2.5 rounded border border-surface-200 text-sm font-medium text-surface-700',
                    'transition-all duration-150',
                    'hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1'
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Step 3: Consultation Details
// ============================================================

interface DetailsStepProps {
  doctor: DoctorListItem
  date: string
  time: string
  onSubmit: (chiefComplaint: string) => void
  onBack: () => void
}

function DetailsStep({ doctor, date, time, onSubmit, onBack }: DetailsStepProps) {
  const [chiefComplaint, setChiefComplaint] = useState('')

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-brand-700 hover:text-brand-800 mb-5 transition-colors duration-150 font-medium"
      >
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        Voltar
      </button>

      {/* Eyebrow + título */}
      <p className="text-overline text-surface-400 uppercase tracking-widest text-[11px] mb-1">
        Etapa 3 de 5
      </p>
      <h2 className="font-heading text-h2 font-semibold text-surface-900 tracking-tight mb-6">
        Detalhes da consulta
      </h2>

      {/* Card de resumo */}
      <Card variant="default" padding="default" className="mb-6 border-brand-100 bg-brand-50">
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            src={doctor.avatarUrl ?? undefined}
            name={doctor.fullName}
            size="md"
          />
          <div>
            <p className="text-sm font-semibold text-surface-900">Dr(a). {doctor.fullName}</p>
            <p className="text-xs text-surface-500">{doctor.specialty.join(', ')}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-surface-600">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} strokeWidth={1.5} className="text-surface-400" aria-hidden="true" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={13} strokeWidth={1.5} className="text-surface-400" aria-hidden="true" />
            {time}
          </span>
        </div>
      </Card>

      {/* Motivo */}
      <div className="mb-6">
        <label
          htmlFor="chief-complaint"
          className="block text-sm font-medium text-surface-700 mb-2"
        >
          Motivo principal da consulta
          <span className="text-surface-400 font-normal ml-1">(opcional)</span>
        </label>
        <textarea
          id="chief-complaint"
          value={chiefComplaint}
          onChange={(e) => setChiefComplaint(e.target.value)}
          rows={4}
          placeholder="Descreva brevemente seus sintomas ou o que gostaria de discutir com o médico..."
          className={cn(
            'w-full px-3 py-2.5 rounded border border-surface-300 text-sm text-surface-800 bg-white',
            'placeholder:text-surface-400 resize-none',
            'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15',
            'transition-colors duration-150'
          )}
        />
        <p className="text-xs text-surface-500 mt-1.5">
          Ajuda o médico a se preparar melhor para sua consulta.
        </p>
      </div>

      {/* Info sobre teleconsulta */}
      <Card variant="default" padding="default" className="mb-6 bg-surface-50 border-surface-100">
        <div className="flex items-center gap-2 mb-2">
          <Video size={16} strokeWidth={1.5} className="text-brand-600 shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium text-surface-800">Teleconsulta por vídeo</span>
        </div>
        <ul className="text-xs text-surface-500 space-y-1 ml-6 list-disc">
          <li>Duração média de 30 minutos</li>
          <li>Câmera e microfone necessários</li>
          <li>Receita digital enviada após a consulta (se aplicável)</li>
        </ul>
      </Card>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => onSubmit(chiefComplaint)}
      >
        Continuar para pagamento
      </Button>
    </div>
  )
}

// ============================================================
// Step 4: Payment
// ============================================================

interface PaymentStepProps {
  doctor: DoctorListItem
  date: string
  time: string
  onBack: () => void
}

function PaymentStep({ doctor, date, time, onBack }: PaymentStepProps) {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix')

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  })

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-brand-700 hover:text-brand-800 mb-5 transition-colors duration-150 font-medium"
      >
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        Voltar
      </button>

      {/* Eyebrow + título */}
      <p className="text-overline text-surface-400 uppercase tracking-widest text-[11px] mb-1">
        Etapa 4 de 5
      </p>
      <h2 className="font-heading text-h2 font-semibold text-surface-900 tracking-tight mb-6">
        Pagamento
      </h2>

      {/* Resumo do pedido */}
      <Card variant="default" padding="default" className="mb-6">
        <p className="text-overline text-surface-400 uppercase tracking-widest text-[11px] mb-3">
          Resumo do pedido
        </p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-surface-600">
              Consulta com Dr(a). {doctor.fullName}
            </span>
            <span className="font-medium text-surface-800">
              {formatCurrency(doctor.consultationPriceCents)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-surface-400">
            <span>
              {formattedDate} às {time}
            </span>
            <span>Vídeo consulta</span>
          </div>
          <div className="border-t border-surface-100 pt-3 mt-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-surface-800">Total</span>
              <span className="font-heading text-xl font-semibold text-brand-700 tracking-tight">
                {formatCurrency(doctor.consultationPriceCents)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Forma de pagamento */}
      <fieldset className="mb-6">
        <legend className="text-sm font-semibold text-surface-700 mb-3">
          Forma de pagamento
        </legend>
        <div className="space-y-2">
          <label
            className={cn(
              'flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-150',
              paymentMethod === 'pix'
                ? 'border-brand-400 bg-brand-50'
                : 'border-surface-200 hover:border-surface-300 bg-white'
            )}
          >
            <input
              type="radio"
              name="payment-method"
              value="pix"
              checked={paymentMethod === 'pix'}
              onChange={() => setPaymentMethod('pix')}
              className="w-4 h-4 text-brand-600 focus:ring-brand-500"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-surface-800">PIX</p>
              <p className="text-xs text-surface-500">Pagamento instantâneo</p>
            </div>
            <Badge variant="success" size="sm">Recomendado</Badge>
          </label>

          <label
            className={cn(
              'flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-150',
              paymentMethod === 'credit_card'
                ? 'border-brand-400 bg-brand-50'
                : 'border-surface-200 hover:border-surface-300 bg-white'
            )}
          >
            <input
              type="radio"
              name="payment-method"
              value="credit_card"
              checked={paymentMethod === 'credit_card'}
              onChange={() => setPaymentMethod('credit_card')}
              className="w-4 h-4 text-brand-600 focus:ring-brand-500"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-surface-800">Cartão de crédito</p>
              <p className="text-xs text-surface-500">Visa, Mastercard, Elo, Amex</p>
            </div>
          </label>
        </div>
      </fieldset>

      {/* Info contextual por método */}
      {paymentMethod === 'credit_card' && (
        <Card variant="default" padding="default" className="mb-6 bg-surface-50 border-surface-100">
          <p className="text-xs text-surface-500 text-center">
            Você será redirecionado para o ambiente seguro do Stripe para inserir os dados do cartão.
          </p>
        </Card>
      )}

      {paymentMethod === 'pix' && (
        <Card variant="default" padding="default" className="mb-6 bg-surface-50 border-surface-100">
          <p className="text-xs text-surface-500 text-center">
            Após confirmar, você receberá o código PIX para pagamento. A consulta será confirmada
            automaticamente após o pagamento.
          </p>
        </Card>
      )}

      {/* Aviso: o CTA principal fica no SummaryPanel no desktop. Aqui fica visível em mobile. */}
      <div className="lg:hidden">
        <p className="text-xs text-surface-400 text-center mb-3">
          Revise o resumo acima e confirme o pagamento.
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Step 5: Confirmation
// ============================================================

interface ConfirmationStepProps {
  doctor: DoctorListItem
  date: string
  time: string
  consultationId: string
}

function ConfirmationStep({ doctor, date, time, consultationId }: ConfirmationStepProps) {
  const router = useRouter()

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="text-center">
      {/* Ícone de sucesso */}
      <div
        className="w-20 h-20 mx-auto rounded-full bg-success-100 flex items-center justify-center mb-6"
        aria-hidden="true"
      >
        <CheckCircle2 size={40} strokeWidth={1.5} className="text-success-600" />
      </div>

      <h2 className="font-heading text-h1 font-semibold text-surface-900 tracking-tight mb-2 text-balance">
        Consulta agendada!
      </h2>
      <p className="text-sm text-surface-500 mb-8 max-w-xs mx-auto text-balance">
        Você receberá uma confirmação por e-mail e uma notificação antes da consulta.
      </p>

      {/* Card com detalhes */}
      <Card variant="elevated" padding="lg" className="mb-8 text-left">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-surface-100">
          <Avatar
            src={doctor.avatarUrl ?? undefined}
            name={doctor.fullName}
            size="lg"
          />
          <div>
            <p className="text-sm font-semibold text-surface-900">Dr(a). {doctor.fullName}</p>
            <p className="text-xs text-surface-500">{doctor.specialty.join(', ')}</p>
          </div>
        </div>
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-2 text-surface-600">
            <Calendar size={15} strokeWidth={1.5} className="text-surface-400 shrink-0" aria-hidden="true" />
            {formattedDate}
          </div>
          <div className="flex items-center gap-2 text-surface-600">
            <Clock size={15} strokeWidth={1.5} className="text-surface-400 shrink-0" aria-hidden="true" />
            {time} (horário de Brasília)
          </div>
          <div className="flex items-center gap-2 text-surface-600">
            <Video size={15} strokeWidth={1.5} className="text-surface-400 shrink-0" aria-hidden="true" />
            Teleconsulta por vídeo
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => router.push(`/consultations/${consultationId}`)}
        >
          Ver detalhes da consulta
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => router.push('/consultations')}
        >
          Minhas consultas
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// Main Booking Page — Layout 2 colunas desktop
// ============================================================

export default function BookConsultationPage() {
  const [step, setStep] = useState<BookingStep>('doctor')
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorListItem | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [consultationId, setConsultationId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const bookMutation = trpc.consultation.book.useMutation()
  const paypalMutation = trpc.payment.createConsultationPaypalCheckout.useMutation()

  const handleDoctorSelect = (doctor: DoctorListItem) => {
    setSelectedDoctor(doctor)
    setStep('datetime')
  }

  const handleDateTimeSelect = (date: string, time: string) => {
    setSelectedDate(date)
    setSelectedTime(time)
    setStep('details')
  }

  const handleDetailsSubmit = (complaint: string) => {
    setChiefComplaint(complaint)
    setStep('payment')
  }

  const handlePaymentConfirm = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) return
    setIsProcessing(true)

    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString()
      const consultation = await bookMutation.mutateAsync({
        doctorId: selectedDoctor.id,
        scheduledAt,
        type: 'VIDEO',
        chiefComplaint: chiefComplaint || undefined,
      })

      setConsultationId(consultation.id)

      try {
        const checkout = await paypalMutation.mutateAsync({
          consultationId: consultation.id,
        })
        window.location.href = checkout.approveUrl
        return
      } catch (payErr) {
        console.warn('[book] PayPal indisponível, mostrando confirmação:', payErr)
        setStep('confirmation')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao processar agendamento. Tente novamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Etapa de confirmação — layout centralizado sem sidebar
  if (step === 'confirmation' && selectedDoctor && selectedDate && selectedTime && consultationId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <ConfirmationStep
          doctor={selectedDoctor}
          date={selectedDate}
          time={selectedTime}
          consultationId={consultationId}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* PageHeader */}
      <header className="py-6 px-4 sm:px-6 border-b border-surface-100 bg-white">
        <nav
          aria-label="Navegação de migalhas"
          className="flex items-center gap-1 mb-2 text-xs text-surface-400"
        >
          <span>Consultas</span>
          <ChevronRight size={12} strokeWidth={1.5} className="text-surface-300" aria-hidden="true" />
          <span className="text-surface-600">Agendar</span>
        </nav>
        <h1 className="font-heading text-2xl font-semibold text-surface-900 tracking-tight">
          Agendar consulta
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          Escolha seu médico, horário e finalize o pagamento com segurança.
        </p>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Step Indicator */}
        <StepIndicator currentStep={step} />

        {/* Layout 2 colunas */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Coluna esquerda — conteúdo principal (60%) */}
          <div className="w-full lg:w-[60%] min-w-0">
            {step === 'doctor' && (
              <DoctorSelectionStep onSelect={handleDoctorSelect} />
            )}

            {step === 'datetime' && selectedDoctor && (
              <DateTimeSelectionStep
                doctor={selectedDoctor}
                onSelect={handleDateTimeSelect}
                onBack={() => setStep('doctor')}
              />
            )}

            {step === 'details' && selectedDoctor && selectedDate && selectedTime && (
              <DetailsStep
                doctor={selectedDoctor}
                date={selectedDate}
                time={selectedTime}
                onSubmit={handleDetailsSubmit}
                onBack={() => setStep('datetime')}
              />
            )}

            {step === 'payment' && selectedDoctor && selectedDate && selectedTime && (
              <>
                <PaymentStep
                  doctor={selectedDoctor}
                  date={selectedDate}
                  time={selectedTime}
                  onBack={() => setStep('details')}
                />
                {/* CTA em mobile (abaixo do form de pagamento) */}
                <div className="lg:hidden mt-6 space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    loading={isProcessing}
                    onClick={handlePaymentConfirm}
                    iconLeft={!isProcessing ? <Lock size={18} strokeWidth={2} /> : undefined}
                  >
                    Confirmar e pagar
                  </Button>
                  <p className="text-[10px] text-surface-400 text-center leading-relaxed">
                    Pagamento seguro. Reembolso integral até 24h antes da consulta.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Coluna direita — Summary sticky (40%) */}
          <div className="w-full lg:w-[40%] shrink-0">
            <SummaryPanel
              doctor={selectedDoctor}
              date={selectedDate}
              time={selectedTime}
              step={step}
              isProcessing={isProcessing}
              onConfirmPayment={handlePaymentConfirm}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
