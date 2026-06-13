'use client'

import { useMemo, useState } from 'react'
import { trpc } from '@/lib/trpc'

interface ItemView {
  genericName?: string
  concentration?: string
  form?: string
  dosage?: string
  frequency?: string
  quantity?: string
  duration?: string
  instructions?: string
}

const TYPE_LABEL: Record<string, string> = {
  TYPE_A: 'Receita A',
  TYPE_B: 'Receita B',
  SIMPLE: 'Receita simples',
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-warning-50 text-warning-700 border-warning-600/30' },
  SIGNED: { label: 'Vigente', cls: 'bg-success-50 text-success-700 border-success-600/30' },
  SENT_TO_ANVISA: { label: 'Em análise ANVISA', cls: 'bg-info-50 text-info-700 border-info-600/30' },
  ANVISA_APPROVED: { label: 'ANVISA aprovou', cls: 'bg-sage-100 text-sage-700 border-sage-400' },
  ANVISA_REJECTED: { label: 'ANVISA rejeitou', cls: 'bg-error-50 text-error-600 border-error-600/30' },
  DISPENSED: { label: 'Dispensada', cls: 'bg-surface-100 text-surface-600 border-surface-300' },
  EXPIRED: { label: 'Expirada', cls: 'bg-surface-100 text-surface-500 border-surface-300' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-error-50 text-error-600 border-error-600/30' },
}

function formatDate(d: string | Date): string {
  const dt = d instanceof Date ? d : new Date(d)
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function PatientPrescriptionsPage() {
  const query = trpc.prescription.listForPatient.useQuery()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const prescriptions = useMemo(() => {
    return (query.data?.prescriptions ?? []) as Array<{
      id: string
      prescriptionType: string
      status: string
      items: ItemView[]
      icdCodes: string[]
      clinicalJustification: string | null
      validUntil: string | Date
      createdAt: string | Date
      doctor: {
        crm: string
        crmState: string
        user: { fullName: string }
      }
    }>
  }, [query.data])

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900">Minhas receitas</h1>
        <p className="text-sm text-surface-500">
          Todas as prescrições que você recebeu pela WiseDrops ficam aqui.
        </p>
      </div>

      {query.isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
        </div>
      )}

      {query.isError && (
        <div className="p-4 rounded-xl bg-error-50 border border-error-600/30 text-sm text-error-600">
          Erro ao carregar: {query.error.message}
        </div>
      )}

      {!query.isLoading && !query.isError && prescriptions.length === 0 && (
        <div className="p-8 rounded-2xl bg-white border border-surface-200 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-surface-100 flex items-center justify-center mb-3">
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-sm font-medium text-surface-700">Nenhuma receita ainda</p>
          <p className="text-xs text-surface-500 mt-1">
            Quando seu médico emitir uma prescrição após a consulta, ela aparecerá aqui.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {prescriptions.map((p) => {
          const st = STATUS_LABEL[p.status] ?? STATUS_LABEL.DRAFT
          const expanded = expandedId === p.id
          const validUntil = new Date(p.validUntil)
          const isExpiring =
            validUntil.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 &&
            validUntil.getTime() > Date.now()
          return (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-white border border-surface-200 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-surface-500 uppercase">
                      {TYPE_LABEL[p.prescriptionType] ?? p.prescriptionType}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${st.cls}`}
                    >
                      {st.label}
                    </span>
                    {isExpiring && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-warning-50 text-warning-700 border border-warning-600/30">
                        Vence em breve
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-surface-900 mt-1.5">
                    Dr(a). {p.doctor.user.fullName}
                  </p>
                  <p className="text-xs text-surface-500">
                    CRM {p.doctor.crm}/{p.doctor.crmState} · Emitida em {formatDate(p.createdAt)}
                  </p>
                  <p className="text-xs text-surface-500">
                    Válida até <strong>{formatDate(p.validUntil)}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setExpandedId(expanded ? null : p.id)}
                  className="text-xs text-brand-600 hover:underline font-medium"
                >
                  {expanded ? 'Recolher' : 'Ver itens'}
                </button>
              </div>

              {expanded && (
                <div className="mt-4 pt-4 border-t border-surface-100 space-y-3">
                  {p.icdCodes && p.icdCodes.length > 0 && (
                    <p className="text-xs text-surface-500">
                      <strong className="text-surface-700">CID-10:</strong>{' '}
                      {p.icdCodes.join(', ')}
                    </p>
                  )}
                  {p.clinicalJustification && (
                    <div className="p-3 rounded-lg bg-surface-50 text-xs text-surface-600">
                      <strong className="text-surface-700">Justificativa clínica: </strong>
                      {p.clinicalJustification}
                    </div>
                  )}
                  <div className="space-y-2">
                    {p.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-surface-200 text-xs space-y-0.5"
                      >
                        <p className="font-semibold text-surface-900 text-sm">
                          {it.genericName}
                          {it.concentration ? ` · ${it.concentration}` : ''}
                        </p>
                        {it.form && <p className="text-surface-500">Via: {it.form}</p>}
                        <p className="text-surface-700">
                          <strong>{it.dosage}</strong> · {it.frequency}
                          {it.duration ? ` · por ${it.duration}` : ''}
                        </p>
                        {it.quantity && (
                          <p className="text-surface-500">Quantidade: {it.quantity}</p>
                        )}
                        {it.instructions && (
                          <p className="text-surface-500 italic mt-1">{it.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
