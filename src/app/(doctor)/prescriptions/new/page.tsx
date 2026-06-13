'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { trpc } from '@/lib/trpc'

type PrescriptionTypeUI = 'TYPE_A' | 'TYPE_B' | 'SIMPLE'

interface ItemDraft {
  id: string
  genericName: string
  concentration: string
  form: string
  dosage: string
  frequency: string
  quantity: string
  duration: string
  instructions: string
}

function emptyItem(): ItemDraft {
  return {
    id: `it-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    genericName: '',
    concentration: '',
    form: '',
    dosage: '',
    frequency: '',
    quantity: '',
    duration: '',
    instructions: '',
  }
}

const TYPE_LABEL: Record<PrescriptionTypeUI, string> = {
  TYPE_A: 'Receita A (amarela) — THC > 0,2%',
  TYPE_B: 'Receita B (azul) — THC < 0,2%',
  SIMPLE: 'Receita simples',
}

export default function NewPrescriptionPage() {
  const router = useRouter()

  // Consultas do médico — pra ele escolher de qual consulta a prescrição vem.
  const completedQuery = trpc.consultation.listForDoctor.useQuery({
    status: 'COMPLETED',
    page: 1,
    limit: 50,
  })
  const upcomingQuery = trpc.consultation.listForDoctor.useQuery({
    status: 'SCHEDULED',
    page: 1,
    limit: 50,
  })

  const createPrescription = trpc.prescription.create.useMutation()

  const [consultationId, setConsultationId] = useState<string>('')
  const [prescriptionType, setPrescriptionType] = useState<PrescriptionTypeUI>('TYPE_B')
  const [icdCodes, setIcdCodes] = useState<string>('')
  const [clinicalJustification, setClinicalJustification] = useState('')
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()])
  const [error, setError] = useState('')

  const consultations = useMemo(() => {
    const completed = completedQuery.data?.consultations ?? []
    const upcoming = upcomingQuery.data?.consultations ?? []
    return [...completed, ...upcoming].map((c) => {
      const d = c.scheduledAt instanceof Date ? c.scheduledAt : new Date(c.scheduledAt)
      return {
        id: c.id,
        patientId: c.patient.id,
        patientName: c.patient.user.fullName,
        when: d.toLocaleDateString('pt-BR') + ' ' + d.toTimeString().slice(0, 5),
        status: c.status,
        chiefComplaint: c.chiefComplaint ?? '',
      }
    })
  }, [completedQuery.data, upcomingQuery.data])

  const selectedConsult = consultations.find((c) => c.id === consultationId)

  const handleAddItem = () => setItems((arr) => [...arr, emptyItem()])
  const handleRemoveItem = (id: string) =>
    setItems((arr) => (arr.length > 1 ? arr.filter((x) => x.id !== id) : arr))
  const handleItemChange = (id: string, field: keyof ItemDraft, value: string) =>
    setItems((arr) => arr.map((x) => (x.id === id ? { ...x, [field]: value } : x)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedConsult) {
      setError('Selecione uma consulta para vincular a prescrição.')
      return
    }
    for (const it of items) {
      if (!it.genericName.trim() || !it.dosage.trim() || !it.frequency.trim()) {
        setError('Cada item precisa de Produto/medicamento, Dosagem e Frequência.')
        return
      }
    }
    const codes = icdCodes
      .split(/[,;]/)
      .map((c) => c.trim())
      .filter(Boolean)

    try {
      const result = await createPrescription.mutateAsync({
        patientId: selectedConsult.patientId,
        consultationId: selectedConsult.id,
        prescriptionType,
        items: items.map((it) => ({
          genericName: it.genericName.trim(),
          concentration: it.concentration.trim() || undefined,
          form: it.form.trim() || undefined,
          dosage: it.dosage.trim(),
          frequency: it.frequency.trim(),
          quantity: it.quantity.trim() || undefined,
          duration: it.duration.trim() || undefined,
          instructions: it.instructions.trim() || undefined,
        })),
        clinicalJustification: clinicalJustification.trim() || undefined,
        icdCodes: codes,
      })
      router.push(`/doctor-consultations?prescribed=${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar prescrição.')
    }
  }

  const loading = completedQuery.isLoading || upcomingQuery.isLoading

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-surface-900">Nova prescrição</h1>
          <p className="text-sm text-surface-500">
            Cria uma prescrição assinada e disponibiliza pro paciente no app.
          </p>
        </div>
        <Link
          href="/doctor-consultations"
          className="text-sm text-surface-500 hover:text-surface-700"
        >
          ← Voltar
        </Link>
      </div>

      {/* Consulta */}
      <div className="p-5 rounded-2xl bg-white border border-surface-200 shadow-sm space-y-4">
        <h2 className="font-heading font-semibold text-surface-900">Consulta de origem</h2>
        {loading ? (
          <p className="text-sm text-surface-500">Carregando suas consultas...</p>
        ) : consultations.length === 0 ? (
          <div className="p-3 rounded-xl bg-warning-50 border border-warning-600/30 text-sm text-warning-700">
            Você ainda não tem consultas registradas. A prescrição precisa estar vinculada a uma
            consulta sua.
          </div>
        ) : (
          <>
            <select
              value={consultationId}
              onChange={(e) => setConsultationId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            >
              <option value="">Selecione a consulta...</option>
              {consultations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.patientName} — {c.when} ({c.status})
                </option>
              ))}
            </select>
            {selectedConsult && (
              <div className="text-xs text-surface-500">
                Paciente: <strong className="text-surface-700">{selectedConsult.patientName}</strong>
                {selectedConsult.chiefComplaint && (
                  <span> · &quot;{selectedConsult.chiefComplaint}&quot;</span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tipo */}
      <div className="p-5 rounded-2xl bg-white border border-surface-200 shadow-sm space-y-3">
        <h2 className="font-heading font-semibold text-surface-900">Tipo de receita</h2>
        <div className="space-y-2">
          {(['TYPE_B', 'TYPE_A', 'SIMPLE'] as PrescriptionTypeUI[]).map((t) => (
            <label
              key={t}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                prescriptionType === t
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-surface-200 hover:border-surface-300'
              }`}
            >
              <input
                type="radio"
                name="ptype"
                value={t}
                checked={prescriptionType === t}
                onChange={() => setPrescriptionType(t)}
                className="mt-1"
              />
              <span className="text-sm font-medium text-surface-900">{TYPE_LABEL[t]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Itens */}
      <div className="p-5 rounded-2xl bg-white border border-surface-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-surface-900">Itens da receita</h2>
          <button
            type="button"
            onClick={handleAddItem}
            className="text-sm text-brand-600 hover:underline"
          >
            + Adicionar item
          </button>
        </div>
        {items.map((it, idx) => (
          <div key={it.id} className="p-4 rounded-xl border border-surface-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-surface-500 uppercase">
                Item {idx + 1}
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveItem(it.id)}
                  className="text-xs text-error-600 hover:underline"
                >
                  Remover
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-surface-700 mb-1">
                  Produto / medicamento *
                </label>
                <input
                  type="text"
                  required
                  value={it.genericName}
                  onChange={(e) => handleItemChange(it.id, 'genericName', e.target.value)}
                  placeholder="Ex.: Óleo de CBD full spectrum"
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">
                  Concentração
                </label>
                <input
                  type="text"
                  value={it.concentration}
                  onChange={(e) => handleItemChange(it.id, 'concentration', e.target.value)}
                  placeholder="Ex.: 200 mg/mL"
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">
                  Forma / via
                </label>
                <input
                  type="text"
                  value={it.form}
                  onChange={(e) => handleItemChange(it.id, 'form', e.target.value)}
                  placeholder="Ex.: Sublingual"
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">
                  Dosagem *
                </label>
                <input
                  type="text"
                  required
                  value={it.dosage}
                  onChange={(e) => handleItemChange(it.id, 'dosage', e.target.value)}
                  placeholder="Ex.: 5 gotas"
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">
                  Frequência *
                </label>
                <input
                  type="text"
                  required
                  value={it.frequency}
                  onChange={(e) => handleItemChange(it.id, 'frequency', e.target.value)}
                  placeholder="Ex.: 2x ao dia"
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">Quantidade</label>
                <input
                  type="text"
                  value={it.quantity}
                  onChange={(e) => handleItemChange(it.id, 'quantity', e.target.value)}
                  placeholder="Ex.: 1 frasco de 30 mL"
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">Duração</label>
                <input
                  type="text"
                  value={it.duration}
                  onChange={(e) => handleItemChange(it.id, 'duration', e.target.value)}
                  placeholder="Ex.: 30 dias"
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-surface-700 mb-1">Instruções</label>
                <textarea
                  value={it.instructions}
                  onChange={(e) => handleItemChange(it.id, 'instructions', e.target.value)}
                  rows={2}
                  placeholder="Ex.: Iniciar à noite e aumentar conforme tolerância."
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Diagnóstico */}
      <div className="p-5 rounded-2xl bg-white border border-surface-200 shadow-sm space-y-4">
        <h2 className="font-heading font-semibold text-surface-900">Diagnóstico</h2>
        <div>
          <label className="block text-xs font-medium text-surface-700 mb-1">
            Códigos CID-10 (separados por vírgula)
          </label>
          <input
            type="text"
            value={icdCodes}
            onChange={(e) => setIcdCodes(e.target.value)}
            placeholder="Ex.: F41.1, G47.0"
            className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-700 mb-1">
            Justificativa clínica
          </label>
          <textarea
            value={clinicalJustification}
            onChange={(e) => setClinicalJustification(e.target.value)}
            rows={3}
            placeholder="Descreva brevemente o quadro clínico e a justificativa para o uso de cannabis medicinal."
            className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-error-50 border border-error-600/30 text-sm text-error-600">
          {error}
        </div>
      )}
      <div className="flex items-center justify-end gap-3">
        <Link
          href="/doctor-consultations"
          className="px-4 py-2.5 rounded-lg border border-surface-200 text-sm text-surface-700 hover:bg-surface-50 transition"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={createPrescription.isLoading || !selectedConsult}
          className="px-6 py-2.5 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {createPrescription.isLoading ? 'Emitindo...' : 'Emitir prescrição'}
        </button>
      </div>
    </form>
  )
}
