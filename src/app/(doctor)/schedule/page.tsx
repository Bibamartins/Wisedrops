'use client'

import { useMemo, useState } from 'react'
import { trpc } from '@/lib/trpc'

// Flat appointment shape we use inside this page (mapped from tRPC Consultation)
interface ScheduleAppointment {
  id: string
  patientId: string
  patientName: string
  patientCondition?: string
  consultationKind: string
  type: 'video' | 'in_person'
  date: string // YYYY-MM-DD
  time: string // HH:MM
  chiefComplaint?: string
  status: string
  videoRoomUrl?: string
}

// ─── Types ────────────────────────────────────────────────────────
interface TimeSlot {
  hour: string
  type: 'available' | 'appointment' | 'break' | 'blocked'
  patient?: string
  condition?: string
  consultationType?: string
}

interface DayConfig {
  label: string
  shortLabel: string
  enabled: boolean
  startHour: string
  endHour: string
}

interface TimeOff {
  id: string
  startDate: string
  endDate: string
  reason: string
}

// ─── Mock Data ────────────────────────────────────────────────────
const WEEK_START = '2026-03-30' // Monday

const INITIAL_DAYS: DayConfig[] = [
  { label: 'Segunda-feira', shortLabel: 'Seg', enabled: true, startHour: '08:00', endHour: '18:00' },
  { label: 'Terca-feira', shortLabel: 'Ter', enabled: true, startHour: '08:00', endHour: '18:00' },
  { label: 'Quarta-feira', shortLabel: 'Qua', enabled: true, startHour: '08:00', endHour: '18:00' },
  { label: 'Quinta-feira', shortLabel: 'Qui', enabled: true, startHour: '08:00', endHour: '18:00' },
  { label: 'Sexta-feira', shortLabel: 'Sex', enabled: true, startHour: '08:00', endHour: '17:00' },
  { label: 'Sabado', shortLabel: 'Sab', enabled: false, startHour: '09:00', endHour: '13:00' },
  { label: 'Domingo', shortLabel: 'Dom', enabled: false, startHour: '09:00', endHour: '13:00' },
]

const MOCK_WEEK_SLOTS: Record<number, TimeSlot[]> = {
  0: [ // Monday 30/03
    { hour: '08:00', type: 'appointment', patient: 'Lucia Ferreira', condition: 'Fibromialgia', consultationType: 'Retorno' },
    { hour: '08:30', type: 'available' },
    { hour: '09:00', type: 'appointment', patient: 'Maria Silva', condition: 'Insonia', consultationType: 'Retorno' },
    { hour: '09:30', type: 'available' },
    { hour: '10:00', type: 'appointment', patient: 'Joao Santos', condition: 'Dor Cronica', consultationType: 'Retorno' },
    { hour: '10:30', type: 'available' },
    { hour: '11:00', type: 'available' },
    { hour: '11:30', type: 'available' },
    { hour: '12:00', type: 'break' },
    { hour: '12:30', type: 'break' },
    { hour: '13:00', type: 'break' },
    { hour: '13:30', type: 'available' },
    { hour: '14:00', type: 'appointment', patient: 'Pedro Costa', condition: 'Epilepsia', consultationType: 'Primeira Consulta' },
    { hour: '14:30', type: 'available' },
    { hour: '15:00', type: 'appointment', patient: 'Fernando Souza', condition: 'Autismo', consultationType: 'Retorno' },
    { hour: '15:30', type: 'available' },
    { hour: '16:00', type: 'available' },
    { hour: '16:30', type: 'available' },
    { hour: '17:00', type: 'available' },
    { hour: '17:30', type: 'available' },
  ],
  1: [ // Tuesday 31/03
    { hour: '08:00', type: 'appointment', patient: 'Lucia Ferreira', condition: 'Fibromialgia', consultationType: 'Retorno' },
    { hour: '08:30', type: 'available' },
    { hour: '09:00', type: 'appointment', patient: 'Maria Silva', condition: 'Insonia', consultationType: 'Retorno' },
    { hour: '09:30', type: 'available' },
    { hour: '10:00', type: 'appointment', patient: 'Joao Santos', condition: 'Dor Cronica', consultationType: 'Retorno' },
    { hour: '10:30', type: 'available' },
    { hour: '11:00', type: 'appointment', patient: 'Roberto Lima', condition: 'Ansiedade', consultationType: 'Retorno' },
    { hour: '11:30', type: 'available' },
    { hour: '12:00', type: 'break' },
    { hour: '12:30', type: 'break' },
    { hour: '13:00', type: 'break' },
    { hour: '13:30', type: 'available' },
    { hour: '14:00', type: 'appointment', patient: 'Ana Pereira', condition: 'Ansiedade', consultationType: 'Primeira Consulta' },
    { hour: '14:30', type: 'available' },
    { hour: '15:00', type: 'appointment', patient: 'Pedro Costa', condition: 'Epilepsia', consultationType: 'Primeira Consulta' },
    { hour: '15:30', type: 'appointment', patient: 'Carla Mendes', condition: 'Depressao', consultationType: 'Retorno' },
    { hour: '16:00', type: 'appointment', patient: 'Fernando Souza', condition: 'Autismo', consultationType: 'Retorno' },
    { hour: '16:30', type: 'available' },
    { hour: '17:00', type: 'available' },
    { hour: '17:30', type: 'available' },
  ],
  2: [ // Wednesday 01/04
    { hour: '08:00', type: 'available' },
    { hour: '08:30', type: 'available' },
    { hour: '09:00', type: 'appointment', patient: 'Juliana Ribeiro', condition: 'TEPT', consultationType: 'Retorno' },
    { hour: '09:30', type: 'available' },
    { hour: '10:00', type: 'appointment', patient: 'Rafael Almeida', condition: 'Insonia', consultationType: 'Urgencia' },
    { hour: '10:30', type: 'available' },
    { hour: '11:00', type: 'appointment', patient: 'Camila Martins', condition: 'Parkinson', consultationType: 'Retorno' },
    { hour: '11:30', type: 'available' },
    { hour: '12:00', type: 'break' },
    { hour: '12:30', type: 'break' },
    { hour: '13:00', type: 'break' },
    { hour: '13:30', type: 'available' },
    { hour: '14:00', type: 'appointment', patient: 'Maria Silva', condition: 'Insonia', consultationType: 'Retorno' },
    { hour: '14:30', type: 'available' },
    { hour: '15:00', type: 'available' },
    { hour: '15:30', type: 'available' },
    { hour: '16:00', type: 'available' },
    { hour: '16:30', type: 'available' },
    { hour: '17:00', type: 'available' },
    { hour: '17:30', type: 'available' },
  ],
  3: [ // Thursday
    { hour: '08:00', type: 'available' },
    { hour: '08:30', type: 'available' },
    { hour: '09:00', type: 'available' },
    { hour: '09:30', type: 'available' },
    { hour: '10:00', type: 'available' },
    { hour: '10:30', type: 'available' },
    { hour: '11:00', type: 'available' },
    { hour: '11:30', type: 'available' },
    { hour: '12:00', type: 'break' },
    { hour: '12:30', type: 'break' },
    { hour: '13:00', type: 'break' },
    { hour: '13:30', type: 'available' },
    { hour: '14:00', type: 'available' },
    { hour: '14:30', type: 'available' },
    { hour: '15:00', type: 'available' },
    { hour: '15:30', type: 'available' },
    { hour: '16:00', type: 'available' },
    { hour: '16:30', type: 'available' },
    { hour: '17:00', type: 'available' },
    { hour: '17:30', type: 'available' },
  ],
  4: [ // Friday
    { hour: '08:00', type: 'appointment', patient: 'Marcos Oliveira', condition: 'Dor Cronica', consultationType: 'Retorno' },
    { hour: '08:30', type: 'available' },
    { hour: '09:00', type: 'available' },
    { hour: '09:30', type: 'available' },
    { hour: '10:00', type: 'available' },
    { hour: '10:30', type: 'available' },
    { hour: '11:00', type: 'available' },
    { hour: '11:30', type: 'available' },
    { hour: '12:00', type: 'break' },
    { hour: '12:30', type: 'break' },
    { hour: '13:00', type: 'break' },
    { hour: '13:30', type: 'available' },
    { hour: '14:00', type: 'available' },
    { hour: '14:30', type: 'available' },
    { hour: '15:00', type: 'available' },
    { hour: '15:30', type: 'available' },
    { hour: '16:00', type: 'available' },
    { hour: '16:30', type: 'blocked' },
  ],
}

const MOCK_TIME_OFF: TimeOff[] = [
  { id: 'to1', startDate: '2026-04-10', endDate: '2026-04-17', reason: 'Ferias' },
  { id: 'to2', startDate: '2026-05-01', endDate: '2026-05-01', reason: 'Feriado — Dia do Trabalho' },
]

const SLOT_DURATIONS = [15, 30, 45, 60]

type ViewTab = 'calendario' | 'disponibilidade' | 'folgas'

function getDateForDay(dayIndex: number): string {
  const base = new Date('2026-03-30')
  base.setDate(base.getDate() + dayIndex)
  return base.toLocaleDateString('pt-BR')
}

function slotColor(type: TimeSlot['type']) {
  switch (type) {
    case 'appointment': return 'bg-brand-50 border-brand-200 text-brand-800'
    case 'break': return 'bg-surface-100 border-surface-200 text-surface-400'
    case 'blocked': return 'bg-red-50 border-red-200 text-red-500'
    default: return 'bg-white border-surface-200 text-surface-300'
  }
}

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState<ViewTab>('calendario')
  const [days, setDays] = useState<DayConfig[]>(INITIAL_DAYS)
  const [slotDuration, setSlotDuration] = useState(30)
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>(MOCK_TIME_OFF)
  const [newTimeOff, setNewTimeOff] = useState({ startDate: '', endDate: '', reason: '' })
  const [showAddTimeOff, setShowAddTimeOff] = useState(false)
  // Fetch upcoming consultations (SCHEDULED) from real backend
  const consultationsQuery = trpc.consultation.listForDoctor.useQuery(
    { status: 'SCHEDULED', page: 1, limit: 50 },
    { refetchInterval: 15000 }
  )
  const cancelMutation = trpc.consultation.cancel.useMutation({
    onSuccess: () => consultationsQuery.refetch(),
  })

  // Auto-confirmed model: pending == [], confirmed == all SCHEDULED
  const confirmed: ScheduleAppointment[] = useMemo(() => {
    const items = consultationsQuery.data?.consultations ?? []
    return items.map((c) => {
      const d = c.scheduledAt instanceof Date ? c.scheduledAt : new Date(c.scheduledAt)
      const date = d.toISOString().split('T')[0]
      const time = d.toTimeString().slice(0, 5)
      return {
        id: c.id,
        patientId: c.patient.userId,
        patientName: c.patient.user.fullName,
        patientCondition: undefined,
        consultationKind: 'Consulta',
        type: c.type === 'VIDEO' ? 'video' : 'in_person',
        date,
        time,
        chiefComplaint: c.chiefComplaint ?? undefined,
        status: c.status,
        videoRoomUrl: c.videoRoomId
          ? `https://demo.daily.co/${c.videoRoomId}`
          : undefined,
      }
    })
  }, [consultationsQuery.data])

  const pending: ScheduleAppointment[] = [] // Auto-confirmed flow

  function handleConfirm(_appt: ScheduleAppointment) {
    // No-op under auto-confirm
  }

  async function handleReject(appt: ScheduleAppointment) {
    if (!confirm(`Cancelar consulta com ${appt.patientName}?`)) return
    try {
      await cancelMutation.mutateAsync({ id: appt.id })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao cancelar')
    }
  }

  function toggleDay(idx: number) {
    setDays(days.map((d, i) => i === idx ? { ...d, enabled: !d.enabled } : d))
  }

  function updateDayHours(idx: number, field: 'startHour' | 'endHour', value: string) {
    setDays(days.map((d, i) => i === idx ? { ...d, [field]: value } : d))
  }

  function addTimeOff() {
    if (newTimeOff.startDate && newTimeOff.endDate && newTimeOff.reason) {
      setTimeOffs([...timeOffs, { id: `to-${Date.now()}`, ...newTimeOff }])
      setNewTimeOff({ startDate: '', endDate: '', reason: '' })
      setShowAddTimeOff(false)
    }
  }

  function removeTimeOff(id: string) {
    setTimeOffs(timeOffs.filter((t) => t.id !== id))
  }

  const HOURS_LIST = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-surface-900">Gerenciar Agenda</h1>
          <p className="text-surface-500">Semana de 30/03 a 05/04/2026</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-surface-600">Duracao do slot:</label>
          <select
            value={slotDuration}
            onChange={(e) => setSlotDuration(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-surface-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {SLOT_DURATIONS.map((d) => (
              <option key={d} value={d}>{d} minutos</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pending Appointments */}
      {pending.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading font-semibold text-amber-900 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Solicitacoes de Agendamento
              </h2>
              <p className="text-sm text-amber-700 mt-1">
                {pending.length} paciente{pending.length === 1 ? '' : 's'} aguardando confirmacao
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-600 text-white text-xs font-semibold">
              {pending.length} Pendente{pending.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="space-y-3">
            {pending.map((appt) => (
              <div key={appt.id} className="p-4 rounded-xl bg-white border border-amber-200 flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-brand-700">{appt.patientName.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-900">{appt.patientName}</p>
                  <p className="text-sm text-surface-500">
                    {appt.consultationKind} • {appt.type === 'video' ? 'Video' : 'Presencial'}
                    {appt.chiefComplaint && ` • ${appt.chiefComplaint}`}
                  </p>
                  <p className="text-sm text-surface-600 mt-0.5">
                    📅 {appt.date.split('-').reverse().join('/')} as {appt.time}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(appt)}
                    className="px-4 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-sm font-medium transition"
                  >
                    Recusar
                  </button>
                  <button
                    onClick={() => handleConfirm(appt)}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium transition"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Appointments Summary */}
      {confirmed.length > 0 && (
        <div className="rounded-2xl bg-white border border-surface-200 p-5">
          <h2 className="font-heading font-semibold text-surface-900 mb-3">
            Proximas Consultas Confirmadas ({confirmed.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {confirmed.slice(0, 6).map((appt) => (
              <div key={appt.id} className="p-3 rounded-xl border border-surface-200 bg-surface-50">
                <p className="font-medium text-surface-900 text-sm">{appt.patientName}</p>
                <p className="text-xs text-surface-500 mt-0.5">
                  {appt.date.split('-').reverse().join('/')} • {appt.time}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-[10px] font-medium">
                    {appt.consultationKind}
                  </span>
                  {appt.type === 'video' && appt.videoRoomUrl && (
                    <a
                      href={`/doctor-consultations/${appt.id}/video`}
                      className="text-[10px] text-brand-600 hover:underline"
                    >
                      Iniciar video →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-1">
          {([
            { key: 'calendario' as ViewTab, label: 'Calendario Semanal' },
            { key: 'disponibilidade' as ViewTab, label: 'Disponibilidade' },
            { key: 'folgas' as ViewTab, label: 'Ferias e Folgas' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-surface-500 hover:text-surface-900 hover:border-surface-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Weekly Calendar */}
      {activeTab === 'calendario' && (
        <div className="rounded-2xl bg-white border border-surface-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  <th className="py-3 px-3 text-left font-medium text-surface-500 w-16">Hora</th>
                  {days.slice(0, 5).map((d, i) => (
                    <th key={i} className="py-3 px-2 text-center font-medium text-surface-500">
                      <div>{d.shortLabel}</div>
                      <div className="text-xs text-surface-400 font-normal">{getDateForDay(i)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS_LIST.map((hour) => (
                  <tr key={hour} className="border-b border-surface-100">
                    <td className="py-1 px-3 text-xs text-surface-400 align-top pt-2">{hour}</td>
                    {[0, 1, 2, 3, 4].map((dayIdx) => {
                      const slot = MOCK_WEEK_SLOTS[dayIdx]?.find((s) => s.hour === hour)
                      if (!slot) return <td key={dayIdx} className="py-1 px-1"><div className="h-8 rounded bg-surface-50" /></td>
                      return (
                        <td key={dayIdx} className="py-1 px-1">
                          <div className={`p-1.5 rounded-lg border text-xs ${slotColor(slot.type)} min-h-[32px]`}>
                            {slot.type === 'appointment' && (
                              <div>
                                <p className="font-medium truncate">{slot.patient}</p>
                                <p className="text-[10px] opacity-70 truncate">{slot.condition}</p>
                              </div>
                            )}
                            {slot.type === 'break' && <p className="italic text-center">Intervalo</p>}
                            {slot.type === 'blocked' && <p className="italic text-center">Bloqueado</p>}
                            {slot.type === 'available' && <p className="text-center">—</p>}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-surface-200 bg-surface-50 flex flex-wrap gap-4 text-xs text-surface-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-brand-50 border border-brand-200" /> Consulta</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white border border-surface-200" /> Disponivel</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-surface-100 border border-surface-200" /> Intervalo</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-50 border border-red-200" /> Bloqueado</span>
          </div>
        </div>
      )}

      {/* Availability Editor */}
      {activeTab === 'disponibilidade' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-4">Horarios de Trabalho</h2>
            <p className="text-sm text-surface-500 mb-6">Configure os dias e horarios em que voce atende. Pacientes so poderao agendar nos horarios habilitados.</p>
            <div className="space-y-3">
              {days.map((d, i) => (
                <div key={i} className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border transition ${
                  d.enabled ? 'bg-white border-surface-200' : 'bg-surface-50 border-surface-100 opacity-60'
                }`}>
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <button
                      onClick={() => toggleDay(i)}
                      className={`w-10 h-6 rounded-full transition relative ${d.enabled ? 'bg-brand-500' : 'bg-surface-300'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        d.enabled ? 'left-4.5 translate-x-0' : 'left-0.5'
                      }`} style={{ left: d.enabled ? '18px' : '2px' }} />
                    </button>
                    <span className={`font-medium ${d.enabled ? 'text-surface-900' : 'text-surface-400'}`}>{d.label}</span>
                  </div>
                  {d.enabled && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-surface-500">De:</label>
                      <input
                        type="time"
                        value={d.startHour}
                        onChange={(e) => updateDayHours(i, 'startHour', e.target.value)}
                        className="px-2 py-1.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <label className="text-xs text-surface-500">Ate:</label>
                      <input
                        type="time"
                        value={d.endHour}
                        onChange={(e) => updateDayHours(i, 'endHour', e.target.value)}
                        className="px-2 py-1.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  )}
                  {!d.enabled && <span className="text-sm text-surface-400 italic">Dia desabilitado</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Break Configuration */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-4">Intervalos</h2>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-50 border border-surface-200">
              <div className="flex items-center gap-2">
                <label className="text-sm text-surface-600">Almoco de:</label>
                <input type="time" defaultValue="12:00" className="px-2 py-1.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <label className="text-sm text-surface-600">ate:</label>
                <input type="time" defaultValue="13:30" className="px-2 py-1.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button className="px-6 py-2.5 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition">
              Salvar Configuracoes
            </button>
          </div>
        </div>
      )}

      {/* Time Off */}
      {activeTab === 'folgas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-surface-900">Ferias e Folgas</h2>
            <button
              onClick={() => setShowAddTimeOff(!showAddTimeOff)}
              className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition"
            >
              {showAddTimeOff ? 'Cancelar' : '+ Adicionar Folga'}
            </button>
          </div>

          {showAddTimeOff && (
            <div className="p-6 rounded-2xl bg-white border-2 border-brand-200 shadow-sm space-y-4">
              <h3 className="font-heading font-semibold text-surface-900">Nova Folga / Ferias</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Data Inicio</label>
                  <input
                    type="date"
                    value={newTimeOff.startDate}
                    onChange={(e) => setNewTimeOff({ ...newTimeOff, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={newTimeOff.endDate}
                    onChange={(e) => setNewTimeOff({ ...newTimeOff, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Motivo</label>
                  <input
                    type="text"
                    placeholder="Ex: Ferias, Congresso, etc."
                    value={newTimeOff.reason}
                    onChange={(e) => setNewTimeOff({ ...newTimeOff, reason: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <button
                onClick={addTimeOff}
                className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition"
              >
                Salvar Folga
              </button>
            </div>
          )}

          <div className="space-y-3">
            {timeOffs.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-surface-900">{t.reason}</p>
                  <p className="text-sm text-surface-500">
                    {new Date(t.startDate).toLocaleDateString('pt-BR')}
                    {t.startDate !== t.endDate && ` ate ${new Date(t.endDate).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                    Bloqueado
                  </span>
                  <button
                    onClick={() => removeTimeOff(t.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
            {timeOffs.length === 0 && (
              <p className="text-center text-surface-400 py-8">Nenhuma folga ou ferias programada.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
