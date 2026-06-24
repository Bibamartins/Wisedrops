'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn, formatCurrency } from '@/lib/utils'
import { trpc } from '@/lib/trpc'

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
  { value: 'Clinica da Dor', label: 'Clinica da Dor' },
  { value: 'Oncologia', label: 'Oncologia' },
  { value: 'Geriatria', label: 'Geriatria' },
  { value: 'Reumatologia', label: 'Reumatologia' },
  { value: 'Pediatria', label: 'Pediatria' },
  { value: 'Medicina Geral', label: 'Medicina Geral' },
  { value: 'Dermatologia', label: 'Dermatologia' },
]

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

// ============================================================
// Subcomponents
// ============================================================

// Step indicator

interface StepIndicatorProps {
  currentStep: BookingStep
}

const STEPS: { key: BookingStep; label: string }[] = [
  { key: 'doctor', label: 'Medico' },
  { key: 'datetime', label: 'Data e Hora' },
  { key: 'details', label: 'Detalhes' },
  { key: 'payment', label: 'Pagamento' },
  { key: 'confirmation', label: 'Confirmacao' },
]

function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep)

  return (
    <div className="flex items-center justify-center gap-1 mb-8 overflow-x-auto pb-2">
      {STEPS.map((step, i) => {
        const isActive = i === currentIndex
        const isDone = i < currentIndex
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition',
                  isDone
                    ? 'bg-green-500 text-white'
                    : isActive
                      ? 'bg-brand-600 text-white'
                      : 'bg-surface-200 text-surface-500'
                )}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] mt-1 whitespace-nowrap',
                  isActive ? 'text-brand-600 font-medium' : 'text-surface-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-8 lg:w-12 h-0.5 mx-1 mt-[-12px]',
                  i < currentIndex ? 'bg-green-500' : 'bg-surface-200'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Star rating display
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={cn('w-3.5 h-3.5', star <= Math.round(rating) ? 'text-yellow-400' : 'text-surface-200')}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-surface-500 ml-1">{rating.toFixed(1)}</span>
    </div>
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

  const loading = doctorsQuery.isLoading
  const filteredDoctors: DoctorListItem[] = useMemo(() => {
    const list = doctorsQuery.data?.doctors ?? []
    return list.map((d) => ({
      id: d.id,
      userId: d.id, // router doesn't expose userId publicly; id is used as identifier
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
      <h2 className="text-lg font-heading font-bold text-surface-900 mb-1">
        Escolha seu medico
      </h2>
      <p className="text-sm text-surface-500 mb-6">
        Selecione um medico especialista em cannabis medicinal
      </p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
        >
          {SPECIALTY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Doctor List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto text-surface-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <p className="text-sm text-surface-500">Nenhum medico encontrado com os filtros selecionados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDoctors.map((doctor) => (
            <button
              key={doctor.id}
              onClick={() => onSelect(doctor)}
              className="w-full flex items-start gap-4 p-4 rounded-xl border border-surface-200 bg-white hover:border-brand-300 hover:shadow-md transition text-left"
            >
              <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                {doctor.avatarUrl ? (
                  <img
                    src={doctor.avatarUrl}
                    alt={doctor.fullName}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-brand-600">
                    {doctor.fullName.charAt(0)}
                  </span>
                )}
              </div>
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
                  <span className="text-sm font-bold text-brand-600 whitespace-nowrap">
                    {formatCurrency(doctor.consultationPriceCents)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {doctor.specialty.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-full bg-surface-100 text-[10px] text-surface-600 font-medium"
                    >
                      {s}
                    </span>
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
        // Mock: generate slots deterministically based on date + doctor id
        const seed = `${doctor.id}-${dateStr}`.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
        const allSlots = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']
        // Skip roughly half the slots deterministically
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
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 mb-4"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Trocar medico
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-brand-600">
            {doctor.fullName.charAt(0)}
          </span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-surface-900">Dr(a). {doctor.fullName}</h3>
          <p className="text-xs text-surface-500">{doctor.specialty.join(', ')}</p>
        </div>
      </div>

      <h2 className="text-lg font-heading font-bold text-surface-900 mb-1">
        Escolha a data e horario
      </h2>
      <p className="text-sm text-surface-500 mb-6">
        Selecione uma data disponivel no calendario
      </p>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-surface-200 p-4 mb-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            disabled={isPrevDisabled}
            className="p-1 rounded-lg hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <svg className="w-5 h-5 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-surface-800">
            {MONTH_LABELS[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-surface-100 transition"
          >
            <svg className="w-5 h-5 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAY_LABELS.map((day) => (
            <div key={day} className="text-center text-[10px] font-medium text-surface-400 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for first week offset */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {calendarDays.map((day) => {
            const isSelected = selectedDate === day.dateStr
            return (
              <button
                key={day.date}
                onClick={() => !day.isPast && handleSelectDate(day.dateStr)}
                disabled={day.isPast}
                className={cn(
                  'h-10 rounded-lg text-sm font-medium transition',
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
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <h3 className="text-sm font-semibold text-surface-700 mb-3">
            Horarios disponiveis em{' '}
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
              day: 'numeric',
              month: 'long',
            })}
          </h3>
          {loadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-surface-500">
                Nenhum horario disponivel nesta data. Tente outra data.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => onSelect(selectedDate, slot)}
                  className="py-2.5 rounded-xl border border-surface-200 text-sm font-medium text-surface-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 transition"
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
        className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 mb-4"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Voltar
      </button>

      <h2 className="text-lg font-heading font-bold text-surface-900 mb-6">
        Detalhes da consulta
      </h2>

      {/* Summary card */}
      <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center">
            <span className="text-lg font-bold text-brand-700">
              {doctor.fullName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-900">
              Dr(a). {doctor.fullName}
            </p>
            <p className="text-xs text-surface-500">{doctor.specialty.join(', ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-surface-600">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {time}
          </span>
        </div>
      </div>

      {/* Chief Complaint */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-surface-700 mb-2">
          Motivo principal da consulta
        </label>
        <textarea
          value={chiefComplaint}
          onChange={(e) => setChiefComplaint(e.target.value)}
          rows={4}
          placeholder="Descreva brevemente o motivo da sua consulta, seus sintomas principais, ou o que gostaria de discutir com o medico..."
          className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
        <p className="text-xs text-surface-400 mt-1">
          Opcional, mas ajuda o medico a se preparar melhor para sua consulta
        </p>
      </div>

      {/* Consultation type info */}
      <div className="p-4 rounded-xl bg-surface-50 border border-surface-100 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span className="text-sm font-medium text-surface-800">Teleconsulta por video</span>
        </div>
        <ul className="text-xs text-surface-500 space-y-1 ml-6">
          <li>Duracao media de 30 minutos</li>
          <li>Camera e microfone necessarios</li>
          <li>Receita digital enviada apos a consulta (se aplicavel)</li>
        </ul>
      </div>

      <button
        onClick={() => onSubmit(chiefComplaint)}
        className="w-full py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition"
      >
        Continuar para pagamento
      </button>
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
  onConfirm: (paymentMethod: string) => void
  onBack: () => void
  isProcessing: boolean
}

function PaymentStep({ doctor, date, time, onConfirm, onBack, isProcessing }: PaymentStepProps) {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix')

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  })

  return (
    <div>
      <button
        onClick={onBack}
        disabled={isProcessing}
        className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 mb-4 disabled:opacity-40"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Voltar
      </button>

      <h2 className="text-lg font-heading font-bold text-surface-900 mb-6">
        Pagamento
      </h2>

      {/* Order summary */}
      <div className="bg-white rounded-xl border border-surface-200 p-4 mb-6">
        <h3 className="text-sm font-semibold text-surface-800 mb-3">Resumo do pedido</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-surface-600">Consulta com Dr(a). {doctor.fullName}</span>
            <span className="font-medium text-surface-800">
              {formatCurrency(doctor.consultationPriceCents)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-surface-400">
            <span>{formattedDate} as {time}</span>
            <span>Video consulta</span>
          </div>
          <div className="border-t border-surface-100 pt-2 mt-2">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-surface-800">Total</span>
              <span className="text-brand-600">
                {formatCurrency(doctor.consultationPriceCents)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment method selection */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-surface-700 mb-3">Forma de pagamento</h3>
        <div className="space-y-2">
          <label
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition',
              paymentMethod === 'pix'
                ? 'border-brand-400 bg-brand-50'
                : 'border-surface-200 hover:border-surface-300'
            )}
          >
            <input
              type="radio"
              name="payment"
              value="pix"
              checked={paymentMethod === 'pix'}
              onChange={() => setPaymentMethod('pix')}
              className="w-4 h-4 text-brand-600"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-surface-800">PIX</p>
              <p className="text-xs text-surface-500">Pagamento instantaneo</p>
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              Recomendado
            </span>
          </label>

          <label
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition',
              paymentMethod === 'credit_card'
                ? 'border-brand-400 bg-brand-50'
                : 'border-surface-200 hover:border-surface-300'
            )}
          >
            <input
              type="radio"
              name="payment"
              value="credit_card"
              checked={paymentMethod === 'credit_card'}
              onChange={() => setPaymentMethod('credit_card')}
              className="w-4 h-4 text-brand-600"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-surface-800">Cartao de credito</p>
              <p className="text-xs text-surface-500">Visa, Mastercard, Elo, Amex</p>
            </div>
          </label>
        </div>
      </div>

      {/* Credit card form (simplified — full Stripe Elements would go here) */}
      {paymentMethod === 'credit_card' && (
        <div className="bg-surface-50 rounded-xl border border-surface-100 p-4 mb-6">
          <p className="text-xs text-surface-500 text-center">
            Voce sera redirecionado para o ambiente seguro do Stripe para inserir os dados do cartao.
          </p>
        </div>
      )}

      {/* PIX info */}
      {paymentMethod === 'pix' && (
        <div className="bg-surface-50 rounded-xl border border-surface-100 p-4 mb-6">
          <p className="text-xs text-surface-500 text-center">
            Apos confirmar, voce recebera o codigo PIX para pagamento. A consulta sera confirmada
            automaticamente apos o pagamento.
          </p>
        </div>
      )}

      <button
        onClick={() => onConfirm(paymentMethod)}
        disabled={isProcessing}
        className="w-full py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Processando...
          </>
        ) : (
          <>Confirmar e pagar {formatCurrency(doctor.consultationPriceCents)}</>
        )}
      </button>

      <p className="text-[10px] text-surface-400 text-center mt-3">
        Pagamento processado com seguranca via Stripe. Politica de cancelamento: reembolso integral
        ate 24h antes da consulta.
      </p>
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
      <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h2 className="text-xl font-heading font-bold text-surface-900 mb-2">
        Consulta agendada com sucesso!
      </h2>
      <p className="text-sm text-surface-500 mb-8">
        Voce recebera uma confirmacao por e-mail e notificacao antes da consulta.
      </p>

      <div className="bg-white rounded-xl border border-surface-200 p-6 mb-8 text-left">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-surface-100">
          <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
            <span className="text-xl font-bold text-brand-600">
              {doctor.fullName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-900">
              Dr(a). {doctor.fullName}
            </p>
            <p className="text-xs text-surface-500">{doctor.specialty.join(', ')}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-surface-600">
            <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {formattedDate}
          </div>
          <div className="flex items-center gap-2 text-surface-600">
            <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {time} (horario de Brasilia)
          </div>
          <div className="flex items-center gap-2 text-surface-600">
            <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Teleconsulta por video
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => router.push(`/consultations/${consultationId}`)}
          className="w-full py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition"
        >
          Ver detalhes da consulta
        </button>
        <button
          onClick={() => router.push('/consultations')}
          className="w-full py-3 rounded-xl border border-surface-200 text-surface-700 font-medium hover:bg-surface-50 transition"
        >
          Minhas consultas
        </button>
      </div>
    </div>
  )
}

// ============================================================
// Main Booking Page
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

  const handlePaymentConfirm = async (_paymentMethod: string) => {
    if (!selectedDoctor || !selectedDate || !selectedTime) return
    setIsProcessing(true)

    try {
      // Combine date + time into ISO datetime (local tz) for backend
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString()
      const consultation = await bookMutation.mutateAsync({
        doctorId: selectedDoctor.id,
        scheduledAt,
        type: 'VIDEO',
        chiefComplaint: chiefComplaint || undefined,
      })

      setConsultationId(consultation.id)

      // Tenta abrir o checkout do PayPal. Se PayPal não estiver configurado,
      // cai pra tela de confirmação (consulta criada, sem pagamento).
      try {
        const checkout = await paypalMutation.mutateAsync({
          consultationId: consultation.id,
        })
        window.location.href = checkout.approveUrl
        return // redirecionando, não muda step
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

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator currentStep={step} />

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
        <PaymentStep
          doctor={selectedDoctor}
          date={selectedDate}
          time={selectedTime}
          onConfirm={handlePaymentConfirm}
          onBack={() => setStep('details')}
          isProcessing={isProcessing}
        />
      )}

      {step === 'confirmation' && selectedDoctor && selectedDate && selectedTime && consultationId && (
        <ConfirmationStep
          doctor={selectedDoctor}
          date={selectedDate}
          time={selectedTime}
          consultationId={consultationId}
        />
      )}
    </div>
  )
}
