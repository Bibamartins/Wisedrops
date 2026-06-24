'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Paperclip,
  Download,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

// ---------------------------------------------------------------------------
// Tipos — preservados do original (medical-records/page.tsx)
// ---------------------------------------------------------------------------

interface MedicalRecord {
  id: string
  type: 'assessment' | 'follow_up' | 'vital_signs' | 'lab_results'
  typeLabel: string
  date: string
  doctor: string
  summary: string
  details: Record<string, string>
  attachments?: { name: string; type: string; size: string }[]
}

interface VitalEntry {
  date: string
  weight: number
  systolic: number
  diastolic: number
  painScale: number
}

// ---------------------------------------------------------------------------
// Mock data — preservado do original
// ---------------------------------------------------------------------------

const MOCK_RECORDS: MedicalRecord[] = [
  {
    id: 'rec-001',
    type: 'follow_up',
    typeLabel: 'Retorno',
    date: '2026-03-20',
    doctor: 'Dr. Carlos Oliveira',
    summary: 'Paciente relata melhora significativa no sono. Reduzir ansiedade noturna continua como meta.',
    details: {
      'Queixa principal': 'Melhora do sono, ansiedade noturna persistente',
      'Avaliação': 'Paciente refere dormir 7-8h por noite, despertares noturnos reduzidos de 4x para 1x',
      'Conduta': 'Manter dose atual CBD 0.5mL 2x/dia. Reavaliar em 30 dias.',
      'Observações': 'Considerar associação com técnicas de relaxamento. Solicitar exames de controle.',
    },
    attachments: [
      { name: 'receita-digital-rx2026-00847.pdf', type: 'PDF', size: '245 KB' },
    ],
  },
  {
    id: 'rec-002',
    type: 'vital_signs',
    typeLabel: 'Sinais Vitais',
    date: '2026-03-20',
    doctor: 'Dr. Carlos Oliveira',
    summary: 'Sinais vitais coletados durante consulta de retorno.',
    details: {
      'Peso': '68 kg',
      'Pressão Arterial': '120/80 mmHg',
      'Frequência Cardíaca': '72 bpm',
      'Escala de Dor': '2/10',
      'Saturação O2': '98%',
      'Temperatura': '36.4 °C',
    },
  },
  {
    id: 'rec-003',
    type: 'lab_results',
    typeLabel: 'Exames Laboratoriais',
    date: '2026-03-10',
    doctor: 'Dr. Carlos Oliveira',
    summary: 'Exames de controle trimestrais. Todos dentro dos parâmetros normais.',
    details: {
      'Hemograma': 'Normal — sem alterações',
      'TGO/TGP': 'TGO: 22 U/L | TGP: 18 U/L (normal)',
      'Creatinina': '0.9 mg/dL (normal)',
      'Glicemia jejum': '89 mg/dL (normal)',
      'TSH': '2.1 mUI/L (normal)',
      'Colesterol Total': '185 mg/dL',
    },
    attachments: [
      { name: 'exames-laboratoriais-mar2026.pdf', type: 'PDF', size: '1.2 MB' },
      { name: 'laudo-hemograma.pdf', type: 'PDF', size: '340 KB' },
    ],
  },
  {
    id: 'rec-004',
    type: 'assessment',
    typeLabel: 'Avaliação Inicial',
    date: '2026-01-15',
    doctor: 'Dr. Carlos Oliveira',
    summary: 'Primeira consulta. Paciente com insônia crônica há 2 anos, falha terapêutica com zolpidem.',
    details: {
      'História da doença': 'Insônia crônica de manutenção há 2 anos. Uso prévio de zolpidem 10mg com dependência.',
      'Comorbidades': 'Ansiedade generalizada (TAG)',
      'Medicamentos atuais': 'Sertralina 50mg/dia',
      'Alergias': 'Nenhuma conhecida',
      'Exame físico': 'BEG, lúcida, orientada. PA 130/85. IMC 24.2',
      'Plano': 'Iniciar CBD Full Spectrum 7.5mg/dia sublingual. Titulação gradual.',
      'CID-10': 'G47.0 (Insônia), F41.1 (TAG)',
    },
    attachments: [
      { name: 'termo-consentimento-assinado.pdf', type: 'PDF', size: '180 KB' },
      { name: 'receita-digital-rx2026-00623.pdf', type: 'PDF', size: '220 KB' },
    ],
  },
  {
    id: 'rec-005',
    type: 'follow_up',
    typeLabel: 'Retorno',
    date: '2026-02-15',
    doctor: 'Dr. Carlos Oliveira',
    summary: 'Retorno 30 dias. Boa tolerância ao CBD. Efeito parcial. Aumentar dose.',
    details: {
      'Evolução': 'Melhora parcial do sono. Duração de 5h para 6.5h. Latência reduzida.',
      'Efeitos adversos': 'Sonolência matinal leve nos primeiros 5 dias, resolvida espontaneamente.',
      'Conduta': 'Aumentar para CBD 15mg 1x/dia (noite). Manter sertralina.',
      'Próxima consulta': '30 dias',
    },
  },
  {
    id: 'rec-006',
    type: 'vital_signs',
    typeLabel: 'Sinais Vitais',
    date: '2026-02-15',
    doctor: 'Dr. Carlos Oliveira',
    summary: 'Sinais vitais do retorno de fevereiro.',
    details: {
      'Peso': '67.5 kg',
      'Pressão Arterial': '125/82 mmHg',
      'Frequência Cardíaca': '70 bpm',
      'Escala de Dor': '3/10',
      'Saturação O2': '97%',
    },
  },
]

const MOCK_VITALS: VitalEntry[] = [
  { date: 'Jan', weight: 69, systolic: 130, diastolic: 85, painScale: 5 },
  { date: 'Fev', weight: 67.5, systolic: 125, diastolic: 82, painScale: 3 },
  { date: 'Mar', weight: 68, systolic: 120, diastolic: 80, painScale: 2 },
]

// Mapeamento de tipo → badge variant
const TYPE_BADGE_VARIANT: Record<MedicalRecord['type'], React.ComponentProps<typeof Badge>['variant']> = {
  assessment:  'info',
  follow_up:   'brand',
  vital_signs: 'sage',
  lab_results: 'warning',
}

// ---------------------------------------------------------------------------
// Filtros
// ---------------------------------------------------------------------------

const FILTER_OPTIONS = [
  { key: 'all', label: 'Todos' },
  { key: 'assessment', label: 'Avaliação' },
  { key: 'follow_up', label: 'Retorno' },
  { key: 'vital_signs', label: 'Sinais vitais' },
  { key: 'lab_results', label: 'Exames' },
] as const

type FilterKey = (typeof FILTER_OPTIONS)[number]['key']

// ---------------------------------------------------------------------------
// Card de registro da timeline
// ---------------------------------------------------------------------------

interface RecordCardProps {
  record: MedicalRecord
  isLast: boolean
}

function RecordCard({ record, isLast }: RecordCardProps) {
  const [expanded, setExpanded] = useState(false)
  const badgeVariant = TYPE_BADGE_VARIANT[record.type]

  return (
    <div className="flex gap-4">
      {/* Timeline visual */}
      <div className="flex flex-col items-center shrink-0" aria-hidden="true">
        <div
          className={cn(
            'w-3 h-3 rounded-full border-2 mt-4 shrink-0',
            record.type === 'assessment'  ? 'border-info-500 bg-info-100' :
            record.type === 'follow_up'   ? 'border-brand-500 bg-brand-100' :
            record.type === 'vital_signs' ? 'border-sage-500 bg-sage-100' :
                                             'border-warning-500 bg-warning-100'
          )}
        />
        {!isLast && <div className="w-0.5 flex-1 bg-surface-200 my-1" />}
      </div>

      {/* Cartão */}
      <div className={cn('flex-1 mb-4', isLast && 'mb-0')}>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full text-left"
          aria-expanded={expanded}
          aria-controls={`record-detail-${record.id}`}
        >
          <Card
            variant="default"
            padding="default"
            className="hover:border-surface-300 hover:shadow-sm transition-all duration-150"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant={badgeVariant}>{record.typeLabel}</Badge>
                  <span className="text-xs text-surface-400">
                    {new Date(record.date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-xs text-surface-500">{record.doctor}</p>
              </div>
              <span className="text-surface-400 shrink-0 mt-0.5" aria-hidden="true">
                {expanded
                  ? <ChevronUp size={16} strokeWidth={1.5} />
                  : <ChevronDown size={16} strokeWidth={1.5} />
                }
              </span>
            </div>
            <p className="text-sm text-surface-700 leading-relaxed">{record.summary}</p>
          </Card>
        </button>

        {/* Detalhes expandidos */}
        {expanded && (
          <div
            id={`record-detail-${record.id}`}
            className="mt-2 p-5 rounded-lg bg-surface-50 border border-surface-200 space-y-4 animate-fade-in"
          >
            <div className="space-y-3">
              {Object.entries(record.details).map(([key, value]) => (
                <div key={key}>
                  <p className="text-overline text-surface-400 uppercase text-[11px] font-semibold mb-0.5">
                    {key}
                  </p>
                  <p className="text-sm text-surface-900">{value}</p>
                </div>
              ))}
            </div>

            {record.attachments && record.attachments.length > 0 && (
              <div className="pt-3 border-t border-surface-200">
                <p className="text-overline text-surface-400 uppercase text-[11px] font-semibold mb-3">
                  Documentos
                </p>
                <div className="space-y-2">
                  {record.attachments.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-white border border-surface-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Paperclip size={14} strokeWidth={1.5} className="text-surface-400 shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-surface-900 truncate">{att.name}</p>
                          <p className="text-xs text-surface-400">{att.type} — {att.size}</p>
                        </div>
                      </div>
                      <button
                        className="text-sm font-medium text-brand-700 hover:text-brand-800 transition-colors duration-150 flex items-center gap-1 shrink-0 ml-3"
                        aria-label={`Baixar ${att.name}`}
                      >
                        <Download size={14} strokeWidth={1.5} aria-hidden="true" />
                        Baixar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vista: Sinais vitais
// ---------------------------------------------------------------------------

function VitalsView() {
  return (
    <div className="space-y-5">
      {/* Peso */}
      <Card variant="default" padding="lg">
        <h3 className="font-heading font-semibold text-surface-900 mb-4 text-sm">
          Peso (kg)
        </h3>
        <div className="flex items-end gap-4 h-28" aria-label="Gráfico de peso" role="img">
          {MOCK_VITALS.map((v, i) => {
            const pct = ((v.weight - 60) / 20) * 100
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-surface-600">{v.weight}</span>
                <div
                  className="w-full rounded-t-sm bg-brand-400"
                  style={{ height: `${Math.max(10, pct)}%` }}
                />
                <span className="text-[10px] text-surface-400">{v.date}</span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Pressão arterial */}
      <Card variant="default" padding="lg">
        <h3 className="font-heading font-semibold text-surface-900 mb-2 text-sm">
          Pressão Arterial (mmHg)
        </h3>
        <div className="flex items-center gap-4 text-xs text-surface-500 mb-4" aria-hidden="true">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-error-400 inline-block" />
            Sistólica
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-info-400 inline-block" />
            Diastólica
          </span>
        </div>
        <div
          className="flex items-end gap-4 h-28"
          aria-label="Gráfico de pressão arterial"
          role="img"
        >
          {MOCK_VITALS.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-end gap-1 w-full h-24">
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-medium text-error-700">{v.systolic}</span>
                  <div
                    className="w-full rounded-t-sm bg-error-400"
                    style={{ height: `${(v.systolic / 160) * 100}%` }}
                  />
                </div>
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-medium text-info-700">{v.diastolic}</span>
                  <div
                    className="w-full rounded-t-sm bg-info-400"
                    style={{ height: `${(v.diastolic / 160) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-surface-400">{v.date}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Escala de dor */}
      <Card variant="default" padding="lg">
        <h3 className="font-heading font-semibold text-surface-900 mb-1 text-sm">
          Escala de Dor (0–10)
        </h3>
        <p className="text-xs text-surface-400 mb-4">Menor é melhor</p>
        <div className="flex items-end gap-4 h-28" aria-label="Gráfico de escala de dor" role="img">
          {MOCK_VITALS.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-surface-600">{v.painScale}</span>
              <div
                className="w-full rounded-t-sm bg-sage-400"
                style={{ height: `${(v.painScale / 10) * 100}%` }}
              />
              <span className="text-[10px] text-surface-400">{v.date}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

type ActiveView = 'timeline' | 'vitals'

export default function HistoricoPage() {
  const [activeView, setActiveView] = useState<ActiveView>('timeline')
  const [typeFilter, setTypeFilter] = useState<FilterKey>('all')

  const filteredRecords = MOCK_RECORDS.filter((r) => {
    if (typeFilter === 'all') return true
    return r.type === typeFilter
  })

  return (
    <div>
      <PageHeader
        title="Histórico clínico"
        subtitle="Prontuário, condições, alergias, medicações em uso e evolução do tratamento."
        breadcrumb={[
          { label: 'Tratamento', href: '/tratamento' },
          { label: 'Histórico' },
        ]}
        className="-mx-4 -mt-4 lg:-mx-8 lg:-mt-8"
      />

      <div className="pt-6 space-y-5">
        {/* Tabs de vista */}
        <div
          className="flex gap-1 bg-surface-100 rounded-xl p-1"
          role="tablist"
          aria-label="Seções do histórico"
        >
          {(
            [
              { key: 'timeline' as ActiveView, label: 'Linha do tempo' },
              { key: 'vitals' as ActiveView, label: 'Sinais vitais' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeView === tab.key}
              onClick={() => setActiveView(tab.key)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                activeView === tab.key
                  ? 'bg-white text-surface-900 shadow-xs'
                  : 'text-surface-500 hover:text-surface-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Timeline */}
        {activeView === 'timeline' && (
          <>
            {/* Filtros */}
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filtrar por tipo de registro"
            >
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTypeFilter(opt.key)}
                  aria-pressed={typeFilter === opt.key}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150',
                    typeFilter === opt.key
                      ? 'bg-brand-600 text-white'
                      : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Registros */}
            {filteredRecords.length === 0 ? (
              <EmptyState
                icon={<AlertCircle size={40} strokeWidth={1} className="text-surface-300" />}
                title="Nenhum registro encontrado"
                description="Tente um filtro diferente ou aguarde novos registros do seu médico."
                action={
                  typeFilter !== 'all' ? (
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => setTypeFilter('all')}
                    >
                      Ver todos os registros
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div>
                {filteredRecords.map((record, idx) => (
                  <RecordCard
                    key={record.id}
                    record={record}
                    isLast={idx === filteredRecords.length - 1}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Sinais vitais */}
        {activeView === 'vitals' && <VitalsView />}
      </div>
    </div>
  )
}
