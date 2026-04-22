'use client'

import Link from 'next/link'
import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────
interface Consultation {
  id: string
  time: string
  endTime: string
  patient: string
  patientId: string
  condition: string
  type: 'Primeira Consulta' | 'Retorno' | 'Urgencia'
  status: 'completed' | 'in-progress' | 'waiting' | 'scheduled' | 'cancelled'
  notes?: string
  duration: number // minutes
}

// ─── Mock Data ────────────────────────────────────────────────────
const TODAY = '31 de Marco, 2026'

const TODAYS_CONSULTATIONS: Consultation[] = [
  { id: 'c1', time: '08:00', endTime: '08:30', patient: 'Lucia Ferreira', patientId: '8', condition: 'Fibromialgia', type: 'Retorno', status: 'completed', notes: 'Ajuste dosagem realizado', duration: 30 },
  { id: 'c2', time: '09:00', endTime: '09:45', patient: 'Maria Silva', patientId: '1', condition: 'Insonia', type: 'Retorno', status: 'completed', notes: 'Melhora significativa no sono', duration: 45 },
  { id: 'c3', time: '10:00', endTime: '10:30', patient: 'Joao Santos', patientId: '2', condition: 'Dor Cronica', type: 'Retorno', status: 'completed', notes: 'Mantem protocolo atual', duration: 30 },
  { id: 'c4', time: '11:00', endTime: '11:45', patient: 'Roberto Lima', patientId: '3', condition: 'Ansiedade', type: 'Retorno', status: 'in-progress', duration: 45 },
  { id: 'c5', time: '14:00', endTime: '14:45', patient: 'Ana Pereira', patientId: '6', condition: 'Ansiedade', type: 'Primeira Consulta', status: 'waiting', duration: 45 },
  { id: 'c6', time: '14:45', endTime: '15:15', patient: 'Pedro Costa', patientId: '7', condition: 'Epilepsia', type: 'Primeira Consulta', status: 'waiting', duration: 30 },
  { id: 'c7', time: '15:30', endTime: '16:00', patient: 'Carla Mendes', patientId: '4', condition: 'Depressao', type: 'Retorno', status: 'scheduled', duration: 30 },
  { id: 'c8', time: '16:00', endTime: '16:45', patient: 'Fernando Souza', patientId: '5', condition: 'Autismo', type: 'Retorno', status: 'scheduled', duration: 45 },
]

const UPCOMING_CONSULTATIONS: Consultation[] = [
  { id: 'u1', time: '09:00', endTime: '09:30', patient: 'Juliana Ribeiro', patientId: '10', condition: 'TEPT', type: 'Retorno', status: 'scheduled', duration: 30 },
  { id: 'u2', time: '10:00', endTime: '10:45', patient: 'Rafael Almeida', patientId: '11', condition: 'Insonia', type: 'Urgencia', status: 'scheduled', duration: 45 },
  { id: 'u3', time: '11:00', endTime: '11:30', patient: 'Camila Martins', patientId: '12', condition: 'Parkinson', type: 'Retorno', status: 'scheduled', duration: 30 },
  { id: 'u4', time: '14:00', endTime: '14:45', patient: 'Maria Silva', patientId: '1', condition: 'Insonia', type: 'Retorno', status: 'scheduled', duration: 45 },
]

const PAST_CONSULTATIONS: Consultation[] = [
  { id: 'p1', time: '09:00', endTime: '09:30', patient: 'Fernando Souza', patientId: '5', condition: 'Autismo', type: 'Retorno', status: 'completed', notes: 'Excelente evolucao', duration: 30 },
  { id: 'p2', time: '10:00', endTime: '10:45', patient: 'Carla Mendes', patientId: '4', condition: 'Depressao', type: 'Retorno', status: 'completed', notes: 'Pausa no tratamento solicitada', duration: 45 },
  { id: 'p3', time: '14:00', endTime: '14:30', patient: 'Lucia Ferreira', patientId: '8', condition: 'Fibromialgia', type: 'Retorno', status: 'completed', notes: 'Boa tolerancia, mantem regime', duration: 30 },
  { id: 'p4', time: '15:00', endTime: '15:45', patient: 'Pedro Costa', patientId: '7', condition: 'Epilepsia', type: 'Primeira Consulta', status: 'completed', notes: 'Diagnostico inicial e plano de tratamento', duration: 45 },
  { id: 'p5', time: '09:00', endTime: '09:30', patient: 'Marcos Oliveira', patientId: '9', condition: 'Dor Cronica', type: 'Retorno', status: 'cancelled', duration: 30 },
]

type TabKey = 'hoje' | 'proximas' | 'passadas'

function statusConfig(status: Consultation['status']) {
  const map: Record<Consultation['status'], { label: string; classes: string }> = {
    completed: { label: 'Concluida', classes: 'bg-brand-50 text-brand-700' },
    'in-progress': { label: 'Em Andamento', classes: 'bg-blue-50 text-blue-700' },
    waiting: { label: 'Aguardando', classes: 'bg-accent-50 text-accent-700' },
    scheduled: { label: 'Agendada', classes: 'bg-surface-100 text-surface-600' },
    cancelled: { label: 'Cancelada', classes: 'bg-red-50 text-red-700' },
  }
  return map[status]
}

function typeConfig(type: Consultation['type']) {
  const map: Record<Consultation['type'], string> = {
    'Primeira Consulta': 'bg-purple-50 text-purple-700',
    'Retorno': 'bg-surface-100 text-surface-600',
    'Urgencia': 'bg-red-50 text-red-700',
  }
  return map[type]
}

export default function ConsultationsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('hoje')

  const waitingCount = TODAYS_CONSULTATIONS.filter((c) => c.status === 'waiting').length
  const inProgressCount = TODAYS_CONSULTATIONS.filter((c) => c.status === 'in-progress').length
  const completedTodayCount = TODAYS_CONSULTATIONS.filter((c) => c.status === 'completed').length
  const nextWaiting = TODAYS_CONSULTATIONS.find((c) => c.status === 'waiting')

  const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-surface-900">Consultas</h1>
          <p className="text-surface-500">{TODAY}</p>
        </div>
        {nextWaiting && (
          <button className="px-5 py-2.5 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Atender Proximo: {nextWaiting.patient}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-2xl font-heading font-bold text-accent-500">{waitingCount}</p>
          <p className="text-xs text-surface-500">Na Sala de Espera</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-2xl font-heading font-bold text-blue-600">{inProgressCount}</p>
          <p className="text-xs text-surface-500">Em Andamento</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-2xl font-heading font-bold text-brand-600">{completedTodayCount}</p>
          <p className="text-xs text-surface-500">Concluidas Hoje</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-2xl font-heading font-bold text-surface-900">{TODAYS_CONSULTATIONS.length}</p>
          <p className="text-xs text-surface-500">Total Agendadas Hoje</p>
        </div>
      </div>

      {/* Waiting Room Alert */}
      {waitingCount > 0 && (
        <div className="p-4 rounded-2xl bg-accent-50 border border-accent-200 flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <p className="font-medium text-accent-800">
              {waitingCount} paciente{waitingCount > 1 ? 's' : ''} aguardando na sala de espera
            </p>
            <p className="text-sm text-accent-600">
              Proximo: {nextWaiting?.patient} — {nextWaiting?.condition} ({nextWaiting?.type})
            </p>
          </div>
          <button className="px-4 py-2 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition">
            Chamar Paciente
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-1">
          {([
            { key: 'hoje' as TabKey, label: 'Hoje' },
            { key: 'proximas' as TabKey, label: 'Proximas (01/04)' },
            { key: 'passadas' as TabKey, label: 'Passadas (30/03)' },
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

      {/* Today - Timeline View */}
      {activeTab === 'hoje' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Time Blocks */}
          <div className="lg:col-span-2 space-y-1">
            <h2 className="font-heading font-semibold text-surface-900 mb-3">Grade de Horarios</h2>
            {HOURS.map((hour) => {
              const consultation = TODAYS_CONSULTATIONS.find((c) => c.time === hour)
              const isBreak = hour === '12:00' || hour === '13:00'
              return (
                <div key={hour} className="flex gap-3">
                  <div className="w-14 text-right text-xs text-surface-400 py-3 flex-shrink-0">{hour}</div>
                  {isBreak ? (
                    <div className="flex-1 p-3 rounded-xl bg-surface-50 border border-dashed border-surface-200 text-sm text-surface-400 italic">
                      Intervalo
                    </div>
                  ) : consultation ? (
                    <div className={`flex-1 p-4 rounded-xl border transition ${
                      consultation.status === 'in-progress'
                        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                        : consultation.status === 'waiting'
                        ? 'bg-accent-50 border-accent-200'
                        : consultation.status === 'completed'
                        ? 'bg-surface-50 border-surface-200 opacity-70'
                        : 'bg-white border-surface-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Link href={`/patients/${consultation.patientId}`} className="font-medium text-surface-900 hover:text-brand-600 transition">
                            {consultation.patient}
                          </Link>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig(consultation.type)}`}>
                            {consultation.type}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig(consultation.status).classes}`}>
                          {statusConfig(consultation.status).label}
                        </span>
                      </div>
                      <p className="text-sm text-surface-500 mt-1">
                        {consultation.condition} — {consultation.time}-{consultation.endTime} ({consultation.duration}min)
                      </p>
                      {consultation.notes && (
                        <p className="text-xs text-surface-400 mt-1 italic">{consultation.notes}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        {consultation.status === 'waiting' && (
                          <button className="px-3 py-1 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition">
                            Iniciar Consulta
                          </button>
                        )}
                        {consultation.status === 'in-progress' && (
                          <>
                            <button className="px-3 py-1 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition">
                              Finalizar
                            </button>
                            <Link
                              href={`/prescriptions/new?patient=${consultation.patientId}`}
                              className="px-3 py-1 rounded-lg bg-surface-100 text-surface-600 text-xs font-medium hover:bg-surface-200 transition"
                            >
                              Gerar Receita
                            </Link>
                          </>
                        )}
                        {consultation.status === 'scheduled' && (
                          <button className="px-3 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition">
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 p-3 rounded-xl border border-dashed border-surface-200 text-sm text-surface-300">
                      Horario disponivel
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Sidebar: Quick Info */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
              <h3 className="font-heading font-semibold text-surface-900 mb-3">Resumo do Dia</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-surface-500">Primeira consulta</span>
                  <span className="font-medium text-surface-900">08:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Ultima consulta</span>
                  <span className="font-medium text-surface-900">16:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Primeiras consultas</span>
                  <span className="font-medium text-surface-900">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Retornos</span>
                  <span className="font-medium text-surface-900">6</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
              <h3 className="font-heading font-semibold text-surface-900 mb-3">Acoes Rapidas</h3>
              <div className="space-y-2">
                <Link
                  href="/schedule"
                  className="block w-full px-4 py-2 rounded-lg border border-surface-200 text-sm text-center font-medium text-surface-700 hover:bg-surface-50 transition"
                >
                  Gerenciar Agenda
                </Link>
                <Link
                  href="/prescriptions/new"
                  className="block w-full px-4 py-2 rounded-lg border border-surface-200 text-sm text-center font-medium text-surface-700 hover:bg-surface-50 transition"
                >
                  Nova Receita Avulsa
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming */}
      {activeTab === 'proximas' && (
        <div className="space-y-3">
          <h2 className="font-heading font-semibold text-surface-900">Consultas de 01/04/2026 (Quarta-feira)</h2>
          {UPCOMING_CONSULTATIONS.map((c) => (
            <div key={c.id} className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-surface-300 transition">
              <div className="text-center min-w-[60px]">
                <p className="text-lg font-bold text-surface-900">{c.time}</p>
                <p className="text-xs text-surface-400">{c.duration}min</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/patients/${c.patientId}`} className="font-medium text-surface-900 hover:text-brand-600 transition">
                    {c.patient}
                  </Link>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig(c.type)}`}>{c.type}</span>
                </div>
                <p className="text-sm text-surface-500">{c.condition}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg bg-surface-100 text-surface-600 text-xs font-medium hover:bg-surface-200 transition">
                  Reagendar
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition">
                  Cancelar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Past */}
      {activeTab === 'passadas' && (
        <div className="space-y-3">
          <h2 className="font-heading font-semibold text-surface-900">Consultas de 30/03/2026 (Segunda-feira)</h2>
          {PAST_CONSULTATIONS.map((c) => (
            <div key={c.id} className={`p-4 rounded-2xl bg-white border border-surface-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 ${c.status === 'cancelled' ? 'opacity-60' : ''}`}>
              <div className="text-center min-w-[60px]">
                <p className="text-lg font-bold text-surface-900">{c.time}</p>
                <p className="text-xs text-surface-400">{c.duration}min</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-surface-900">{c.patient}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig(c.status).classes}`}>
                    {statusConfig(c.status).label}
                  </span>
                </div>
                <p className="text-sm text-surface-500">{c.condition} — {c.type}</p>
                {c.notes && <p className="text-xs text-surface-400 mt-1 italic">{c.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
