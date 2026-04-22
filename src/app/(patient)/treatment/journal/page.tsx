'use client'

import { useState } from 'react'
import Link from 'next/link'

// --- Types ---
interface JournalEntry {
  id: string
  date: string
  mood: number
  pain: number
  sleepQuality: number
  sleepHours: number
  anxiety: number
  appetite: number
  energy: number
  activities: string[]
  triggers: string[]
  notes: string
}

// --- Mock Data ---
const MOCK_ENTRIES: JournalEntry[] = [
  {
    id: 'j-001',
    date: '2026-03-30',
    mood: 7,
    pain: 2,
    sleepQuality: 8,
    sleepHours: 7.5,
    anxiety: 3,
    appetite: 7,
    energy: 6,
    activities: ['exercise', 'meditation'],
    triggers: ['stress'],
    notes: 'Dia produtivo. Consegui dormir bem apesar do estresse no trabalho.',
  },
  {
    id: 'j-002',
    date: '2026-03-29',
    mood: 6,
    pain: 3,
    sleepQuality: 7,
    sleepHours: 7,
    anxiety: 4,
    appetite: 6,
    energy: 5,
    activities: ['social', 'work'],
    triggers: ['stress', 'weather'],
    notes: 'Mudanca de clima trouxe leve desconforto. Encontro com amigos ajudou o humor.',
  },
  {
    id: 'j-003',
    date: '2026-03-28',
    mood: 8,
    pain: 1,
    sleepQuality: 9,
    sleepHours: 8,
    anxiety: 2,
    appetite: 8,
    energy: 8,
    activities: ['exercise', 'meditation', 'social'],
    triggers: [],
    notes: 'Excelente dia. Melhor noite de sono da semana.',
  },
  {
    id: 'j-004',
    date: '2026-03-27',
    mood: 5,
    pain: 4,
    sleepQuality: 5,
    sleepHours: 5.5,
    anxiety: 6,
    appetite: 4,
    energy: 4,
    activities: ['work'],
    triggers: ['stress', 'food'],
    notes: 'Noite ruim de sono. Comida pesada a noite pode ter atrapalhado.',
  },
  {
    id: 'j-005',
    date: '2026-03-26',
    mood: 7,
    pain: 2,
    sleepQuality: 7,
    sleepHours: 7,
    anxiety: 3,
    appetite: 7,
    energy: 7,
    activities: ['exercise', 'work'],
    triggers: [],
    notes: 'Dia equilibrado. Exercicio pela manha ajudou bastante.',
  },
  {
    id: 'j-006',
    date: '2026-03-25',
    mood: 6,
    pain: 3,
    sleepQuality: 6,
    sleepHours: 6.5,
    anxiety: 5,
    appetite: 5,
    energy: 5,
    activities: ['work'],
    triggers: ['menstrual_cycle'],
    notes: 'Inicio do ciclo menstrual. Dor leve e cansaco.',
  },
  {
    id: 'j-007',
    date: '2026-03-24',
    mood: 7,
    pain: 2,
    sleepQuality: 8,
    sleepHours: 7.5,
    anxiety: 3,
    appetite: 7,
    energy: 7,
    activities: ['exercise', 'social'],
    triggers: [],
    notes: '',
  },
]

const ACTIVITY_OPTIONS = [
  { key: 'exercise', label: 'Exercicio', icon: '🏃' },
  { key: 'meditation', label: 'Meditacao', icon: '🧘' },
  { key: 'social', label: 'Social', icon: '👥' },
  { key: 'work', label: 'Trabalho', icon: '💼' },
]

const TRIGGER_OPTIONS = [
  { key: 'stress', label: 'Estresse', icon: '😤' },
  { key: 'food', label: 'Alimentacao', icon: '🍔' },
  { key: 'weather', label: 'Clima', icon: '🌧️' },
  { key: 'menstrual_cycle', label: 'Ciclo Menstrual', icon: '🩸' },
]

const SLIDER_FIELDS = [
  { key: 'mood', label: 'Humor', emoji: '😊', low: 'Pessimo', high: 'Otimo' },
  { key: 'pain', label: 'Dor', emoji: '🤕', low: 'Nenhuma', high: 'Intensa' },
  { key: 'sleepQuality', label: 'Qualidade do Sono', emoji: '😴', low: 'Pessima', high: 'Otima' },
  { key: 'anxiety', label: 'Ansiedade', emoji: '😰', low: 'Nenhuma', high: 'Intensa' },
  { key: 'appetite', label: 'Apetite', emoji: '🍽️', low: 'Sem fome', high: 'Muita fome' },
  { key: 'energy', label: 'Energia', emoji: '⚡', low: 'Sem energia', high: 'Muita energia' },
] as const

function getScaleColor(value: number, inverse: boolean = false): string {
  const v = inverse ? 10 - value : value
  if (v >= 7) return 'text-brand-600'
  if (v >= 4) return 'text-amber-500'
  return 'text-red-500'
}

export default function SymptomJournalPage() {
  const [activeView, setActiveView] = useState<'form' | 'history' | 'summary'>('form')
  const [entries] = useState<JournalEntry[]>(MOCK_ENTRIES)

  // Form state
  const [formData, setFormData] = useState({
    mood: 5,
    pain: 5,
    sleepQuality: 5,
    sleepHours: 7,
    anxiety: 5,
    appetite: 5,
    energy: 5,
    activities: [] as string[],
    triggers: [] as string[],
    notes: '',
  })
  const [formSubmitted, setFormSubmitted] = useState(false)

  const updateSlider = (key: string, value: number) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const toggleCheckbox = (field: 'activities' | 'triggers', key: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(key)
        ? prev[field].filter((k) => k !== key)
        : [...prev[field], key],
    }))
  }

  const handleSubmit = () => {
    setFormSubmitted(true)
    setTimeout(() => setFormSubmitted(false), 3000)
  }

  // Weekly averages
  const weeklyAvg = {
    mood: (entries.reduce((s, e) => s + e.mood, 0) / entries.length).toFixed(1),
    pain: (entries.reduce((s, e) => s + e.pain, 0) / entries.length).toFixed(1),
    sleepQuality: (entries.reduce((s, e) => s + e.sleepQuality, 0) / entries.length).toFixed(1),
    sleepHours: (entries.reduce((s, e) => s + e.sleepHours, 0) / entries.length).toFixed(1),
    anxiety: (entries.reduce((s, e) => s + e.anxiety, 0) / entries.length).toFixed(1),
    energy: (entries.reduce((s, e) => s + e.energy, 0) / entries.length).toFixed(1),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/treatment" className="text-surface-400 hover:text-surface-600 transition">
              ← Tratamento
            </Link>
          </div>
          <h1 className="text-2xl font-heading font-bold text-surface-900">Diario de Sintomas</h1>
          <p className="text-surface-500">Registre como voce esta se sentindo hoje</p>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1">
        {[
          { key: 'form' as const, label: 'Novo Registro' },
          { key: 'history' as const, label: 'Historico' },
          { key: 'summary' as const, label: 'Resumo Semanal' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
              activeView === tab.key
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* === Form View === */}
      {activeView === 'form' && (
        <div className="space-y-6">
          {formSubmitted && (
            <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-medium text-brand-800">Registro salvo com sucesso!</p>
                  <p className="text-sm text-brand-600">Obrigada por registrar seus sintomas hoje.</p>
                </div>
              </div>
            </div>
          )}

          {/* Sliders Card */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-6">Como voce esta hoje?</h2>
            <div className="space-y-6">
              {SLIDER_FIELDS.map((field) => (
                <div key={field.key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-surface-700">
                      <span>{field.emoji}</span>
                      {field.label}
                    </label>
                    <span className={`text-lg font-heading font-bold ${
                      field.key === 'pain' || field.key === 'anxiety'
                        ? getScaleColor(formData[field.key], true)
                        : getScaleColor(formData[field.key])
                    }`}>
                      {formData[field.key]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={formData[field.key]}
                    onChange={(e) => updateSlider(field.key, Number(e.target.value))}
                    className="w-full accent-brand-600"
                  />
                  <div className="flex items-center justify-between text-[10px] text-surface-400 mt-1">
                    <span>{field.low}</span>
                    <span>{field.high}</span>
                  </div>
                </div>
              ))}

              {/* Sleep Hours */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-surface-700">
                    <span>🛏️</span>
                    Horas de Sono
                  </label>
                  <span className="text-lg font-heading font-bold text-brand-600">
                    {formData.sleepHours}h
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={12}
                  step={0.5}
                  value={formData.sleepHours}
                  onChange={(e) => updateSlider('sleepHours', Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
                <div className="flex items-center justify-between text-[10px] text-surface-400 mt-1">
                  <span>0h</span>
                  <span>12h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activities */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-4">Atividades de Hoje</h2>
            <div className="grid grid-cols-2 gap-3">
              {ACTIVITY_OPTIONS.map((act) => {
                const selected = formData.activities.includes(act.key)
                return (
                  <button
                    key={act.key}
                    onClick={() => toggleCheckbox('activities', act.key)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                      selected
                        ? 'bg-brand-50 border-brand-300 text-brand-700'
                        : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50'
                    }`}
                  >
                    <span className="text-xl">{act.icon}</span>
                    <span className="text-sm font-medium">{act.label}</span>
                    {selected && <span className="ml-auto text-brand-600">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Triggers */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-4">Gatilhos Identificados</h2>
            <div className="grid grid-cols-2 gap-3">
              {TRIGGER_OPTIONS.map((trig) => {
                const selected = formData.triggers.includes(trig.key)
                return (
                  <button
                    key={trig.key}
                    onClick={() => toggleCheckbox('triggers', trig.key)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                      selected
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50'
                    }`}
                  >
                    <span className="text-xl">{trig.icon}</span>
                    <span className="text-sm font-medium">{trig.label}</span>
                    {selected && <span className="ml-auto text-amber-600">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-4">Observacoes</h2>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Como foi seu dia? Algo relevante para o tratamento?"
              rows={4}
              className="w-full p-4 rounded-xl border border-surface-200 bg-surface-50 text-surface-900 placeholder-surface-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full py-4 rounded-2xl gradient-brand text-white font-heading font-bold text-lg hover:opacity-90 transition"
          >
            Salvar Registro
          </button>
        </div>
      )}

      {/* === History View === */}
      {activeView === 'history' && (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="p-5 rounded-2xl bg-white border border-surface-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="font-medium text-surface-900">
                  {new Date(entry.date).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                  })}
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-surface-400">Humor</span>
                  <span className={`text-sm font-bold ${getScaleColor(entry.mood)}`}>{entry.mood}</span>
                </div>
              </div>

              {/* Mini Metrics */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                {[
                  { label: 'Humor', value: entry.mood, icon: '😊' },
                  { label: 'Dor', value: entry.pain, icon: '🤕' },
                  { label: 'Sono', value: entry.sleepQuality, icon: '😴' },
                  { label: 'Ansiedade', value: entry.anxiety, icon: '😰' },
                  { label: 'Apetite', value: entry.appetite, icon: '🍽️' },
                  { label: 'Energia', value: entry.energy, icon: '⚡' },
                ].map((m) => (
                  <div key={m.label} className="text-center p-2 rounded-xl bg-surface-50">
                    <span className="text-sm block">{m.icon}</span>
                    <span className="text-lg font-bold text-surface-900">{m.value}</span>
                    <p className="text-[10px] text-surface-400">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Sleep Hours */}
              <div className="flex items-center gap-2 mb-3 text-sm text-surface-600">
                <span>🛏️</span>
                <span>{entry.sleepHours}h de sono</span>
              </div>

              {/* Activities & Triggers */}
              <div className="flex flex-wrap gap-2 mb-3">
                {entry.activities.map((act) => {
                  const opt = ACTIVITY_OPTIONS.find((a) => a.key === act)
                  return opt ? (
                    <span key={act} className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 text-xs font-medium">
                      {opt.icon} {opt.label}
                    </span>
                  ) : null
                })}
                {entry.triggers.map((trig) => {
                  const opt = TRIGGER_OPTIONS.find((t) => t.key === trig)
                  return opt ? (
                    <span key={trig} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium">
                      {opt.icon} {opt.label}
                    </span>
                  ) : null
                })}
              </div>

              {/* Notes */}
              {entry.notes && (
                <p className="text-sm text-surface-600 italic border-l-2 border-surface-200 pl-3">
                  {entry.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* === Summary View === */}
      {activeView === 'summary' && (
        <div className="space-y-6">
          {/* Weekly Averages */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-4">
              Media Semanal ({entries.length} registros)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Humor', value: weeklyAvg.mood, icon: '😊', max: 10 },
                { label: 'Dor', value: weeklyAvg.pain, icon: '🤕', max: 10 },
                { label: 'Qualidade Sono', value: weeklyAvg.sleepQuality, icon: '😴', max: 10 },
                { label: 'Horas Sono', value: weeklyAvg.sleepHours, icon: '🛏️', max: 12 },
                { label: 'Ansiedade', value: weeklyAvg.anxiety, icon: '😰', max: 10 },
                { label: 'Energia', value: weeklyAvg.energy, icon: '⚡', max: 10 },
              ].map((m) => (
                <div key={m.label} className="p-4 rounded-xl bg-surface-50 text-center">
                  <span className="text-2xl block mb-1">{m.icon}</span>
                  <p className="text-2xl font-heading font-bold text-surface-900">{m.value}</p>
                  <p className="text-xs text-surface-500">{m.label}</p>
                  <div className="w-full h-1.5 rounded-full bg-surface-200 mt-2">
                    <div
                      className="h-1.5 rounded-full bg-brand-500"
                      style={{ width: `${(Number(m.value) / m.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {[
              { label: 'Humor', key: 'mood' as const, color: 'brand' },
              { label: 'Dor', key: 'pain' as const, color: 'red' },
              { label: 'Qualidade do Sono', key: 'sleepQuality' as const, color: 'blue' },
              { label: 'Ansiedade', key: 'anxiety' as const, color: 'amber' },
            ].map((chart) => (
              <div key={chart.key} className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
                <h3 className="font-heading font-semibold text-surface-900 mb-4">{chart.label}</h3>
                <div className="flex items-end gap-2 h-24">
                  {[...entries].reverse().map((entry, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-medium text-surface-600">
                        {entry[chart.key]}
                      </span>
                      <div
                        className={`w-full rounded-t-lg ${
                          chart.color === 'brand' ? 'bg-brand-400'
                            : chart.color === 'red' ? 'bg-red-400'
                            : chart.color === 'blue' ? 'bg-blue-400'
                            : 'bg-amber-400'
                        }`}
                        style={{ height: `${(entry[chart.key] / 10) * 100}%` }}
                      />
                      <span className="text-[10px] text-surface-400">
                        {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Top Activities & Triggers */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
              <h3 className="font-heading font-semibold text-surface-900 mb-4">Atividades Frequentes</h3>
              {ACTIVITY_OPTIONS.map((act) => {
                const count = entries.filter((e) => e.activities.includes(act.key)).length
                return (
                  <div key={act.key} className="flex items-center justify-between py-2">
                    <span className="flex items-center gap-2 text-sm text-surface-700">
                      <span>{act.icon}</span> {act.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-surface-100">
                        <div
                          className="h-2 rounded-full bg-brand-400"
                          style={{ width: `${(count / entries.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-surface-500 w-8 text-right">{count}x</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
              <h3 className="font-heading font-semibold text-surface-900 mb-4">Gatilhos Frequentes</h3>
              {TRIGGER_OPTIONS.map((trig) => {
                const count = entries.filter((e) => e.triggers.includes(trig.key)).length
                return (
                  <div key={trig.key} className="flex items-center justify-between py-2">
                    <span className="flex items-center gap-2 text-sm text-surface-700">
                      <span>{trig.icon}</span> {trig.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-surface-100">
                        <div
                          className="h-2 rounded-full bg-amber-400"
                          style={{ width: `${(count / entries.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-surface-500 w-8 text-right">{count}x</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
