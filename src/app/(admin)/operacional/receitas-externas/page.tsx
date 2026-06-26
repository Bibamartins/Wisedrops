'use client'

/**
 * /operacional/receitas-externas — Fila de aprovação (PR-D).
 *
 * Admin (Bianca) revisa receitas externas enviadas pelo paciente
 * pelo caminho "Já tenho receita". Lista todos PENDENTES, abre
 * modal de revisão com link pros 4 documentos, e aprova/rejeita.
 */

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  ChevronLeft,
  FileText,
  IdCard,
  Home,
  ShieldCheck,
  ClipboardList,
  ExternalLink,
  Check,
  X,
  AlertCircle,
} from 'lucide-react'

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function ReceitasExternasPage() {
  const list = trpc.externalPrescription.listPending.useQuery({ page: 1, limit: 50 })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <Link
        href="/operacional"
        className="inline-flex items-center gap-1 text-small text-surface-600 hover:text-surface-900 transition"
      >
        <ChevronLeft className="h-4 w-4" /> Voltar pro operacional
      </Link>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-overline text-brand-700 mb-2 uppercase tracking-widest font-semibold">
            Operacional
          </p>
          <h1 className="text-3xl md:text-h1 font-heading font-bold text-surface-900">
            Receitas externas para revisar
          </h1>
        </div>
        {list.data && (
          <Badge variant="brand" size="md">
            {list.data.total} pendente{list.data.total === 1 ? '' : 's'}
          </Badge>
        )}
      </div>

      {list.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height="92px" />
          ))}
        </div>
      )}

      {list.isError && (
        <EmptyState
          icon={<AlertCircle className="h-10 w-10" />}
          title="Erro ao carregar"
          description={list.error.message}
        />
      )}

      {list.data && list.data.items.length === 0 && (
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" />}
          title="Nenhuma receita pendente"
          description="Quando paciente enviar documentação pelo caminho 'Já tenho receita', vai aparecer aqui."
        />
      )}

      {list.data && list.data.items.length > 0 && (
        <div className="space-y-3">
          {list.data.items.map((rx) => (
            <Card key={rx.id} padding="md" variant="interactive" className="cursor-pointer" onClick={() => setSelectedId(rx.id)}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-surface-900">{rx.patient.fullName}</p>
                    <Badge variant="warning" size="sm">Pendente</Badge>
                  </div>
                  <p className="text-small text-surface-500 mt-0.5">
                    Enviado em {fmtDate(rx.submittedAt)} · Médico: {rx.doctorName}
                    {rx.doctorCrm && ` (CRM ${rx.doctorCrm}${rx.doctorCrmState ? `/${rx.doctorCrmState}` : ''})`}
                  </p>
                  {rx.conditionTreated && (
                    <p className="text-small text-surface-600 mt-1 italic">"{rx.conditionTreated}"</p>
                  )}
                </div>
                <Button variant="primary" size="sm">
                  Revisar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedId && (
        <ReviewModal id={selectedId} onClose={() => setSelectedId(null)} onActed={() => {
          setSelectedId(null)
          list.refetch()
        }} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modal de revisão
// ---------------------------------------------------------------------------
function ReviewModal({ id, onClose, onActed }: { id: string; onClose: () => void; onActed: () => void }) {
  const detail = trpc.externalPrescription.getByIdForAdmin.useQuery({ id })
  const approve = trpc.externalPrescription.approve.useMutation()
  const reject = trpc.externalPrescription.reject.useMutation()
  const [rejectMode, setRejectMode] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setError(null)
    try {
      await approve.mutateAsync({ id })
      onActed()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
    }
  }

  async function handleReject() {
    setError(null)
    if (reason.trim().length < 5) {
      setError('Motivo precisa ter pelo menos 5 caracteres.')
      return
    }
    try {
      await reject.mutateAsync({ id, reason: reason.trim() })
      onActed()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
    }
  }

  const d = detail.data
  const isPending = approve.isPending || reject.isPending

  return (
    <div className="fixed inset-0 z-50 bg-surface-900/50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-surface-200 p-5 flex items-center justify-between z-10">
          <div>
            <h2 className="text-h3 font-heading font-bold text-surface-900">Revisar documentação</h2>
            {d && <p className="text-small text-surface-500">{d.patient.fullName}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-100 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {detail.isLoading && <Skeleton height="200px" />}
          {detail.isError && <p className="text-error-700 text-small">{detail.error.message}</p>}

          {d && (
            <>
              {/* Paciente */}
              <Card padding="md">
                <p className="text-overline text-surface-500 uppercase tracking-wider font-semibold mb-2">Paciente</p>
                <p className="font-medium text-surface-900">{d.patient.fullName}</p>
                <p className="text-small text-surface-600">
                  {d.patient.email} {d.patient.phone && `· ${d.patient.phone}`}
                </p>
                <p className="text-caption text-surface-500 mt-1">
                  CPF {d.patient.cpf} · Nascido em {new Date(d.patient.dateOfBirth).toLocaleDateString('pt-BR')}
                </p>
                {d.patient.allergies.length > 0 && (
                  <p className="text-caption text-warning-700 mt-1">⚠ Alergias: {d.patient.allergies.join(', ')}</p>
                )}
                {d.patient.currentMedications.length > 0 && (
                  <p className="text-caption text-surface-600 mt-1">💊 Medicações: {d.patient.currentMedications.join(', ')}</p>
                )}
              </Card>

              {/* Médico prescritor */}
              <Card padding="md">
                <p className="text-overline text-surface-500 uppercase tracking-wider font-semibold mb-2">Médico prescritor</p>
                <p className="font-medium text-surface-900">{d.doctorName}</p>
                {d.doctorCrm && (
                  <p className="text-small text-surface-600">CRM {d.doctorCrm}{d.doctorCrmState && `/${d.doctorCrmState}`}</p>
                )}
                {d.conditionTreated && (
                  <p className="text-small text-surface-600 italic mt-1">Condição: "{d.conditionTreated}"</p>
                )}
                {d.notes && (
                  <p className="text-small text-surface-600 mt-2 whitespace-pre-line">📝 {d.notes}</p>
                )}
              </Card>

              {/* Docs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DocLink storageKey={d.prescriptionKey} label="Receita médica" Icon={FileText} />
                <DocLink storageKey={d.identityDocKey} label="RG ou CNH" Icon={IdCard} />
                <DocLink storageKey={d.addressProofKey} label="Comprovante residência" Icon={Home} />
                {d.anvisaAuthKey && (
                  <DocLink storageKey={d.anvisaAuthKey} label="Autorização ANVISA" Icon={ShieldCheck} />
                )}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-error-50 border border-error-100 text-small text-error-700">
                  {error}
                </div>
              )}

              {/* Ações */}
              {!rejectMode ? (
                <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-surface-100">
                  <Button
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    loading={approve.isPending}
                    disabled={isPending}
                    onClick={handleApprove}
                  >
                    <Check className="h-4 w-4" />
                    Aprovar e liberar catálogo
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    disabled={isPending}
                    onClick={() => setRejectMode(true)}
                  >
                    <X className="h-4 w-4" />
                    Rejeitar
                  </Button>
                </div>
              ) : (
                <div className="pt-3 border-t border-surface-100 space-y-3">
                  <label className="block">
                    <span className="text-small font-medium text-surface-900 mb-1.5 block">
                      Motivo da rejeição (será enviado pro paciente)
                    </span>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      placeholder="Ex: Receita ilegível, RG sem verso, comprovante muito antigo..."
                      className="w-full px-3 py-2.5 rounded-lg border border-surface-300 text-body text-surface-900 focus:outline-none focus:ring-2 focus:ring-error-500/30 focus:border-error-500 resize-none"
                    />
                  </label>
                  <div className="flex gap-3">
                    <Button
                      variant="destructive"
                      size="md"
                      className="flex-1"
                      loading={reject.isPending}
                      onClick={handleReject}
                    >
                      Confirmar rejeição
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => { setRejectMode(false); setReason(''); setError(null) }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function DocLink({ storageKey, label, Icon }: { storageKey: string; label: string; Icon: React.ComponentType<{ className?: string }> }) {
  const href = `/api/documents/blob/${encodeURIComponent(storageKey)}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 hover:border-brand-300 hover:bg-brand-50/50 transition"
    >
      <div className="p-2 rounded-md bg-brand-50">
        <Icon className="h-4 w-4 text-brand-700" />
      </div>
      <span className="flex-1 text-small font-medium text-surface-900 truncate">{label}</span>
      <ExternalLink className="h-3.5 w-3.5 text-surface-400" />
    </a>
  )
}
