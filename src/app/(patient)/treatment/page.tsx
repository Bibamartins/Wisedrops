'use client'

import { useState } from 'react'
import Link from 'next/link'

const MOCK_TREATMENT = {
  plan: {
    title: 'Tratamento para Insonia',
    condition: 'Insonia',
    doctor: 'Dr. Carlos Oliveira',
    startDate: '2026-01-15',
    status: 'ACTIVE',
    regimen: [
      {
        productName: 'CBD Full Spectrum 30mg/mL',
        dosage: '0.5mL (15mg CBD)',
        frequency: 'Diariamente',
        route: 'Sublingual',
        timeOfDay: ['08:00', '20:00'],
        instructions: 'Pingar sob a lingua e aguardar 60 segundos antes de engolir',
      },
    ],
    goals: [
      { description: 'Dormindo 7+ horas por noite', targetMetric: 'sleepHours', targetValue: '7', achieved: true },
      { description: 'Qualidade do sono acima de 7/10', targetMetric: 'sleepQuality', targetValue: '7', achieved: false },
      { description: 'Reducao da ansiedade noturna', targetMetric: 'anxietyLevel', targetValue: '3', achieved: false },
    ],
  },
  adherence: {
    rate: 87,
    streak: 12,
    longestStreak: 18,
    weeklyData: [
      { day: 'Seg', morning: true, night: true },
      { day: 'Ter', morning: true, night: true },
      { day: 'Qua', morning: true, night: false },
      { day: 'Qui', morning: true, night: true },
      { day: 'Sex', morning: false, night: true },
      { day: 'Sab', morning: true, night: true },
      { day: 'Dom', morning: true, night: null }, // null = pending
    ],
  },
  regimenHistory: [
    { date: '2026-01-15', change: 'Inicio: 0.25mL (7.5mg) 1x ao dia', reason: 'Dose inicial' },
    { date: '2026-02-01', change: 'Aumento: 0.5mL (15mg) 1x ao dia', reason: 'Boa tolerancia, efeito parcial' },
    { date: '2026-03-01', change: 'Aumento: 0.5mL (15mg) 2x ao dia', reason: 'Melhora do sono, ansiedade persistente' },
  ],
  outcomes: {
    labels: ['Jan', 'Fev', 'Mar'],
    sleepQuality: [4, 6, 8],
    anxietyLevel: [7, 5, 4],
    painLevel: [3, 2, 2],
  },
}

export default function TreatmentPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'adherence' | 'history' | 'outcomes'>('overview')
  const { plan, adherence, regimenHistory, outcomes } = MOCK_TREATMENT

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-surface-900">Meu Tratamento</h1>
          <p className="text-surface-500">{plan.title} — {plan.doctor}</p>
        </div>
        <Link
          href="/treatment/journal"
          className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition"
        >
          Registrar Sintomas
        </Link>
      </div>

      {/* Status Card */}
      <div className="p-6 rounded-2xl gradient-brand text-white">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-3xl font-heading font-bold">{adherence.rate}%</p>
            <p className="text-sm text-white/70">Aderencia</p>
          </div>
          <div>
            <p className="text-3xl font-heading font-bold">{adherence.streak}</p>
            <p className="text-sm text-white/70">Dias Consecutivos</p>
          </div>
          <div>
            <p className="text-3xl font-heading font-bold">{adherence.longestStreak}</p>
            <p className="text-sm text-white/70">Maior Sequencia</p>
          </div>
          <div>
            <p className="text-3xl font-heading font-bold">
              {Math.floor((Date.now() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24))}
            </p>
            <p className="text-sm text-white/70">Dias de Tratamento</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1">
        {[
          { key: 'overview', label: 'Visao Geral' },
          { key: 'adherence', label: 'Aderencia' },
          { key: 'history', label: 'Historico' },
          { key: 'outcomes', label: 'Evolucao' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Current Regimen */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h3 className="font-heading font-semibold text-surface-900 mb-4">Regime Atual</h3>
            {plan.regimen.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <p className="font-medium text-surface-900">{item.productName}</p>
                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  <div>
                    <span className="text-surface-500">Dosagem:</span>
                    <span className="ml-1 text-surface-900">{item.dosage}</span>
                  </div>
                  <div>
                    <span className="text-surface-500">Via:</span>
                    <span className="ml-1 text-surface-900">{item.route}</span>
                  </div>
                  <div>
                    <span className="text-surface-500">Frequencia:</span>
                    <span className="ml-1 text-surface-900">{item.frequency}</span>
                  </div>
                  <div>
                    <span className="text-surface-500">Horarios:</span>
                    <span className="ml-1 text-surface-900">{item.timeOfDay.join(', ')}</span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-surface-500 italic">{item.instructions}</p>
              </div>
            ))}
          </div>

          {/* Goals */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h3 className="font-heading font-semibold text-surface-900 mb-4">Metas do Tratamento</h3>
            <div className="space-y-3">
              {plan.goals.map((goal, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    goal.achieved ? 'bg-brand-50 border-brand-200' : 'bg-white border-surface-200'
                  }`}
                >
                  <span className="text-xl">{goal.achieved ? '✅' : '⬜'}</span>
                  <span className={`text-sm ${goal.achieved ? 'text-brand-700' : 'text-surface-600'}`}>
                    {goal.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'adherence' && (
        <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <h3 className="font-heading font-semibold text-surface-900 mb-4">Calendario de Aderencia — Esta Semana</h3>
          <div className="grid grid-cols-7 gap-3">
            {adherence.weeklyData.map((day, i) => (
              <div key={i} className="text-center">
                <p className="text-xs text-surface-500 mb-2">{day.day}</p>
                <div className="space-y-1">
                  <div
                    className={`w-full h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                      day.morning === true
                        ? 'bg-brand-100 text-brand-700'
                        : day.morning === false
                        ? 'bg-red-100 text-red-700'
                        : 'bg-surface-100 text-surface-400'
                    }`}
                  >
                    {day.morning === true ? '✓' : day.morning === false ? '✗' : '—'}
                  </div>
                  <div
                    className={`w-full h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                      day.night === true
                        ? 'bg-brand-100 text-brand-700'
                        : day.night === false
                        ? 'bg-red-100 text-red-700'
                        : 'bg-surface-100 text-surface-400'
                    }`}
                  >
                    {day.night === true ? '✓' : day.night === false ? '✗' : '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-surface-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-brand-100" /> Tomou</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100" /> Nao tomou</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-surface-100" /> Pendente</span>
          </div>
          <div className="mt-4 text-xs text-surface-400">
            Linha superior: dose da manha (08:00) | Linha inferior: dose da noite (20:00)
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <h3 className="font-heading font-semibold text-surface-900 mb-4">Historico de Ajustes</h3>
          <div className="space-y-4">
            {regimenHistory.map((entry, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-brand-500" />
                  {i < regimenHistory.length - 1 && (
                    <div className="w-0.5 flex-1 bg-surface-200 mt-1" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-xs text-surface-400 mb-1">{entry.date}</p>
                  <p className="font-medium text-surface-900">{entry.change}</p>
                  <p className="text-sm text-surface-500">{entry.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'outcomes' && (
        <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <h3 className="font-heading font-semibold text-surface-900 mb-4">Evolucao dos Sintomas</h3>
          <div className="space-y-6">
            {[
              { label: 'Qualidade do Sono', data: outcomes.sleepQuality, color: 'brand', better: 'higher' },
              { label: 'Ansiedade', data: outcomes.anxietyLevel, color: 'accent', better: 'lower' },
              { label: 'Dor', data: outcomes.painLevel, color: 'red', better: 'lower' },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-surface-700">{metric.label}</p>
                  <span className="text-xs text-surface-400">
                    (0-10 — {metric.better === 'higher' ? 'maior e melhor' : 'menor e melhor'})
                  </span>
                </div>
                <div className="flex items-end gap-3 h-20">
                  {metric.data.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-surface-600">{val}</span>
                      <div
                        className={`w-full rounded-t-lg ${
                          metric.color === 'brand'
                            ? 'bg-brand-400'
                            : metric.color === 'accent'
                            ? 'bg-accent-400'
                            : 'bg-red-400'
                        }`}
                        style={{ height: `${(val / 10) * 100}%` }}
                      />
                      <span className="text-[10px] text-surface-400">{outcomes.labels[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
