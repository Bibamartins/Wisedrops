'use client'

import Link from 'next/link'
import { trpc } from '@/lib/trpc'

const MOCK_DOCTOR = {
  name: 'Dr. Carlos Oliveira',
  specialty: 'Neurologia',
  crm: 'CRM/SP 123456',
  stats: {
    totalPatients: 142,
    consultationsToday: 5,
    pendingConsultations: 3,
    monthlyEarnings: 1245000, // cents
    averageRating: 4.9,
    adherenceAverage: 82,
  },
  todayConsultations: [
    {
      id: '1',
      time: '10:00',
      patient: 'Maria Silva',
      condition: 'Insonia',
      type: 'Retorno',
      status: 'completed',
    },
    {
      id: '2',
      time: '11:00',
      patient: 'Joao Santos',
      condition: 'Dor Cronica',
      type: 'Primeira Consulta',
      status: 'completed',
    },
    {
      id: '3',
      time: '14:00',
      patient: 'Ana Pereira',
      condition: 'Ansiedade',
      type: 'Retorno',
      status: 'scheduled',
    },
    {
      id: '4',
      time: '15:00',
      patient: 'Pedro Costa',
      condition: 'Epilepsia',
      type: 'Primeira Consulta',
      status: 'scheduled',
    },
    {
      id: '5',
      time: '16:30',
      patient: 'Lucia Ferreira',
      condition: 'Fibromialgia',
      type: 'Retorno',
      status: 'scheduled',
    },
  ],
  recentPatients: [
    { name: 'Maria Silva', condition: 'Insonia', adherence: 87, lastVisit: '31/03', trend: 'up' },
    { name: 'Joao Santos', condition: 'Dor Cronica', adherence: 92, lastVisit: '31/03', trend: 'up' },
    { name: 'Roberto Lima', condition: 'Ansiedade', adherence: 65, lastVisit: '28/03', trend: 'down' },
    { name: 'Carla Mendes', condition: 'Depressao', adherence: 78, lastVisit: '27/03', trend: 'stable' },
    { name: 'Fernando Souza', condition: 'Autismo', adherence: 95, lastVisit: '25/03', trend: 'up' },
  ],
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

export default function DoctorDashboard() {
  const { stats, todayConsultations, recentPatients } = MOCK_DOCTOR
  const upcomingQuery = trpc.consultation.listForDoctor.useQuery(
    { status: 'SCHEDULED', page: 1, limit: 10 },
    { refetchInterval: 15000 }
  )
  const upcomingCount = upcomingQuery.data?.consultations.length ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-surface-900">
            Dashboard Medico
          </h1>
          <p className="text-surface-500">
            {MOCK_DOCTOR.name} — {MOCK_DOCTOR.crm}
          </p>
        </div>
        <Link
          href="/doctor-consultations"
          className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition"
        >
          Atender Proximo Paciente
        </Link>
      </div>

      {/* Upcoming Appointments Banner */}
      {upcomingCount > 0 && (
        <Link
          href="/schedule"
          className="block p-4 rounded-2xl bg-brand-50 border border-brand-200 hover:bg-brand-100 transition"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-brand-900">
                  {upcomingCount} consulta{upcomingCount === 1 ? '' : 's'} agendada{upcomingCount === 1 ? '' : 's'}
                </p>
                <p className="text-sm text-brand-700">Clique para ver a agenda completa</p>
              </div>
            </div>
            <span className="text-brand-700 text-sm font-medium">Ver agenda →</span>
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-2xl font-heading font-bold text-brand-600">{stats.totalPatients}</p>
          <p className="text-xs text-surface-500">Pacientes Ativos</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-2xl font-heading font-bold text-surface-900">{stats.consultationsToday}</p>
          <p className="text-xs text-surface-500">Consultas Hoje</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-2xl font-heading font-bold text-accent-500">{stats.pendingConsultations}</p>
          <p className="text-xs text-surface-500">Na Fila</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-2xl font-heading font-bold text-brand-600">{formatCurrency(stats.monthlyEarnings)}</p>
          <p className="text-xs text-surface-500">Faturamento Mensal</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-2xl font-heading font-bold text-yellow-500">★ {stats.averageRating}</p>
          <p className="text-xs text-surface-500">Avaliacao Media</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-2xl font-heading font-bold text-brand-600">{stats.adherenceAverage}%</p>
          <p className="text-xs text-surface-500">Aderencia Media</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <h2 className="font-heading font-semibold text-surface-900 mb-4">Agenda de Hoje</h2>
          <div className="space-y-3">
            {todayConsultations.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  c.status === 'completed'
                    ? 'bg-surface-50 border-surface-200 opacity-60'
                    : 'bg-white border-surface-200 hover:border-brand-300'
                } transition`}
              >
                <div className="text-center min-w-[50px]">
                  <p className="text-sm font-bold text-surface-900">{c.time}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-900 truncate">{c.patient}</p>
                  <p className="text-xs text-surface-500">
                    {c.condition} • {c.type}
                  </p>
                </div>
                {c.status === 'scheduled' ? (
                  <button className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition">
                    Atender
                  </button>
                ) : (
                  <span className="text-xs text-surface-400">Concluida</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Patient CRM Table */}
        <div className="lg:col-span-3 p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-surface-900">Pacientes Recentes</h2>
            <Link href="/patients" className="text-sm text-brand-600 hover:underline">
              Ver Todos
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-3 px-2 font-medium text-surface-500">Paciente</th>
                  <th className="text-left py-3 px-2 font-medium text-surface-500">Condicao</th>
                  <th className="text-center py-3 px-2 font-medium text-surface-500">Aderencia</th>
                  <th className="text-center py-3 px-2 font-medium text-surface-500">Tendencia</th>
                  <th className="text-right py-3 px-2 font-medium text-surface-500">Ultima Visita</th>
                </tr>
              </thead>
              <tbody>
                {recentPatients.map((p) => (
                  <tr key={p.name} className="border-b border-surface-100 hover:bg-surface-50 cursor-pointer transition">
                    <td className="py-3 px-2">
                      <p className="font-medium text-surface-900">{p.name}</p>
                    </td>
                    <td className="py-3 px-2 text-surface-600">{p.condition}</td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.adherence >= 80
                            ? 'bg-brand-50 text-brand-700'
                            : p.adherence >= 60
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {p.adherence}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="text-lg">
                        {p.trend === 'up' ? '📈' : p.trend === 'down' ? '📉' : '➡️'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right text-surface-500">{p.lastVisit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200">
        <h3 className="font-heading font-semibold text-amber-800 mb-3">⚠️ Alertas de Atencao</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>
              <strong>Roberto Lima</strong> — Aderencia caiu para 65%. Considere contato para follow-up.
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>
              <strong>Maria Silva</strong> — Reportou efeito adverso leve (sonolencia diurna) no diario de ontem.
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>
              3 prescricoes vencem nos proximos 7 dias. <Link href="/prescriptions/new" className="underline">Ver todas</Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
