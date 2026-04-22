'use client'

import { useState } from 'react'

// --- Types ---
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

// --- Mock Data ---
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
      'Avaliacao': 'Paciente refere dormir 7-8h por noite, despertares noturnos reduzidos de 4x para 1x',
      'Conduta': 'Manter dose atual CBD 0.5mL 2x/dia. Reavaliar em 30 dias.',
      'Observacoes': 'Considerar associacao com tecnicas de relaxamento. Solicitar exames de controle.',
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
      'Pressao Arterial': '120/80 mmHg',
      'Frequencia Cardiaca': '72 bpm',
      'Escala de Dor': '2/10',
      'Saturacao O2': '98%',
      'Temperatura': '36.4 C',
    },
  },
  {
    id: 'rec-003',
    type: 'lab_results',
    typeLabel: 'Exames Laboratoriais',
    date: '2026-03-10',
    doctor: 'Dr. Carlos Oliveira',
    summary: 'Exames de controle trimestrais. Todos dentro dos parametros normais.',
    details: {
      'Hemograma': 'Normal — sem alteracoes',
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
    typeLabel: 'Avaliacao Inicial',
    date: '2026-01-15',
    doctor: 'Dr. Carlos Oliveira',
    summary: 'Primeira consulta. Paciente com insonia cronica ha 2 anos, falha terapeutica com zolpidem.',
    details: {
      'Historia da doenca': 'Insonia cronica de manutencao ha 2 anos. Uso previo de zolpidem 10mg com dependencia.',
      'Comorbidades': 'Ansiedade generalizada (TAG)',
      'Medicamentos atuais': 'Sertralina 50mg/dia',
      'Alergias': 'Nenhuma conhecida',
      'Exame fisico': 'BEG, lucida, orientada. PA 130/85. IMC 24.2',
      'Plano': 'Iniciar CBD Full Spectrum 7.5mg/dia sublingual. Titulacao gradual.',
      'CID-10': 'G47.0 (Insonia), F41.1 (TAG)',
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
    summary: 'Retorno 30 dias. Boa tolerancia ao CBD. Efeito parcial. Aumentar dose.',
    details: {
      'Evolucao': 'Melhora parcial do sono. Duracao de 5h para 6.5h. Latencia reduzida.',
      'Efeitos adversos': 'Sonolencia matinal leve nos primeiros 5 dias, resolvida espontaneamente.',
      'Conduta': 'Aumentar para CBD 15mg 1x/dia (noite). Manter sertralina.',
      'Proxima consulta': '30 dias',
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
      'Pressao Arterial': '125/82 mmHg',
      'Frequencia Cardiaca': '70 bpm',
      'Escala de Dor': '3/10',
      'Saturacao O2': '97%',
    },
  },
]

const MOCK_VITALS: VitalEntry[] = [
  { date: 'Jan', weight: 69, systolic: 130, diastolic: 85, painScale: 5 },
  { date: 'Fev', weight: 67.5, systolic: 125, diastolic: 82, painScale: 3 },
  { date: 'Mar', weight: 68, systolic: 120, diastolic: 80, painScale: 2 },
]

const RECORD_TYPE_CONFIG: Record<string, { color: string; icon: string }> = {
  assessment: { color: 'bg-purple-100 text-purple-700', icon: '📋' },
  follow_up: { color: 'bg-brand-100 text-brand-700', icon: '🔄' },
  vital_signs: { color: 'bg-blue-100 text-blue-700', icon: '❤️' },
  lab_results: { color: 'bg-amber-100 text-amber-700', icon: '🧪' },
}

export default function MedicalRecordsPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'timeline' | 'vitals'>('timeline')

  const filteredRecords = MOCK_RECORDS.filter((r) => {
    if (typeFilter === 'all') return true
    return r.type === typeFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900">Prontuario</h1>
        <p className="text-surface-500">Seus registros medicos e evolucao do tratamento</p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1">
        <button
          onClick={() => setActiveView('timeline')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
            activeView === 'timeline'
              ? 'bg-white text-surface-900 shadow-sm'
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          Linha do Tempo
        </button>
        <button
          onClick={() => setActiveView('vitals')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
            activeView === 'vitals'
              ? 'bg-white text-surface-900 shadow-sm'
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          Graficos de Sinais Vitais
        </button>
      </div>

      {activeView === 'timeline' && (
        <>
          {/* Type Filter */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'assessment', label: 'Avaliacao' },
              { key: 'follow_up', label: 'Retorno' },
              { key: 'vital_signs', label: 'Sinais Vitais' },
              { key: 'lab_results', label: 'Exames' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTypeFilter(opt.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  typeFilter === opt.key
                    ? 'bg-brand-600 text-white'
                    : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Timeline */}
          <div className="space-y-0">
            {filteredRecords.map((record, idx) => {
              const config = RECORD_TYPE_CONFIG[record.type]
              const isExpanded = expandedRecord === record.id
              return (
                <div key={record.id} className="flex gap-4">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                      <span>{config.icon}</span>
                    </div>
                    {idx < filteredRecords.length - 1 && (
                      <div className="w-0.5 flex-1 bg-surface-200 my-1" />
                    )}
                  </div>

                  {/* Card */}
                  <div className="flex-1 mb-4">
                    <button
                      onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                      className="w-full text-left p-5 rounded-2xl bg-white border border-surface-200 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                              {record.typeLabel}
                            </span>
                            <span className="text-xs text-surface-400">
                              {new Date(record.date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-xs text-surface-500">{record.doctor}</p>
                        </div>
                        <span className="text-xs text-surface-400">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                      <p className="text-sm text-surface-700">{record.summary}</p>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-2 p-5 rounded-2xl bg-surface-50 border border-surface-200 space-y-4">
                        {/* Structured Data */}
                        <div className="space-y-3">
                          {Object.entries(record.details).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-0.5">
                                {key}
                              </p>
                              <p className="text-sm text-surface-900">{value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Attachments */}
                        {record.attachments && record.attachments.length > 0 && (
                          <div className="pt-3 border-t border-surface-200">
                            <p className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-2">
                              Documentos
                            </p>
                            <div className="space-y-2">
                              {record.attachments.map((att, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-surface-200"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg">📎</span>
                                    <div>
                                      <p className="text-sm font-medium text-surface-900">{att.name}</p>
                                      <p className="text-xs text-surface-400">{att.type} — {att.size}</p>
                                    </div>
                                  </div>
                                  <button className="text-sm text-brand-600 hover:underline">Baixar</button>
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
            })}
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-16">
              <span className="text-5xl block mb-4">🏥</span>
              <p className="text-surface-500">Nenhum registro encontrado para este filtro</p>
            </div>
          )}
        </>
      )}

      {activeView === 'vitals' && (
        <div className="space-y-6">
          {/* Weight Chart */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h3 className="font-heading font-semibold text-surface-900 mb-4">Peso (kg)</h3>
            <div className="flex items-end gap-4 h-32">
              {MOCK_VITALS.map((v, i) => {
                const minW = 60
                const maxW = 80
                const pct = ((v.weight - minW) / (maxW - minW)) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-surface-600">{v.weight}</span>
                    <div
                      className="w-full rounded-t-lg bg-brand-400"
                      style={{ height: `${Math.max(10, pct)}%` }}
                    />
                    <span className="text-[10px] text-surface-400">{v.date}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Blood Pressure Chart */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h3 className="font-heading font-semibold text-surface-900 mb-4">Pressao Arterial (mmHg)</h3>
            <div className="flex items-center gap-4 text-xs text-surface-500 mb-3">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400" /> Sistolica</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400" /> Diastolica</span>
            </div>
            <div className="flex items-end gap-4 h-32">
              {MOCK_VITALS.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-1 w-full" style={{ height: '100%' }}>
                    <div className="flex-1 flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-medium text-red-600">{v.systolic}</span>
                      <div
                        className="w-full rounded-t-lg bg-red-400"
                        style={{ height: `${(v.systolic / 160) * 100}%` }}
                      />
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-medium text-blue-600">{v.diastolic}</span>
                      <div
                        className="w-full rounded-t-lg bg-blue-400"
                        style={{ height: `${(v.diastolic / 160) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-surface-400">{v.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pain Scale Chart */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h3 className="font-heading font-semibold text-surface-900 mb-1">Escala de Dor (0-10)</h3>
            <p className="text-xs text-surface-400 mb-4">Menor e melhor</p>
            <div className="flex items-end gap-4 h-32">
              {MOCK_VITALS.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-surface-600">{v.painScale}</span>
                  <div
                    className="w-full rounded-t-lg bg-accent-400"
                    style={{ height: `${(v.painScale / 10) * 100}%` }}
                  />
                  <span className="text-[10px] text-surface-400">{v.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
