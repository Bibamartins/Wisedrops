'use client'

import { useEffect, useMemo, useState } from 'react'
import { trpc } from '@/lib/trpc'

// ─── Tipos & constantes ──────────────────────────────────────────────
interface DayConfig {
  dayOfWeek: number // 0=Dom .. 6=Sab (convenção do banco, JS Date.getDay())
  label: string
  shortLabel: string
  enabled: boolean
  startTime: string // "08:00"
  endTime: string // "18:00"
}

const DAY_LABELS: Record<number, { label: string; shortLabel: string }> = {
  0: { label: 'Domingo', shortLabel: 'Dom' },
  1: { label: 'Segunda-feira', shortLabel: 'Seg' },
  2: { label: 'Terça-feira', shortLabel: 'Ter' },
  3: { label: 'Quarta-feira', shortLabel: 'Qua' },
  4: { label: 'Quinta-feira', shortLabel: 'Qui' },
  5: { label: 'Sexta-feira', shortLabel: 'Sex' },
  6: { label: 'Sábado', shortLabel: 'Sáb' },
}
// Ordem de exibição: Seg → Dom
const DAY_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const SLOT_DURATIONS = [15, 30, 45, 60]

function defaultDays(): DayConfig[] {
  return DAY_DISPLAY_ORDER.map((dow) => ({
    dayOfWeek: dow,
    label: DAY_LABELS[dow].label,
    shortLabel: DAY_LABELS[dow].shortLabel,
    enabled: false,
    startTime: '08:00',
    endTime: '18:00',
  }))
}

interface ScheduleConsultation {
  id: string
  patientName: string
  type: 'video' | 'in_person'
  date: string
  time: string
  chiefComplaint?: string
  status: string
}

type ViewTab = 'disponibilidade' | 'calendario'

// ─── Componente ──────────────────────────────────────────────────────
export default function SchedulePage() {
  const profileQuery = trpc.doctor.getProfile.useQuery()
  const consultationsQuery = trpc.consultation.listForDoctor.useQuery(
    { status: 'SCHEDULED', page: 1, limit: 50 },
    { refetchInterval: 30000 },
  )
  const setAvailability = trpc.doctor.setAvailability.useMutation()
  const updateProfile = trpc.doctor.updateProfile.useMutation()
  const cancelConsult = trpc.consultation.cancel.useMutation({
    onSuccess: () => consultationsQuery.refetch(),
  })

  const [activeTab, setActiveTab] = useState<ViewTab>('disponibilidade')
  const [days, setDays] = useState<DayConfig[]>(defaultDays())
  const [slotDuration, setSlotDuration] = useState<number>(30)
  const [priceReais, setPriceReais] = useState<string>('')
  const [accepting, setAccepting] = useState<boolean>(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  // Popular estado a partir do perfil carregado
  useEffect(() => {
    const p = profileQuery.data
    if (!p) return
    const av =
      (p.availability as Array<{
        dayOfWeek: number
        startTime: string
        endTime: string
        slotDurationMinutes: number
        isActive: boolean
      }>) ?? []
    const map = new Map<number, (typeof av)[number]>()
    for (const a of av) map.set(a.dayOfWeek, a)
    setDays(
      DAY_DISPLAY_ORDER.map((dow) => {
        const a = map.get(dow)
        return {
          dayOfWeek: dow,
          label: DAY_LABELS[dow].label,
          shortLabel: DAY_LABELS[dow].shortLabel,
          enabled: !!(a && a.isActive),
          startTime: a?.startTime ?? '08:00',
          endTime: a?.endTime ?? '18:00',
        }
      }),
    )
    if (av.length > 0) setSlotDuration(av[0].slotDurationMinutes)
    setPriceReais(
      p.consultationPriceCents ? (p.consultationPriceCents / 100).toFixed(2) : '',
    )
    setAccepting(p.isAcceptingPatients ?? true)
  }, [profileQuery.data])

  const confirmed: ScheduleConsultation[] = useMemo(() => {
    const items = consultationsQuery.data?.consultations ?? []
    return items
      .map((c) => {
        const d = c.scheduledAt instanceof Date ? c.scheduledAt : new Date(c.scheduledAt)
        return {
          id: c.id,
          patientName: c.patient.user.fullName,
          type: (c.type === 'VIDEO' ? 'video' : 'in_person') as 'video' | 'in_person',
          date: d.toISOString().split('T')[0],
          time: d.toTimeString().slice(0, 5),
          chiefComplaint: c.chiefComplaint ?? undefined,
          status: c.status,
        }
      })
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  }, [consultationsQuery.data])

  const handleToggleDay = (i: number) =>
    setDays((arr) => arr.map((d, idx) => (idx === i ? { ...d, enabled: !d.enabled } : d)))

  const handleHour = (i: number, field: 'startTime' | 'endTime', value: string) =>
    setDays((arr) => arr.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)))

  const handleSave = async () => {
    setSaving(true)
    setSavedMsg(null)
    try {
      for (const d of days) {
        if (d.enabled && d.startTime >= d.endTime) {
          throw new Error(`${d.label}: hora de início precisa ser antes da hora de fim.`)
        }
      }
      const slots = days
        .filter((d) => d.enabled)
        .map((d) => ({
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime,
          endTime: d.endTime,
          slotDurationMinutes: slotDuration,
          isActive: true,
        }))
      await setAvailability.mutateAsync({ slots })

      const priceNumber = parseFloat(priceReais.replace(',', '.'))
      const priceCents =
        priceReais && isFinite(priceNumber) && priceNumber >= 0
          ? Math.round(priceNumber * 100)
          : undefined
      await updateProfile.mutateAsync({
        ...(priceCents !== undefined && { consultationPriceCents: priceCents }),
        isAcceptingPatients: accepting,
      })
      setSavedMsg({ kind: 'ok', text: 'Configurações salvas com sucesso.' })
      profileQuery.refetch()
    } catch (err) {
      setSavedMsg({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Erro ao salvar.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (appt: ScheduleConsultation) => {
    if (!confirm(`Cancelar consulta com ${appt.patientName}?`)) return
    try {
      await cancelConsult.mutateAsync({ id: appt.id })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao cancelar')
    }
  }

  // ─── Render ───────────────────────────────────────────────────────
  if (profileQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    )
  }

  if (profileQuery.isError) {
    return (
      <div className="p-4 rounded-xl bg-error-50 border border-error-600/30 text-sm text-error-600">
        Erro ao carregar perfil: {profileQuery.error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900">Minha Agenda</h1>
        <p className="text-surface-500 text-sm">
          Defina os dias e horários em que você atende, e veja suas próximas consultas.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-1">
          {(
            [
              { key: 'disponibilidade' as ViewTab, label: 'Disponibilidade' },
              { key: 'calendario' as ViewTab, label: `Próximas consultas${confirmed.length ? ` (${confirmed.length})` : ''}` },
            ]
          ).map((tab) => (
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

      {/* Disponibilidade */}
      {activeTab === 'disponibilidade' && (
        <div className="space-y-6">
          {/* Horários */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-1">
              Horários de trabalho
            </h2>
            <p className="text-sm text-surface-500 mb-6">
              Ative os dias em que você atende e defina o intervalo de horário. Pacientes só
              conseguirão marcar consultas nos horários habilitados.
            </p>

            <div className="space-y-3">
              {days.map((d, i) => (
                <div
                  key={d.dayOfWeek}
                  className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border transition ${
                    d.enabled
                      ? 'bg-white border-surface-200'
                      : 'bg-surface-50 border-surface-100 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <button
                      type="button"
                      onClick={() => handleToggleDay(i)}
                      className={`w-10 h-6 rounded-full transition relative ${
                        d.enabled ? 'bg-brand-500' : 'bg-surface-300'
                      }`}
                      aria-label={`Toggle ${d.label}`}
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                        style={{ left: d.enabled ? '18px' : '2px' }}
                      />
                    </button>
                    <span
                      className={`font-medium ${
                        d.enabled ? 'text-surface-900' : 'text-surface-400'
                      }`}
                    >
                      {d.label}
                    </span>
                  </div>
                  {d.enabled ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="text-xs text-surface-500">De:</label>
                      <input
                        type="time"
                        value={d.startTime}
                        onChange={(e) => handleHour(i, 'startTime', e.target.value)}
                        className="px-2 py-1.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <label className="text-xs text-surface-500">Até:</label>
                      <input
                        type="time"
                        value={d.endTime}
                        onChange={(e) => handleHour(i, 'endTime', e.target.value)}
                        className="px-2 py-1.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-surface-400 italic">Dia desabilitado</span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3 flex-wrap">
              <label className="text-sm text-surface-700 font-medium">
                Duração de cada consulta:
              </label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-surface-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {SLOT_DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} minutos
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preço + aceitando */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm space-y-5">
            <h2 className="font-heading font-semibold text-surface-900">Atendimento</h2>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-sm text-surface-700 font-medium min-w-[200px]">
                Preço da consulta (R$):
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={priceReais}
                onChange={(e) => setPriceReais(e.target.value)}
                placeholder="Ex.: 250,00"
                className="px-3 py-2 rounded-lg border border-surface-200 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-surface-400">
                Valor que o paciente vê na hora de agendar.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAccepting((v) => !v)}
                className={`w-10 h-6 rounded-full transition relative ${
                  accepting ? 'bg-sage-500' : 'bg-surface-300'
                }`}
                aria-label="Toggle aceitando pacientes"
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                  style={{ left: accepting ? '18px' : '2px' }}
                />
              </button>
              <span className="text-sm text-surface-700">
                {accepting
                  ? 'Aceitando novos pacientes (você aparece na busca)'
                  : 'Pausado — não aparece para novos pacientes'}
              </span>
            </div>
          </div>

          {/* Salvar */}
          <div className="flex items-center justify-end gap-3 flex-wrap">
            {savedMsg && (
              <span
                className={`text-sm ${
                  savedMsg.kind === 'ok' ? 'text-success-700' : 'text-error-600'
                }`}
              >
                {savedMsg.text}
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>
        </div>
      )}

      {/* Próximas consultas */}
      {activeTab === 'calendario' && (
        <div className="space-y-3">
          {consultationsQuery.isLoading && (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
            </div>
          )}
          {!consultationsQuery.isLoading && confirmed.length === 0 && (
            <div className="p-8 rounded-xl bg-white border border-surface-200 text-center text-sm text-surface-500">
              Nenhuma consulta agendada por enquanto. Assim que pacientes marcarem, aparecerão aqui.
            </div>
          )}
          {confirmed.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-xl bg-white border border-surface-200 flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="min-w-0">
                <p className="font-semibold text-surface-900">{c.patientName}</p>
                <p className="text-xs text-surface-500 mt-0.5">
                  📅 {c.date.split('-').reverse().join('/')} às {c.time} ·{' '}
                  {c.type === 'video' ? 'Vídeo' : 'Presencial'}
                </p>
                {c.chiefComplaint && (
                  <p className="text-xs text-surface-400 mt-0.5">&quot;{c.chiefComplaint}&quot;</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {c.type === 'video' && (
                  <a
                    href={`/doctor-consultations/${c.id}/video`}
                    className="px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition"
                  >
                    Iniciar vídeo
                  </a>
                )}
                <button
                  onClick={() => handleCancel(c)}
                  className="px-3 py-2 rounded-lg border border-error-600/30 text-error-600 text-xs font-medium hover:bg-error-50 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
