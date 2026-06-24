'use client'

import { useMemo, useState } from 'react'
import { trpc } from '@/lib/trpc'
import { StatusBadge } from '@/components/ui/status-badge'
import { mapPrescriptionStatus } from '@/lib/status-registry'

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

function formatDate(d: string | Date): string {
  const dt = d instanceof Date ? d : new Date(d)
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function PatientPrescriptionsPage() {
  const query = trpc.prescription.listForPatient.useQuery({ page: 1, limit: 50 })
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900">Minhas receitas</h1>
        <p className="text-sm text-surface-500">
          Todas as prescrições que você recebeu pela WiseDrops ficam aqui.
        </p>
      </div>

      {/* Estado 1: Loading */}
      {query.isLoading && (
        <div className="space-y-3" role="status" aria-label="Carregando receitas">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-surface-100 animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {/* Estado 2: Erro */}
      {query.isError && (
        <div className="p-4 rounded-xl bg-error-50 border border-error-100 text-sm text-error-700">
          <p className="font-medium">Erro ao carregar receitas.</p>
          <p className="mt-0.5 text-xs">{query.error.message}</p>
          <button
            onClick={() => query.refetch()}
            className="mt-2 text-xs font-medium underline underline-offset-2"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Estado 3: Vazio */}
      {!query.isLoading && !query.isError && prescriptions.length === 0 && (
        <div className="p-8 rounded-2xl bg-white border border-surface-200 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-surface-100 flex items-center justify-center mb-3">
            <span className="text-2xl" aria-hidden="true">📋</span>
          </div>
          <p className="text-sm font-medium text-surface-700">Nenhuma receita ainda</p>
          <p className="text-xs text-surface-500 mt-1">
            Quando seu médico emitir uma prescrição após a consulta, ela aparecerá aqui.
          </p>
        </div>
      )}

      {/* Estado 4: Dados */}
      {!query.isLoading && !query.isError && prescriptions.length > 0 && (
        <div className="space-y-3">
          {prescriptions.map((p) => {
            const registryState = mapPrescriptionStatus(p.status)
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
                {/* Cabeçalho */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-surface-500 uppercase tracking-wide">
                        {TYPE_LABEL[p.prescriptionType] ?? p.prescriptionType}
                      </span>
                      <StatusBadge
                        kind="prescription"
                        state={registryState}
                        variant="badge"
                      />
                      {isExpiring && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-warning-50 text-warning-700 border border-warning-100">
                          Vence em breve
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-surface-900 mt-1.5">
                      Dr(a). {p.doctor.user.fullName}
                    </p>
                    <p className="text-xs text-surface-500">
                      CRM {p.doctor.crm}/{p.doctor.crmState} · Emitida em{' '}
                      {formatDate(p.createdAt)}
                    </p>
                    <p className="text-xs text-surface-500">
                      Válida até <strong>{formatDate(p.validUntil)}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => setExpandedId(expanded ? null : p.id)}
                    className="text-xs text-brand-700 hover:underline font-medium underline-offset-2"
                    aria-expanded={expanded}
                  >
                    {expanded ? 'Recolher' : 'Ver itens'}
                  </button>
                </div>

                {/* Card de status contextual (aprovada e aguardando ANVISA merecem destaque) */}
                {(registryState === 'aprovada' || registryState === 'assinada-aguardando-anvisa') && (
                  <div className="mt-4">
                    <StatusBadge
                      kind="prescription"
                      state={registryState}
                      variant="card"
                    />
                  </div>
                )}

                {/* Itens expandidos */}
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
      )}
    </div>
  )
}
