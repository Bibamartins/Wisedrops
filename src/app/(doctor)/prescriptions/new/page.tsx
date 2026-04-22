'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import { addRequest as addAnvisaRequest } from '@/lib/anvisa-store'

// ─── Types ────────────────────────────────────────────────────────
interface PrescriptionItem {
  id: string
  product: string
  concentration: string
  dosage: string
  frequency: string
  quantity: string
  duration: string
  instructions: string
  isControlled: boolean
}

interface PatientOption {
  id: string
  name: string
  cpf: string
  conditions: string[]
}

interface ConsultationOption {
  id: string
  date: string
  summary: string
}

interface ICD10Option {
  code: string
  description: string
}

// ─── Mock Data ────────────────────────────────────────────────────
const MOCK_PATIENTS: PatientOption[] = [
  { id: '1', name: 'Maria Silva', cpf: '123.456.789-00', conditions: ['Insonia', 'Ansiedade Leve'] },
  { id: '2', name: 'Joao Santos', cpf: '234.567.890-11', conditions: ['Dor Cronica'] },
  { id: '3', name: 'Roberto Lima', cpf: '345.678.901-22', conditions: ['Ansiedade'] },
  { id: '4', name: 'Carla Mendes', cpf: '456.789.012-33', conditions: ['Depressao'] },
  { id: '5', name: 'Fernando Souza', cpf: '567.890.123-44', conditions: ['Autismo'] },
  { id: '6', name: 'Ana Pereira', cpf: '678.901.234-55', conditions: ['Ansiedade'] },
  { id: '7', name: 'Pedro Costa', cpf: '789.012.345-66', conditions: ['Epilepsia'] },
  { id: '8', name: 'Lucia Ferreira', cpf: '890.123.456-77', conditions: ['Fibromialgia'] },
]

const MOCK_CONSULTATIONS: Record<string, ConsultationOption[]> = {
  '1': [
    { id: 'c1', date: '31/03/2026', summary: 'Retorno — melhora no sono' },
    { id: 'c2', date: '28/02/2026', summary: 'Ajuste de dosagem CBD' },
  ],
  '2': [
    { id: 'c3', date: '31/03/2026', summary: 'Retorno — avaliacao de dor' },
  ],
  '3': [
    { id: 'c4', date: '28/03/2026', summary: 'Retorno — aderencia baixa' },
  ],
}

const MOCK_PRODUCTS = [
  { name: 'Full Spectrum CBD Oil 3000mg', concentration: '100mg/mL', controlled: false },
  { name: 'Full Spectrum CBD Oil 1500mg', concentration: '50mg/mL', controlled: false },
  { name: 'CBD Isolate Caps 25mg', concentration: '25mg', controlled: false },
  { name: 'CBN Isolate Caps 25mg', concentration: '25mg', controlled: false },
  { name: 'THC:CBD 1:1 Oil 30mL', concentration: '15mg:15mg/mL', controlled: true },
  { name: 'THC Rich Oil 30mL', concentration: '30mg/mL THC', controlled: true },
  { name: 'CBD:CBG Broad Spectrum 30mL', concentration: '50mg:25mg/mL', controlled: false },
  { name: 'Cannabis Flower (Bedrocan)', concentration: '22% THC', controlled: true },
]

const MOCK_ICD10: ICD10Option[] = [
  { code: 'G47.0', description: 'Insonia' },
  { code: 'F41.1', description: 'Transtorno de ansiedade generalizada' },
  { code: 'F32.1', description: 'Episodio depressivo moderado' },
  { code: 'G40.9', description: 'Epilepsia nao especificada' },
  { code: 'M79.7', description: 'Fibromialgia' },
  { code: 'R52', description: 'Dor nao classificada em outra parte' },
  { code: 'F84.0', description: 'Autismo infantil' },
  { code: 'F43.1', description: 'Transtorno de estresse pos-traumatico' },
  { code: 'G20', description: 'Doenca de Parkinson' },
]

type PrescriptionType = 'simples' | 'tipo-b' | 'tipo-a'

function detectPrescriptionType(items: PrescriptionItem[]): PrescriptionType {
  if (items.some((i) => i.product.includes('Flower') || i.product.includes('THC Rich'))) return 'tipo-a'
  if (items.some((i) => i.isControlled)) return 'tipo-b'
  return 'simples'
}

function prescriptionTypeLabel(t: PrescriptionType) {
  const map: Record<PrescriptionType, { label: string; classes: string; description: string }> = {
    'simples': { label: 'Receita Simples', classes: 'bg-brand-50 text-brand-700', description: 'Para produtos apenas com CBD ou sem THC relevante' },
    'tipo-b': { label: 'Receita Tipo B (Azul)', classes: 'bg-blue-50 text-blue-700', description: 'Para produtos com THC em formulacoes 1:1 ou similares' },
    'tipo-a': { label: 'Receita Tipo A (Amarela)', classes: 'bg-yellow-50 text-yellow-700', description: 'Para produtos com THC predominante ou flores' },
  }
  return map[t]
}

let itemIdCounter = 0
function newItemId() {
  return `item-${++itemIdCounter}`
}

export default function NewPrescriptionPage() {
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null)
  const [items, setItems] = useState<PrescriptionItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [icdSearch, setIcdSearch] = useState('')
  const [selectedICDs, setSelectedICDs] = useState<ICD10Option[]>([])
  const [justification, setJustification] = useState('')
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [submittedProtocol, setSubmittedProtocol] = useState<string | null>(null)
  const router = useRouter()

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return []
    const q = patientSearch.toLowerCase()
    return MOCK_PATIENTS.filter((p) => p.name.toLowerCase().includes(q) || p.cpf.includes(q))
  }, [patientSearch])

  const selectedPatient = MOCK_PATIENTS.find((p) => p.id === selectedPatientId)
  const consultations = selectedPatientId ? (MOCK_CONSULTATIONS[selectedPatientId] || []) : []

  const filteredProducts = useMemo(() => {
    if (!productSearch) return []
    return MOCK_PRODUCTS.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
  }, [productSearch])

  const filteredICDs = useMemo(() => {
    if (!icdSearch) return []
    const q = icdSearch.toLowerCase()
    return MOCK_ICD10.filter((i) => i.code.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
  }, [icdSearch])

  const detectedType = detectPrescriptionType(items)
  const typeInfo = prescriptionTypeLabel(detectedType)

  function addProduct(product: typeof MOCK_PRODUCTS[0]) {
    setItems([...items, {
      id: newItemId(),
      product: product.name,
      concentration: product.concentration,
      dosage: '',
      frequency: '',
      quantity: '',
      duration: '',
      instructions: '',
      isControlled: product.controlled,
    }])
    setProductSearch('')
  }

  function updateItem(id: string, field: keyof PrescriptionItem, value: string) {
    setItems(items.map((i) => i.id === id ? { ...i, [field]: value } : i))
  }

  function removeItem(id: string) {
    setItems(items.filter((i) => i.id !== id))
  }

  function addICD(icd: ICD10Option) {
    if (!selectedICDs.find((s) => s.code === icd.code)) {
      setSelectedICDs([...selectedICDs, icd])
    }
    setIcdSearch('')
  }

  function removeICD(code: string) {
    setSelectedICDs(selectedICDs.filter((i) => i.code !== code))
  }

  function canSubmit(): boolean {
    return !!selectedPatient && items.length > 0 && selectedICDs.length > 0
  }

  function sendPrescription() {
    if (!selectedPatient || items.length === 0) return
    const productSummary = items.length === 1
      ? `${items[0].product} (${items[0].concentration})`
      : `${items[0].product} +${items.length - 1}`
    const req = addAnvisaRequest({
      patient: selectedPatient.name,
      doctor: 'Dr. Carlos Oliveira',
      product: productSummary,
      icd10: selectedICDs.map((i) => i.code).join(', '),
      justification,
      patientDocsUploaded: false,
    })
    setSubmittedProtocol(req.protocol)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/patients" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline mb-2">
            ← Voltar
          </Link>
          <h1 className="text-2xl font-heading font-bold text-surface-900">Nova Receita</h1>
          <p className="text-surface-500">Preencha os dados para gerar a prescricao</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 rounded-lg border border-surface-200 text-sm font-medium text-surface-700 hover:bg-surface-50 transition"
          >
            {showPreview ? 'Fechar Preview' : 'Visualizar'}
          </button>
          <button className="px-5 py-2 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition">
            Assinar e Enviar
          </button>
        </div>
      </div>

      <div className={`grid ${showPreview ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
        {/* Form */}
        <div className="space-y-6">
          {/* Prescription Type Indicator */}
          {items.length > 0 && (
            <div className={`p-4 rounded-2xl border-2 ${
              detectedType === 'tipo-a' ? 'border-yellow-300 bg-yellow-50' :
              detectedType === 'tipo-b' ? 'border-blue-300 bg-blue-50' :
              'border-brand-300 bg-brand-50'
            }`}>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${typeInfo.classes}`}>
                  {typeInfo.label}
                </span>
                <span className="text-sm text-surface-600">{typeInfo.description}</span>
              </div>
            </div>
          )}

          {/* Patient Selector */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-4">Paciente</h2>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-brand-50 border border-brand-200">
                <div>
                  <p className="font-medium text-surface-900">{selectedPatient.name}</p>
                  <p className="text-xs text-surface-500">CPF: {selectedPatient.cpf} — {selectedPatient.conditions.join(', ')}</p>
                </div>
                <button onClick={() => { setSelectedPatientId(null); setSelectedConsultationId(null) }} className="text-sm text-red-600 hover:underline">
                  Alterar
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar paciente por nome ou CPF..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {filteredPatients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {filteredPatients.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedPatientId(p.id); setPatientSearch('') }}
                        className="w-full text-left px-4 py-3 hover:bg-surface-50 transition border-b border-surface-100 last:border-b-0"
                      >
                        <p className="font-medium text-surface-900">{p.name}</p>
                        <p className="text-xs text-surface-500">{p.cpf} — {p.conditions.join(', ')}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Linked Consultation */}
          {selectedPatientId && (
            <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
              <h2 className="font-heading font-semibold text-surface-900 mb-4">Consulta Vinculada</h2>
              {consultations.length > 0 ? (
                <div className="space-y-2">
                  {consultations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedConsultationId(c.id)}
                      className={`w-full text-left p-3 rounded-xl border transition ${
                        selectedConsultationId === c.id
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-surface-200 hover:border-surface-300'
                      }`}
                    >
                      <p className="font-medium text-surface-900">{c.date}</p>
                      <p className="text-xs text-surface-500">{c.summary}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-surface-400 italic">Nenhuma consulta recente encontrada para este paciente.</p>
              )}
            </div>
          )}

          {/* Products / Medications */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-4">Medicamentos / Produtos</h2>

            {/* Product Search */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Buscar produto canabico..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => addProduct(p)}
                      className="w-full text-left px-4 py-3 hover:bg-surface-50 transition border-b border-surface-100 last:border-b-0 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-surface-900">{p.name}</p>
                        <p className="text-xs text-surface-500">{p.concentration}</p>
                      </div>
                      {p.controlled && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">Controlado</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Item List */}
            {items.length === 0 && (
              <p className="text-sm text-surface-400 italic text-center py-4">Adicione pelo menos um produto para continuar.</p>
            )}
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={item.id} className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-surface-400">#{idx + 1}</span>
                      <p className="font-medium text-surface-900">{item.product}</p>
                      <span className="text-xs text-surface-500">({item.concentration})</span>
                      {item.isControlled && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">Controlado</span>
                      )}
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                      Remover
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-surface-600 mb-1">Dosagem</label>
                      <input
                        type="text"
                        placeholder="Ex: 0.5mL"
                        value={item.dosage}
                        onChange={(e) => updateItem(item.id, 'dosage', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-surface-600 mb-1">Frequencia</label>
                      <input
                        type="text"
                        placeholder="Ex: 2x ao dia"
                        value={item.frequency}
                        onChange={(e) => updateItem(item.id, 'frequency', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-surface-600 mb-1">Quantidade</label>
                      <input
                        type="text"
                        placeholder="Ex: 1 frasco"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-surface-600 mb-1">Duracao</label>
                      <input
                        type="text"
                        placeholder="Ex: 30 dias"
                        value={item.duration}
                        onChange={(e) => updateItem(item.id, 'duration', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-surface-600 mb-1">Instrucoes de Uso</label>
                      <input
                        type="text"
                        placeholder="Ex: Tomar sublingual, 30 min antes de dormir"
                        value={item.instructions}
                        onChange={(e) => updateItem(item.id, 'instructions', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ICD-10 */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-4">Codigos CID-10</h2>
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Buscar por codigo ou descricao..."
                value={icdSearch}
                onChange={(e) => setIcdSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {filteredICDs.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredICDs.map((i) => (
                    <button
                      key={i.code}
                      onClick={() => addICD(i)}
                      className="w-full text-left px-4 py-2 hover:bg-surface-50 transition border-b border-surface-100 last:border-b-0"
                    >
                      <span className="font-mono font-medium text-brand-600">{i.code}</span>
                      <span className="text-sm text-surface-600 ml-2">{i.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedICDs.map((i) => (
                <span key={i.code} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-sm font-medium">
                  {i.code} — {i.description}
                  <button onClick={() => removeICD(i.code)} className="ml-1 text-brand-400 hover:text-red-600">&times;</button>
                </span>
              ))}
              {selectedICDs.length === 0 && <p className="text-sm text-surface-400 italic">Nenhum CID selecionado.</p>}
            </div>
          </div>

          {/* Justification */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-4">Justificativa Clinica</h2>
            <textarea
              rows={4}
              placeholder="Descreva a justificativa clinica para esta prescricao..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Actions */}
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm text-surface-600 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                className="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
              />
              Salvar como modelo para reutilizacao
            </label>
            <div className="flex gap-3">
              <button className="px-4 py-2 rounded-lg border border-surface-200 text-sm font-medium text-surface-700 hover:bg-surface-50 transition">
                Salvar Rascunho
              </button>
              <button
                onClick={sendPrescription}
                disabled={!canSubmit()}
                className="px-5 py-2.5 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Assinar e Enviar Receita
              </button>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {submittedProtocol && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="w-full max-w-md p-8 rounded-2xl bg-white shadow-xl">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-heading font-bold text-center text-surface-900 mb-2">
                Receita enviada a ANVISA
              </h2>
              <p className="text-sm text-surface-500 text-center mb-4">
                Protocolo <strong className="font-mono text-surface-900">{submittedProtocol}</strong> gerado
                e encaminhado para autorizacao.
              </p>
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 text-sm text-surface-600 space-y-1 mb-5">
                <p><strong className="text-surface-900">Proximos passos:</strong></p>
                <p>1. O paciente sera notificado para enviar documentos.</p>
                <p>2. O administrador recebera a solicitacao na Fila ANVISA.</p>
                <p>3. Prazo medio de autorizacao: 10-14 dias.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSubmittedProtocol(null)
                    setItems([])
                    setSelectedICDs([])
                    setSelectedPatientId(null)
                    setJustification('')
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-surface-200 text-surface-700 text-sm font-medium hover:bg-surface-50 transition"
                >
                  Nova Receita
                </button>
                <button
                  onClick={() => router.push('/doctor-dashboard')}
                  className="flex-1 px-4 py-2.5 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition"
                >
                  Ir ao Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Panel */}
        {showPreview && (
          <div className="p-6 rounded-2xl bg-white border-2 border-surface-300 shadow-sm sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="text-center mb-6 pb-4 border-b border-surface-200">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-lg gradient-brand flex items-center justify-center">
                  <span className="text-white font-bold">W</span>
                </div>
              </div>
              <h3 className="font-heading font-bold text-surface-900">WiseDrops</h3>
              <p className="text-xs text-surface-500">Plataforma de Cannabis Medicinal</p>
              {items.length > 0 && (
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${typeInfo.classes}`}>
                  {typeInfo.label}
                </span>
              )}
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-surface-400 uppercase tracking-wide mb-1">Medico Prescritor</p>
                <p className="font-medium text-surface-900">Dr. Carlos Oliveira</p>
                <p className="text-surface-500">CRM/SP 123456 — Neurologia</p>
              </div>

              <div>
                <p className="text-xs text-surface-400 uppercase tracking-wide mb-1">Paciente</p>
                {selectedPatient ? (
                  <>
                    <p className="font-medium text-surface-900">{selectedPatient.name}</p>
                    <p className="text-surface-500">CPF: {selectedPatient.cpf}</p>
                  </>
                ) : (
                  <p className="text-surface-300 italic">Nenhum paciente selecionado</p>
                )}
              </div>

              <div>
                <p className="text-xs text-surface-400 uppercase tracking-wide mb-1">CID-10</p>
                {selectedICDs.length > 0 ? (
                  <p className="text-surface-700">{selectedICDs.map((i) => `${i.code} - ${i.description}`).join('; ')}</p>
                ) : (
                  <p className="text-surface-300 italic">Nenhum CID selecionado</p>
                )}
              </div>

              <div className="border-t border-surface-200 pt-4">
                <p className="text-xs text-surface-400 uppercase tracking-wide mb-2">Prescricao</p>
                {items.length > 0 ? (
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={item.id} className="p-3 rounded-lg bg-surface-50">
                        <p className="font-medium text-surface-900">{idx + 1}. {item.product} ({item.concentration})</p>
                        {item.dosage && <p className="text-surface-600">Dose: {item.dosage} — {item.frequency || '...'}</p>}
                        {item.quantity && <p className="text-surface-600">Qtd: {item.quantity} — Duracao: {item.duration || '...'}</p>}
                        {item.instructions && <p className="text-surface-500 italic">{item.instructions}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-surface-300 italic">Nenhum medicamento adicionado</p>
                )}
              </div>

              {justification && (
                <div className="border-t border-surface-200 pt-4">
                  <p className="text-xs text-surface-400 uppercase tracking-wide mb-1">Justificativa Clinica</p>
                  <p className="text-surface-700">{justification}</p>
                </div>
              )}

              <div className="border-t border-surface-200 pt-4 text-center">
                <p className="text-xs text-surface-400">Data: 31/03/2026</p>
                <div className="mt-4 border-t border-dashed border-surface-300 pt-3">
                  <p className="text-xs text-surface-400">Assinatura Digital</p>
                  <p className="font-medium text-surface-700">Dr. Carlos Oliveira — CRM/SP 123456</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
