'use client'

import Link from 'next/link'
import { useState } from 'react'

// ─── Mock Data ────────────────────────────────────────────────────
const MOCK_PATIENT = {
  id: '1',
  name: 'Maria Silva',
  age: 42,
  cpf: '123.456.789-00',
  email: 'maria.silva@email.com',
  phone: '(11) 99999-0001',
  conditions: ['Insonia', 'Ansiedade Leve'],
  avatar: 'MS',
  treatmentStart: '2025-09-15',
  treatmentStatus: 'ativo' as const,
  adherence: 87,
  currentRegimen: [
    { product: 'Full Spectrum CBD Oil 3000mg', concentration: '100mg/mL', dosage: '0.5mL', frequency: '2x ao dia', time: 'Manha e noite' },
    { product: 'CBN Isolate Caps', concentration: '25mg', dosage: '1 capsula', frequency: '1x ao dia', time: 'Antes de dormir' },
  ],
  vitals: { peso: '65kg', pressao: '120/80 mmHg', fc: '72 bpm', qualidadeSono: '7.2/10' },
  outcomes: [
    { month: 'Out/25', sleepScore: 4.2, anxietyScore: 7.1 },
    { month: 'Nov/25', sleepScore: 5.1, anxietyScore: 6.5 },
    { month: 'Dez/25', sleepScore: 5.8, anxietyScore: 5.8 },
    { month: 'Jan/26', sleepScore: 6.4, anxietyScore: 5.2 },
    { month: 'Fev/26', sleepScore: 7.0, anxietyScore: 4.5 },
    { month: 'Mar/26', sleepScore: 7.2, anxietyScore: 4.1 },
  ],
  adherenceHeatmap: [
    [1,1,1,0,1,1,1], [1,1,0,1,1,1,1], [1,1,1,1,0,1,1], [1,1,1,1,1,1,0],
  ],
  medicalRecords: [
    { id: 'r1', date: '2026-03-31', type: 'Consulta', doctor: 'Dr. Carlos Oliveira', summary: 'Retorno — paciente relata melhora significativa no sono. Mantem protocolo atual.' },
    { id: 'r2', date: '2026-03-15', type: 'Exame', doctor: 'Lab Central', summary: 'Hemograma completo — resultados dentro da normalidade.' },
    { id: 'r3', date: '2026-02-28', type: 'Consulta', doctor: 'Dr. Carlos Oliveira', summary: 'Ajuste de dosagem CBD de 0.3mL para 0.5mL. Paciente tolerou bem dose anterior.' },
    { id: 'r4', date: '2026-01-15', type: 'Consulta', doctor: 'Dr. Carlos Oliveira', summary: 'Inicio de CBN para reforco do sono. Orientacoes sobre uso noturno.' },
    { id: 'r5', date: '2025-09-15', type: 'Consulta', doctor: 'Dr. Carlos Oliveira', summary: 'Primeira consulta. Diagnostico de insonia cronica. Inicio de tratamento com CBD Full Spectrum.' },
  ],
  prescriptions: [
    { id: 'p1', date: '2026-03-01', product: 'Full Spectrum CBD Oil 3000mg', status: 'ativa', renewalDate: '2026-04-01', daysLeft: 1 },
    { id: 'p2', date: '2026-01-15', product: 'CBN Isolate Caps 25mg', status: 'ativa', renewalDate: '2026-04-15', daysLeft: 15 },
    { id: 'p3', date: '2025-09-15', product: 'Full Spectrum CBD Oil 1500mg', status: 'encerrada', renewalDate: null, daysLeft: null },
  ],
  treatmentPlan: {
    objective: 'Reducao de insonia cronica e melhora da qualidade do sono para >= 8/10',
    goals: [
      { label: 'Qualidade do sono >= 8/10', progress: 72, current: '7.2/10' },
      { label: 'Reducao de ansiedade < 3/10', progress: 59, current: '4.1/10' },
      { label: 'Aderencia >= 90%', progress: 87, current: '87%' },
    ],
    regimenHistory: [
      { period: 'Set-Dez 2025', regimen: 'CBD Full Spectrum 1500mg — 0.3mL 2x/dia', outcome: 'Melhora parcial' },
      { period: 'Jan-Mar 2026', regimen: 'CBD Full Spectrum 3000mg — 0.5mL 2x/dia + CBN 25mg noturno', outcome: 'Melhora significativa' },
    ],
  },
  sideEffects: [
    { effect: 'Sonolencia diurna', frequency: 3, severity: 'leve' },
    { effect: 'Boca seca', frequency: 5, severity: 'leve' },
    { effect: 'Dor de cabeca', frequency: 1, severity: 'moderado' },
  ],
  adherenceStats: { last7: 86, last30: 87, last90: 84, allTime: 82 },
}

type TabKey = 'visao-geral' | 'prontuario' | 'receitas' | 'tratamento' | 'aderencia'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'visao-geral', label: 'Visao Geral' },
  { key: 'prontuario', label: 'Prontuario' },
  { key: 'receitas', label: 'Receitas' },
  { key: 'tratamento', label: 'Plano de Tratamento' },
  { key: 'aderencia', label: 'Aderencia' },
]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

export default function PatientDetailPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('visao-geral')
  const [showAddRecord, setShowAddRecord] = useState(false)
  const p = MOCK_PATIENT

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href="/patients" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        ← Voltar para Pacientes
      </Link>

      {/* Patient Header */}
      <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
            <span className="text-xl font-bold text-brand-700">{p.avatar}</span>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-heading font-bold text-surface-900">{p.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700">
                {p.treatmentStatus === 'ativo' ? 'Ativo' : p.treatmentStatus}
              </span>
            </div>
            <p className="text-surface-500 text-sm mt-1">
              {p.age} anos — CPF: {p.cpf} — {p.conditions.join(', ')}
            </p>
            <p className="text-surface-400 text-xs mt-1">
              {p.email} | {p.phone} | Tratamento desde {formatDate(p.treatmentStart)}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/prescriptions/new?patient=${p.id}`}
              className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition"
            >
              Nova Receita
            </Link>
            <button className="px-4 py-2 rounded-lg border border-surface-200 text-sm font-medium text-surface-700 hover:bg-surface-50 transition">
              Iniciar Consulta
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
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

      {/* Tab Content */}
      {activeTab === 'visao-geral' && (
        <div className="space-y-6">
          {/* Current Regimen */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-4">Regime Atual</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {p.currentRegimen.map((r, i) => (
                <div key={i} className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                  <p className="font-medium text-surface-900">{r.product}</p>
                  <p className="text-sm text-surface-500 mt-1">{r.concentration} — {r.dosage} — {r.frequency}</p>
                  <p className="text-xs text-surface-400 mt-1">Horario: {r.time}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Vitals */}
            <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
              <h2 className="font-heading font-semibold text-surface-900 mb-4">Ultimos Sinais Vitais</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(p.vitals).map(([k, v]) => (
                  <div key={k} className="p-3 rounded-xl bg-surface-50">
                    <p className="text-xs text-surface-500 capitalize">{k === 'qualidadeSono' ? 'Qualidade do Sono' : k === 'fc' ? 'Freq. Cardiaca' : k.charAt(0).toUpperCase() + k.slice(1)}</p>
                    <p className="text-lg font-bold text-surface-900">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Outcomes Chart (text-based) */}
            <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
              <h2 className="font-heading font-semibold text-surface-900 mb-4">Evolucao de Outcomes</h2>
              <div className="space-y-2">
                {p.outcomes.map((o) => (
                  <div key={o.month} className="flex items-center gap-3 text-sm">
                    <span className="w-16 text-surface-500 text-xs">{o.month}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-brand-600 w-12">Sono</span>
                        <div className="flex-1 bg-surface-100 rounded-full h-2">
                          <div className="h-2 rounded-full bg-brand-500" style={{ width: `${o.sleepScore * 10}%` }} />
                        </div>
                        <span className="text-xs text-surface-500 w-8">{o.sleepScore}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-accent-500 w-12">Ansied.</span>
                        <div className="flex-1 bg-surface-100 rounded-full h-2">
                          <div className="h-2 rounded-full bg-accent-400" style={{ width: `${o.anxietyScore * 10}%` }} />
                        </div>
                        <span className="text-xs text-surface-500 w-8">{o.anxietyScore}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Adherence Heatmap */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-4">Mapa de Aderencia (Ultimas 4 semanas)</h2>
            <div className="flex gap-1 mb-2">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((d) => (
                <span key={d} className="w-10 text-center text-xs text-surface-400">{d}</span>
              ))}
            </div>
            {p.adherenceHeatmap.map((week, wi) => (
              <div key={wi} className="flex gap-1 mb-1">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium ${
                      day === 1 ? 'bg-brand-100 text-brand-700' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {day === 1 ? '✓' : '✗'}
                  </div>
                ))}
              </div>
            ))}
            <p className="mt-3 text-xs text-surface-400">Verde = tomou todas as doses | Vermelho = dose(s) perdida(s)</p>
          </div>
        </div>
      )}

      {activeTab === 'prontuario' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-surface-900">Prontuario Medico</h2>
            <button
              onClick={() => setShowAddRecord(!showAddRecord)}
              className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition"
            >
              {showAddRecord ? 'Cancelar' : '+ Novo Registro'}
            </button>
          </div>

          {showAddRecord && (
            <div className="p-6 rounded-2xl bg-white border-2 border-brand-200 shadow-sm space-y-4">
              <h3 className="font-heading font-semibold text-surface-900">Novo Registro</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Tipo</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option>Consulta</option>
                    <option>Exame</option>
                    <option>Nota Clinica</option>
                    <option>Encaminhamento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Data</label>
                  <input type="date" defaultValue="2026-03-31" className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Resumo</label>
                <textarea rows={4} className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Descreva o registro..." />
              </div>
              <button className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition">
                Salvar Registro
              </button>
            </div>
          )}

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-surface-200" />
            {p.medicalRecords.map((r) => (
              <div key={r.id} className="relative pl-12 pb-6">
                <div className={`absolute left-3.5 top-1 w-3 h-3 rounded-full border-2 border-white ${
                  r.type === 'Consulta' ? 'bg-brand-500' : 'bg-blue-500'
                }`} />
                <div className="p-4 rounded-xl bg-white border border-surface-200 hover:border-surface-300 transition">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.type === 'Consulta' ? 'bg-brand-50 text-brand-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {r.type}
                    </span>
                    <span className="text-xs text-surface-400">{formatDate(r.date)}</span>
                    <span className="text-xs text-surface-400">— {r.doctor}</span>
                  </div>
                  <p className="text-sm text-surface-700">{r.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'receitas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-surface-900">Receitas</h2>
            <Link
              href={`/prescriptions/new?patient=${p.id}`}
              className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition"
            >
              + Nova Receita
            </Link>
          </div>
          <div className="space-y-3">
            {p.prescriptions.map((rx) => (
              <div key={rx.id} className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium text-surface-900">{rx.product}</p>
                  <p className="text-xs text-surface-500 mt-1">Emitida em {formatDate(rx.date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    rx.status === 'ativa' ? 'bg-brand-50 text-brand-700' : 'bg-surface-100 text-surface-500'
                  }`}>
                    {rx.status === 'ativa' ? 'Ativa' : 'Encerrada'}
                  </span>
                  {rx.daysLeft !== null && rx.daysLeft <= 7 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                      Renova em {rx.daysLeft} dia{rx.daysLeft !== 1 ? 's' : ''}
                    </span>
                  )}
                  {rx.renewalDate && (
                    <span className="text-xs text-surface-400">Validade: {formatDate(rx.renewalDate)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'tratamento' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-2">Objetivo do Tratamento</h2>
            <p className="text-surface-600">{p.treatmentPlan.objective}</p>
          </div>

          {/* Goals */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-4">Metas e Progresso</h2>
            <div className="space-y-4">
              {p.treatmentPlan.goals.map((g, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-surface-700">{g.label}</span>
                    <span className="text-sm text-surface-500">Atual: {g.current}</span>
                  </div>
                  <div className="w-full bg-surface-100 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${g.progress >= 80 ? 'bg-brand-500' : g.progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-surface-400 mt-1">{g.progress}% concluido</p>
                </div>
              ))}
            </div>
          </div>

          {/* Regimen History */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-4">Historico de Regimes</h2>
            <div className="space-y-3">
              {p.treatmentPlan.regimenHistory.map((rh, i) => (
                <div key={i} className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-medium text-surface-900">{rh.period}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      rh.outcome.includes('significativa') ? 'bg-brand-50 text-brand-700' : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {rh.outcome}
                    </span>
                  </div>
                  <p className="text-sm text-surface-600">{rh.regimen}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'aderencia' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([
              ['Ultimos 7 dias', p.adherenceStats.last7],
              ['Ultimos 30 dias', p.adherenceStats.last30],
              ['Ultimos 90 dias', p.adherenceStats.last90],
              ['Todo o periodo', p.adherenceStats.allTime],
            ] as [string, number][]).map(([label, value]) => (
              <div key={label} className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm text-center">
                <p className={`text-2xl font-heading font-bold ${value >= 80 ? 'text-brand-600' : value >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {value}%
                </p>
                <p className="text-xs text-surface-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-4">Calendario de Aderencia — Marco 2026</h2>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((d) => (
                <div key={d} className="text-center text-xs text-surface-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for offset (March 2026 starts on Sunday) */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10" />
              ))}
              {Array.from({ length: 31 }).map((_, i) => {
                const day = i + 1
                // Simulate: most days green, some yellow, rare red
                const rand = (day * 7 + 3) % 10
                const status = rand < 7 ? 'green' : rand < 9 ? 'yellow' : 'red'
                return (
                  <div
                    key={day}
                    className={`h-10 rounded-lg flex items-center justify-center text-xs font-medium ${
                      status === 'green' ? 'bg-brand-100 text-brand-700' :
                      status === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}
                  >
                    {day}
                  </div>
                )
              })}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-surface-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-brand-100" /> Todas as doses</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100" /> Dose parcial</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100" /> Dose perdida</span>
            </div>
          </div>

          {/* Side Effects */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-4">Frequencia de Efeitos Adversos</h2>
            <div className="space-y-3">
              {p.sideEffects.map((se) => (
                <div key={se.effect} className="flex items-center gap-4">
                  <span className="text-sm text-surface-700 w-40">{se.effect}</span>
                  <div className="flex-1 bg-surface-100 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${se.severity === 'leve' ? 'bg-yellow-400' : 'bg-red-400'}`}
                      style={{ width: `${(se.frequency / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-surface-500 w-24">{se.frequency}x relatado</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    se.severity === 'leve' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {se.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
