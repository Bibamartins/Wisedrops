'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'

type VStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
type Tab = 'ALL' | VStatus

const STATUS: Record<VStatus, { label: string; cls: string }> = {
  PENDING: { label: 'Pendente', cls: 'bg-warning-50 text-warning-700 border-warning-600/30' },
  APPROVED: { label: 'Aprovado', cls: 'bg-success-50 text-success-700 border-success-600/30' },
  REJECTED: { label: 'Rejeitado', cls: 'bg-error-50 text-error-600 border-error-600/30' },
}

interface DoctorRow {
  doctorId: string
  name: string
  email: string
  crm: string
  crmState: string
  specialty: string[]
  status: VStatus
}

export default function DoctorsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('PENDING')
  const [rejecting, setRejecting] = useState<DoctorRow | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const query = trpc.admin.listUsers.useQuery({ role: 'DOCTOR', limit: 100 })
  const verify = trpc.admin.verifyDoctor.useMutation({
    onSuccess: () => {
      query.refetch()
      setRejecting(null)
      setRejectReason('')
    },
  })

  const rows: DoctorRow[] = (query.data?.users ?? [])
    .filter((u) => u.doctor)
    .map((u) => ({
      doctorId: u.doctor!.id,
      name: u.fullName,
      email: u.email,
      crm: u.doctor!.crm,
      crmState: u.doctor!.crmState,
      specialty: u.doctor!.specialty ?? [],
      status: u.doctor!.verificationStatus as VStatus,
    }))

  const counts = {
    ALL: rows.length,
    PENDING: rows.filter((r) => r.status === 'PENDING').length,
    APPROVED: rows.filter((r) => r.status === 'APPROVED').length,
    REJECTED: rows.filter((r) => r.status === 'REJECTED').length,
  }

  const visible = activeTab === 'ALL' ? rows : rows.filter((r) => r.status === activeTab)

  const handleApprove = (r: DoctorRow) =>
    verify.mutate({ doctorId: r.doctorId, decision: 'APPROVED' })

  const handleReject = () => {
    if (!rejecting || !rejectReason.trim()) return
    verify.mutate({ doctorId: rejecting.doctorId, decision: 'REJECTED', rejectionReason: rejectReason.trim() })
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'PENDING', label: 'Pendentes' },
    { id: 'APPROVED', label: 'Aprovados' },
    { id: 'REJECTED', label: 'Rejeitados' },
    { id: 'ALL', label: 'Todos' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-surface-900">Médicos</h1>
        <p className="text-sm text-surface-500">Credenciamento e verificação de CRM</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {([
          ['Total', counts.ALL, 'text-surface-900'],
          ['Pendentes', counts.PENDING, 'text-warning-600'],
          ['Aprovados', counts.APPROVED, 'text-success-600'],
          ['Rejeitados', counts.REJECTED, 'text-error-600'],
        ] as const).map(([label, value, cls]) => (
          <div key={label} className="bg-white rounded-xl border border-surface-200 p-4">
            <p className="text-xs text-surface-400">{label}</p>
            <p className={`text-2xl font-heading font-bold ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface-100 rounded-xl mb-6 w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === t.id ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
            }`}>
            {t.label} <span className="text-surface-400">({counts[t.id]})</span>
          </button>
        ))}
      </div>

      {/* List */}
      {query.isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
        </div>
      ) : query.isError ? (
        <div className="p-4 rounded-xl bg-error-50 border border-error-600/30 text-sm text-error-600">
          Erro ao carregar médicos: {query.error.message}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 text-sm text-surface-400">Nenhum médico nesta categoria.</div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => {
            const st = STATUS[r.status]
            return (
              <div key={r.doctorId} className="bg-white rounded-xl border border-surface-200 p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sage-700 font-bold">{r.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-surface-900 truncate">{r.name}</p>
                    <p className="text-xs text-surface-500 truncate">{r.email}</p>
                    <p className="text-xs text-surface-400 mt-0.5">
                      CRM {r.crm}/{r.crmState} · {r.specialty.join(', ') || 'Sem especialidade'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${st.cls}`}>
                    {st.label}
                  </span>
                  {r.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleApprove(r)} disabled={verify.isLoading}
                        className="px-4 py-2 rounded-lg bg-success-600 text-white text-xs font-medium hover:bg-success-700 transition disabled:opacity-50">
                        Aprovar
                      </button>
                      <button onClick={() => { setRejecting(r); setRejectReason('') }} disabled={verify.isLoading}
                        className="px-4 py-2 rounded-lg border border-error-600/40 text-error-600 text-xs font-medium hover:bg-error-50 transition disabled:opacity-50">
                        Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reject modal */}
      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setRejecting(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-heading font-bold text-surface-900 mb-1">Rejeitar credenciamento</h3>
            <p className="text-sm text-surface-500 mb-4">
              {rejecting.name} · CRM {rejecting.crm}/{rejecting.crmState}. Informe o motivo (o médico será notificado).
            </p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
              placeholder="Ex: CRM não encontrado no registro do conselho..."
              className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none text-sm" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejecting(null)}
                className="flex-1 py-2.5 rounded-xl border border-surface-200 text-surface-600 text-sm font-medium hover:bg-surface-50 transition">
                Cancelar
              </button>
              <button onClick={handleReject} disabled={!rejectReason.trim() || verify.isLoading}
                className="flex-1 py-2.5 rounded-xl bg-error-600 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
                {verify.isLoading ? 'Rejeitando...' : 'Confirmar rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
