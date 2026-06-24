'use client'

import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

// ---------------------------------------------------------------------------
// Tipos — preservados do original (journal/page.tsx)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Mock data — preservado do original
// ---------------------------------------------------------------------------

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
    notes: 'Mudança de clima trouxe leve desconforto. Encontro com amigos ajudou o humor.',
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
    notes: 'Noite ruim de sono. Comida pesada à noite pode ter atrapalhado.',
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
    notes: 'Dia equilibrado. Exercício pela manhã ajudou bastante.',
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
    notes: 'Início do ciclo menstrual. Dor leve e cansaço.',
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
  { key: 'exercise', label: 'Exercício' },
  { key: 'meditation', label: 'Meditação' },
  { key: 'social', label: 'Social' },
  { key: 'work', label: 'Trabalho' },
] as const

const TRIGGER_OPTIONS = [
  { key: 'stress', label: 'Estresse' },
  { key: 'food', label: 'Alimentação' },
  { key: 'weather', label: 'Clima' },
  { key: 'menstrual_cycle', label: 'Ciclo Menstrual' },
] as const

const SLIDER_FIELDS = [
  { key: 'mood' as const, label: 'Humor', low: 'Péssimo', high: 'Ótimo' },
  { key: 'pain' as const, label: 'Dor', low: 'Nenhuma', high: 'Intensa', inverse: true },
  { key: 'sleepQuality' as const, label: 'Qualidade do Sono', low: 'Péssima', high: 'Ótima' },
  { key: 'anxiety' as const, label: 'Ansiedade', low: 'Nenhuma', high: 'Intensa', inverse: true },
  { key: 'appetite' as const, label: 'Apetite', low: 'Sem fome', high: 'Muita fome' },
  { key: 'energy' as const, label: 'Energia', low: 'Sem energia', high: 'Muita energia' },
] as const

type SliderKey = (typeof SLIDER_FIELDS)[number]['key']

type FormData = {
  [K in SliderKey]: number
} & {
  sleepHours: number
  activities: string[]
  triggers: string[]
  notes: string
}

function getScaleColor(value: number, inverse = false): string {
  const v = inverse ? 10 - value : value
  if (v >= 7) return 'text-brand-700'
  if (v >= 4) return 'text-warning-600'
  return 'text-error-600'
}

// ---------------------------------------------------------------------------
// Vista: Formulário de novo registro
// ---------------------------------------------------------------------------

interface FormViewProps {
  formData: FormData
  onSliderChange: (key: string, value: number) => void
  onToggle: (field: 'activities' | 'triggers', key: string) => void
  onNotesChange: (value: string) => void
  onSubmit: () => void
  submitted: boolean
}

function FormView({
  formData,
  onSliderChange,
  onToggle,
  onNotesChange,
  onSubmit,
  submitted,
}: FormViewProps) {
  return (
    <div className="space-y-5">
      {submitted && (
        <div
          role="status"
          className="flex items-center gap-3 p-4 rounded-lg bg-success-50 border border-success-100"
        >
          <span className="text-success-600 shrink-0" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-medium text-success-700">Registro salvo com sucesso!</p>
            <p className="text-xs text-success-600 mt-0.5">Obrigada por registrar seus sintomas hoje.</p>
          </div>
        </div>
      )}

      {/* Sliders */}
      <Card variant="default" padding="lg">
        <h2 className="font-heading font-semibold text-surface-900 mb-6">
          Como você está hoje?
        </h2>
        <div className="space-y-6">
          {SLIDER_FIELDS.map((field) => (
            <div key={field.key}>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor={`slider-${field.key}`}
                  className="text-sm font-medium text-surface-700"
                >
                  {field.label}
                </label>
                <span
                  className={cn(
                    'text-base font-heading font-bold',
                    getScaleColor(formData[field.key], 'inverse' in field ? field.inverse : false)
                  )}
                  aria-hidden="true"
                >
                  {formData[field.key]}
                </span>
              </div>
              <input
                id={`slider-${field.key}`}
                type="range"
                min={0}
                max={10}
                step={1}
                value={formData[field.key]}
                onChange={(e) => onSliderChange(field.key, Number(e.target.value))}
                className="w-full accent-brand-600"
                aria-valuemin={0}
                aria-valuemax={10}
                aria-valuenow={formData[field.key]}
                aria-label={field.label}
              />
              <div className="flex items-center justify-between text-[10px] text-surface-400 mt-1">
                <span>{field.low}</span>
                <span>{field.high}</span>
              </div>
            </div>
          ))}

          {/* Horas de sono */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="slider-sleepHours" className="text-sm font-medium text-surface-700">
                Horas de Sono
              </label>
              <span className="text-base font-heading font-bold text-brand-700" aria-hidden="true">
                {formData.sleepHours}h
              </span>
            </div>
            <input
              id="slider-sleepHours"
              type="range"
              min={0}
              max={12}
              step={0.5}
              value={formData.sleepHours}
              onChange={(e) => onSliderChange('sleepHours', Number(e.target.value))}
              className="w-full accent-brand-600"
              aria-label="Horas de sono"
            />
            <div className="flex items-center justify-between text-[10px] text-surface-400 mt-1">
              <span>0h</span>
              <span>12h</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Atividades */}
      <Card variant="default" padding="lg">
        <h2 className="font-heading font-semibold text-surface-900 mb-4">
          Atividades de Hoje
        </h2>
        <div className="grid grid-cols-2 gap-3" role="group" aria-label="Atividades realizadas">
          {ACTIVITY_OPTIONS.map((act) => {
            const selected = formData.activities.includes(act.key)
            return (
              <button
                key={act.key}
                type="button"
                onClick={() => onToggle('activities', act.key)}
                aria-pressed={selected}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border text-left text-sm font-medium transition-colors duration-150',
                  selected
                    ? 'bg-brand-50 border-brand-200 text-brand-700'
                    : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50'
                )}
              >
                <span>{act.label}</span>
                {selected && (
                  <span className="ml-auto text-brand-700" aria-hidden="true">✓</span>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Gatilhos */}
      <Card variant="default" padding="lg">
        <h2 className="font-heading font-semibold text-surface-900 mb-4">
          Gatilhos Identificados
        </h2>
        <div className="grid grid-cols-2 gap-3" role="group" aria-label="Gatilhos identificados">
          {TRIGGER_OPTIONS.map((trig) => {
            const selected = formData.triggers.includes(trig.key)
            return (
              <button
                key={trig.key}
                type="button"
                onClick={() => onToggle('triggers', trig.key)}
                aria-pressed={selected}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border text-left text-sm font-medium transition-colors duration-150',
                  selected
                    ? 'bg-warning-50 border-warning-200 text-warning-700'
                    : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50'
                )}
              >
                <span>{trig.label}</span>
                {selected && (
                  <span className="ml-auto text-warning-700" aria-hidden="true">✓</span>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Observações */}
      <Card variant="default" padding="lg">
        <label
          htmlFor="journal-notes"
          className="block font-heading font-semibold text-surface-900 mb-3"
        >
          Observações
        </label>
        <textarea
          id="journal-notes"
          value={formData.notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Como foi seu dia? Algo relevante para o tratamento?"
          rows={4}
          className={cn(
            'w-full px-3 py-2.5 rounded text-sm text-surface-800 bg-white resize-none',
            'border border-surface-300 placeholder:text-surface-400',
            'transition-colors duration-150',
            'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15',
          )}
        />
      </Card>

      <Button
        variant="primary"
        size="lg"
        onClick={onSubmit}
        className="w-full"
      >
        Salvar Registro
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vista: Histórico de entradas
// ---------------------------------------------------------------------------

function HistoryView({ entries }: { entries: JournalEntry[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen size={40} strokeWidth={1} className="text-surface-300" />}
        title="Nenhum registro ainda"
        description="Faça seu primeiro registro no diário de sintomas."
      />
    )
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <Card key={entry.id} variant="default" padding="default">
          <div className="flex items-center justify-between mb-4">
            <p className="font-medium text-surface-900 text-sm capitalize">
              {new Date(entry.date).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
              })}
            </p>
            <span className={cn('text-sm font-bold', getScaleColor(entry.mood))}>
              Humor {entry.mood}/10
            </span>
          </div>

          {/* Mini métricas */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
            {[
              { label: 'Humor', value: entry.mood },
              { label: 'Dor', value: entry.pain },
              { label: 'Sono', value: entry.sleepQuality },
              { label: 'Ansiedade', value: entry.anxiety },
              { label: 'Apetite', value: entry.appetite },
              { label: 'Energia', value: entry.energy },
            ].map((m) => (
              <div key={m.label} className="text-center p-2 rounded-lg bg-surface-50">
                <span className="text-sm font-bold text-surface-900 block">{m.value}</span>
                <p className="text-[10px] text-surface-400 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Horas de sono */}
          <p className="text-xs text-surface-600 mb-3">
            {entry.sleepHours}h de sono
          </p>

          {/* Atividades e gatilhos */}
          {(entry.activities.length > 0 || entry.triggers.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {entry.activities.map((act) => {
                const opt = ACTIVITY_OPTIONS.find((a) => a.key === act)
                return opt ? (
                  <span
                    key={act}
                    className="px-2 py-0.5 rounded-sm bg-brand-100 text-brand-700 text-xs font-medium"
                  >
                    {opt.label}
                  </span>
                ) : null
              })}
              {entry.triggers.map((trig) => {
                const opt = TRIGGER_OPTIONS.find((t) => t.key === trig)
                return opt ? (
                  <span
                    key={trig}
                    className="px-2 py-0.5 rounded-sm bg-warning-100 text-warning-700 text-xs font-medium"
                  >
                    {opt.label}
                  </span>
                ) : null
              })}
            </div>
          )}

          {/* Notas */}
          {entry.notes && (
            <p className="text-sm text-surface-600 italic border-l-2 border-surface-200 pl-3 leading-relaxed">
              {entry.notes}
            </p>
          )}
        </Card>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vista: Resumo semanal
// ---------------------------------------------------------------------------

function SummaryView({ entries }: { entries: JournalEntry[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen size={40} strokeWidth={1} className="text-surface-300" />}
        title="Sem registros para resumir"
        description="Adicione pelo menos um registro para ver seu resumo semanal."
      />
    )
  }

  const avg = (key: keyof Pick<JournalEntry, SliderKey | 'sleepHours'>) =>
    (entries.reduce((s, e) => s + e[key], 0) / entries.length).toFixed(1)

  const metrics = [
    { label: 'Humor', value: avg('mood'), max: 10 },
    { label: 'Dor', value: avg('pain'), max: 10 },
    { label: 'Qualidade do Sono', value: avg('sleepQuality'), max: 10 },
    { label: 'Horas de Sono', value: avg('sleepHours'), max: 12 },
    { label: 'Ansiedade', value: avg('anxiety'), max: 10 },
    { label: 'Energia', value: avg('energy'), max: 10 },
  ]

  return (
    <div className="space-y-5">
      <Card variant="default" padding="lg">
        <p className="text-overline text-surface-400 uppercase text-[11px] font-semibold mb-4">
          Média dos últimos {entries.length} registros
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="p-4 rounded-lg bg-surface-50 text-center">
              <p className="text-2xl font-heading font-bold text-surface-900">{m.value}</p>
              <p className="text-xs text-surface-500 mt-0.5">{m.label}</p>
              <div className="w-full h-1.5 rounded-full bg-surface-200 mt-2" aria-hidden="true">
                <div
                  className="h-1.5 rounded-full bg-brand-500"
                  style={{ width: `${(Number(m.value) / m.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Gráficos de tendência */}
      <div className="grid sm:grid-cols-2 gap-4">
        {(
          [
            { label: 'Humor', key: 'mood' as const, barClass: 'bg-brand-400' },
            { label: 'Qualidade do Sono', key: 'sleepQuality' as const, barClass: 'bg-sage-400' },
          ] as const
        ).map((chart) => (
          <Card key={chart.key} variant="default" padding="lg">
            <h3 className="font-heading font-semibold text-surface-900 mb-4 text-sm">
              {chart.label}
            </h3>
            <div className="flex items-end gap-2 h-20" aria-hidden="true">
              {[...entries].reverse().map((entry, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-medium text-surface-600">
                    {entry[chart.key]}
                  </span>
                  <div
                    className={`w-full rounded-t-sm ${chart.barClass}`}
                    style={{ height: `${(entry[chart.key] / 10) * 100}%` }}
                  />
                  <span className="text-[9px] text-surface-400">
                    {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

type ActiveView = 'form' | 'history' | 'summary'

const VIEWS: { key: ActiveView; label: string }[] = [
  { key: 'form', label: 'Novo registro' },
  { key: 'history', label: 'Histórico' },
  { key: 'summary', label: 'Resumo semanal' },
]

export default function DiarioPage() {
  const [activeView, setActiveView] = useState<ActiveView>('form')
  const [entries] = useState<JournalEntry[]>(MOCK_ENTRIES)

  const [formData, setFormData] = useState<FormData>({
    mood: 5,
    pain: 5,
    sleepQuality: 5,
    sleepHours: 7,
    anxiety: 5,
    appetite: 5,
    energy: 5,
    activities: [],
    triggers: [],
    notes: '',
  })
  const [formSubmitted, setFormSubmitted] = useState(false)

  function handleSliderChange(key: string, value: number) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function handleToggle(field: 'activities' | 'triggers', key: string) {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(key)
        ? prev[field].filter((k) => k !== key)
        : [...prev[field], key],
    }))
  }

  function handleSubmit() {
    setFormSubmitted(true)
    setTimeout(() => setFormSubmitted(false), 4000)
  }

  return (
    <div>
      <PageHeader
        title="Diário de sintomas"
        subtitle="Registre como você está se sentindo e acompanhe sua evolução."
        breadcrumb={[
          { label: 'Tratamento', href: '/tratamento' },
          { label: 'Diário' },
        ]}
        className="-mx-4 -mt-4 lg:-mx-8 lg:-mt-8"
      />

      <div className="pt-6 space-y-5">
        {/* Tabs de vista */}
        <div
          className="flex gap-1 bg-surface-100 rounded-xl p-1"
          role="tablist"
          aria-label="Seções do diário"
        >
          {VIEWS.map((view) => (
            <button
              key={view.key}
              role="tab"
              aria-selected={activeView === view.key}
              onClick={() => setActiveView(view.key)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                activeView === view.key
                  ? 'bg-white text-surface-900 shadow-xs'
                  : 'text-surface-500 hover:text-surface-700'
              )}
            >
              {view.label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        {activeView === 'form' && (
          <FormView
            formData={formData}
            onSliderChange={handleSliderChange}
            onToggle={handleToggle}
            onNotesChange={(value) => setFormData((prev) => ({ ...prev, notes: value }))}
            onSubmit={handleSubmit}
            submitted={formSubmitted}
          />
        )}
        {activeView === 'history' && <HistoryView entries={entries} />}
        {activeView === 'summary' && <SummaryView entries={entries} />}
      </div>
    </div>
  )
}
