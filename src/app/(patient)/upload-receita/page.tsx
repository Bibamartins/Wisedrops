'use client'

/**
 * /upload-receita — Caminho "Já tenho receita" (PR-C).
 *
 * Paciente envia 4 documentos (receita + RG + comprovante + ANVISA
 * opcional) + dados do médico prescritor. Vai pra fila de aprovação
 * da admin. Após aprovada, libera o catálogo.
 *
 * Fluxo:
 *  1. Upload de cada doc via POST /api/documents/upload (Netlify Blobs)
 *     Cada upload retorna o documentId (PatientDocument).
 *  2. Submit final via trpc.externalPrescription.submit
 *     com os 4 documentIds + info do médico.
 */

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  UploadCloud,
  FileText,
  IdCard,
  Home,
  ShieldCheck,
  CheckCircle2,
  X,
  ChevronLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react'

type UploadedDoc = { id: string; fileName: string; sizeBytes: number }
type DocSlotKey = 'prescription' | 'identity' | 'addressProof' | 'anvisaAuth'

const SLOTS: Array<{
  key: DocSlotKey
  type: 'medical_report' | 'identity' | 'address_proof' | 'anvisa_auth'
  required: boolean
  label: string
  description: string
  Icon: React.ComponentType<{ className?: string }>
}> = [
  {
    key: 'prescription',
    type: 'medical_report',
    required: true,
    label: 'Receita médica',
    description: 'Receita digital (PDF) ou foto nítida da receita física.',
    Icon: FileText,
  },
  {
    key: 'identity',
    type: 'identity',
    required: true,
    label: 'RG ou CNH',
    description: 'Foto frente e verso (1 arquivo PDF ou imagem).',
    Icon: IdCard,
  },
  {
    key: 'addressProof',
    type: 'address_proof',
    required: true,
    label: 'Comprovante de residência',
    description: 'Conta de luz, água, internet ou aluguel dos últimos 3 meses.',
    Icon: Home,
  },
  {
    key: 'anvisaAuth',
    type: 'anvisa_auth',
    required: false,
    label: 'Autorização ANVISA (opcional)',
    description: 'Se já tem autorização ANVISA pra produto importado, envie aqui. Senão, deixe em branco.',
    Icon: ShieldCheck,
  },
]

function fmtSize(b: number) {
  return b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`
}

export default function UploadReceitaPage() {
  const router = useRouter()
  const [docs, setDocs] = useState<Record<DocSlotKey, UploadedDoc | null>>({
    prescription: null,
    identity: null,
    addressProof: null,
    anvisaAuth: null,
  })
  const [uploadingKey, setUploadingKey] = useState<DocSlotKey | null>(null)
  const [doctorName, setDoctorName] = useState('')
  const [doctorCrm, setDoctorCrm] = useState('')
  const [doctorCrmState, setDoctorCrmState] = useState('')
  const [conditionTreated, setConditionTreated] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const submitMutation = trpc.externalPrescription.submit.useMutation()

  async function handleFile(slot: DocSlotKey, file: File) {
    setError(null)
    setUploadingKey(slot)
    const slotConfig = SLOTS.find((s) => s.key === slot)!
    try {
      if (file.size === 0) throw new Error('Arquivo vazio.')
      if (file.size > 10 * 1024 * 1024) throw new Error('Arquivo maior que 10 MB.')

      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', slotConfig.type)

      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd })
      const body = (await res.json()) as { document?: { id: string; fileName: string; sizeBytes: number }; error?: string }
      if (!res.ok || !body.document) {
        throw new Error(body.error ?? 'Falha no upload.')
      }
      setDocs((prev) => ({
        ...prev,
        [slot]: { id: body.document!.id, fileName: body.document!.fileName, sizeBytes: body.document!.sizeBytes },
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro no upload.')
    } finally {
      setUploadingKey(null)
    }
  }

  const canSubmit =
    !!docs.prescription &&
    !!docs.identity &&
    !!docs.addressProof &&
    doctorName.trim().length >= 3 &&
    acceptedTerms &&
    !submitMutation.isPending

  async function handleSubmit() {
    setError(null)
    if (!docs.prescription || !docs.identity || !docs.addressProof) {
      setError('Envie ao menos os 3 documentos obrigatórios.')
      return
    }
    try {
      await submitMutation.mutateAsync({
        prescriptionDocumentId: docs.prescription.id,
        identityDocumentId: docs.identity.id,
        addressProofDocumentId: docs.addressProof.id,
        anvisaAuthDocumentId: docs.anvisaAuth?.id,
        doctorName: doctorName.trim(),
        doctorCrm: doctorCrm.trim() || undefined,
        doctorCrmState: doctorCrmState.trim().toUpperCase() || undefined,
        conditionTreated: conditionTreated.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      router.push('/home?ext=submitted')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/home"
        className="inline-flex items-center gap-1 text-small text-surface-600 hover:text-surface-900 transition"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar
      </Link>

      <div>
        <p className="text-overline text-sage-700 mb-2 uppercase tracking-widest font-semibold">
          Caminho 2 — Já tenho receita
        </p>
        <h1 className="text-3xl md:text-h1 font-heading font-bold text-surface-900 leading-tight">
          Envie sua documentação
        </h1>
        <p className="mt-3 text-body-lg text-surface-600">
          Após análise (até 24h), você é liberado pra comprar no catálogo direto, sem precisar de consulta.
        </p>
      </div>

      {/* Uploads */}
      <Card padding="lg">
        <h2 className="text-h3 font-heading font-semibold text-surface-900 mb-4">Documentos</h2>
        <div className="space-y-3">
          {SLOTS.map((slot) => {
            const uploaded = docs[slot.key]
            const isUploading = uploadingKey === slot.key
            return (
              <UploadSlot
                key={slot.key}
                slot={slot}
                uploaded={uploaded}
                isUploading={isUploading}
                onFile={(file) => handleFile(slot.key, file)}
                onRemove={() => setDocs((prev) => ({ ...prev, [slot.key]: null }))}
              />
            )
          })}
        </div>
      </Card>

      {/* Médico prescritor */}
      <Card padding="lg">
        <h2 className="text-h3 font-heading font-semibold text-surface-900 mb-4">Médico prescritor</h2>
        <div className="space-y-4">
          <div>
            <label className="text-small font-medium text-surface-900 mb-1.5 block">
              Nome do médico que prescreveu *
            </label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Dr(a). Nome Sobrenome"
              className="w-full px-3 py-2.5 rounded-lg border border-surface-300 text-body text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-small font-medium text-surface-900 mb-1.5 block">
                CRM (opcional)
              </label>
              <input
                type="text"
                value={doctorCrm}
                onChange={(e) => setDoctorCrm(e.target.value)}
                placeholder="123456"
                className="w-full px-3 py-2.5 rounded-lg border border-surface-300 text-body text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-small font-medium text-surface-900 mb-1.5 block">UF</label>
              <input
                type="text"
                value={doctorCrmState}
                onChange={(e) => setDoctorCrmState(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="SP"
                maxLength={2}
                className="w-full px-3 py-2.5 rounded-lg border border-surface-300 text-body text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>
          </div>
          <div>
            <label className="text-small font-medium text-surface-900 mb-1.5 block">
              Condição tratada (opcional)
            </label>
            <input
              type="text"
              value={conditionTreated}
              onChange={(e) => setConditionTreated(e.target.value)}
              placeholder="Ex: dor crônica, ansiedade, insônia"
              className="w-full px-3 py-2.5 rounded-lg border border-surface-300 text-body text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="text-small font-medium text-surface-900 mb-1.5 block">
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Qualquer informação relevante pra nossa equipe."
              className="w-full px-3 py-2.5 rounded-lg border border-surface-300 text-body text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
            />
          </div>
        </div>
      </Card>

      {/* Termos */}
      <Card padding="md">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-small text-surface-700">
            Declaro que os documentos enviados são autênticos e meus.
            Li e aceito os{' '}
            <Link href="/termos" className="text-brand-700 underline">Termos de Uso</Link>,
            a{' '}
            <Link href="/privacidade" className="text-brand-700 underline">Política de Privacidade</Link>{' '}
            e autorizo o uso clínico dos dados sob{' '}
            <Link href="/lgpd" className="text-brand-700 underline">LGPD art. 11 §2º II</Link>.
          </span>
        </label>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-error-50 border border-error-100 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-error-700 shrink-0 mt-0.5" />
          <p className="text-small text-error-700">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-caption text-surface-500">
          * obrigatórios. Análise em até 24h.
        </p>
        <Button
          variant="primary"
          size="lg"
          disabled={!canSubmit}
          loading={submitMutation.isPending}
          onClick={handleSubmit}
        >
          Enviar pra análise
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente de slot de upload
// ---------------------------------------------------------------------------
function UploadSlot({
  slot,
  uploaded,
  isUploading,
  onFile,
  onRemove,
}: {
  slot: typeof SLOTS[number]
  uploaded: UploadedDoc | null
  isUploading: boolean
  onFile: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { Icon } = slot

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border transition ${
        uploaded
          ? 'bg-sage-50 border-sage-200'
          : 'bg-white border-surface-200 hover:border-surface-300'
      }`}
    >
      <div
        className={`p-2.5 rounded-lg shrink-0 ${
          uploaded ? 'bg-sage-100' : 'bg-surface-100'
        }`}
      >
        {uploaded ? (
          <CheckCircle2 className="h-5 w-5 text-sage-700" />
        ) : (
          <Icon className="h-5 w-5 text-surface-600" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-body font-medium text-surface-900">
          {slot.label}
          {slot.required && <span className="text-error-600"> *</span>}
        </p>
        {uploaded ? (
          <p className="text-small text-sage-700 truncate">
            ✓ {uploaded.fileName} ({fmtSize(uploaded.sizeBytes)})
          </p>
        ) : (
          <p className="text-small text-surface-500 truncate">{slot.description}</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />

      {uploaded ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remover arquivo"
          className="p-2 rounded-lg hover:bg-sage-100 transition shrink-0"
        >
          <X className="h-4 w-4 text-sage-700" />
        </button>
      ) : isUploading ? (
        <div className="p-2 shrink-0">
          <Loader2 className="h-4 w-4 text-brand-600 animate-spin" />
        </div>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="h-4 w-4" />
          Enviar
        </Button>
      )}
    </div>
  )
}
