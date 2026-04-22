'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { DataTable, type Column } from '@/components/ui/data-table'
import { getRequests, updateRequest, type AnvisaRequest, type AnvisaStatus } from '@/lib/anvisa-store'

// ---------- UI config ----------

const STATUS_MAP: Record<AnvisaStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
  pending: { label: 'Pendente', variant: 'warning' },
  under_review: { label: 'Em Analise', variant: 'info' },
  approved: { label: 'Aprovado', variant: 'success' },
  rejected: { label: 'Rejeitado', variant: 'error' },
}

// ---------- Component ----------

export default function AnvisaPage() {
  const [requests, setRequests] = useState<AnvisaRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<AnvisaRequest | null>(null)
  const [overrideModal, setOverrideModal] = useState(false)
  const [newStatus, setNewStatus] = useState<AnvisaStatus>('under_review')
  const [lastPolled, setLastPolled] = useState('31/03/2026 14:30')

  // Hydrate from store (includes doctor-submitted + seeded mocks)
  useEffect(() => {
    setRequests(getRequests())
  }, [])

  const refreshFromStore = () => {
    setRequests(getRequests())
    setLastPolled(new Date().toLocaleString('pt-BR'))
  }

  const stats = useMemo(() => ({
    avgApprovalDays: 12,
    approvalRate: 78,
    pendingCount: requests.filter((r) => r.status === 'pending' || r.status === 'under_review').length,
    rejectedThisMonth: requests.filter((r) => r.status === 'rejected').length,
    newFromDoctors: requests.filter((r) => r.source === 'doctor').length,
    awaitingPatientDocs: requests.filter((r) => r.source === 'doctor' && !r.patientDocsUploaded).length,
  }), [requests])

  const columns: Column<AnvisaRequest>[] = [
    {
      key: 'protocol',
      header: 'Protocolo',
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium text-surface-900">{r.protocol}</span>
          {r.source === 'doctor' && (
            <Badge variant="info">Novo</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'patient',
      header: 'Paciente',
      sortable: true,
    },
    {
      key: 'doctor',
      header: 'Medico Prescritor',
      render: (r) => <span className="text-sm text-surface-600">{r.doctor}</span>,
    },
    {
      key: 'product',
      header: 'Produto',
      render: (r) => <span className="text-sm text-surface-600">{r.product}</span>,
    },
    {
      key: 'submittedAt',
      header: 'Data Envio',
      sortable: true,
      render: (r) => <span className="text-sm text-surface-500">{r.submittedAt}</span>,
    },
    {
      key: 'daysWaiting',
      header: 'Dias Aguardando',
      sortable: true,
      className: 'text-center',
      render: (r) => {
        if (r.status === 'approved' || r.status === 'rejected') {
          return <span className="text-surface-300">—</span>
        }
        return (
          <span
            className={`text-sm font-bold ${
              r.daysWaiting > 14
                ? 'text-red-600'
                : r.daysWaiting > 7
                ? 'text-amber-600'
                : 'text-surface-700'
            }`}
          >
            {r.daysWaiting}d
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const s = STATUS_MAP[r.status]
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge variant={s.variant} dot>{s.label}</Badge>
            {r.source === 'doctor' && r.patientDocsUploaded && (
              <span className="text-[10px] text-brand-600">📎 Docs recebidos</span>
            )}
            {r.source === 'doctor' && !r.patientDocsUploaded && (
              <span className="text-[10px] text-amber-600">Aguardando docs</span>
            )}
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: 'Acoes',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          {(r.status === 'pending' || r.status === 'under_review') && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedRequest(r)
                setOverrideModal(true)
              }}
            >
              Atualizar Manual
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedRequest(r)
            }}
          >
            Detalhes
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-surface-900">Fila ANVISA</h1>
          <p className="text-surface-500 text-sm">Autorizacoes de importacao e produtos controlados</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-surface-400">Ultima consulta: {lastPolled}</span>
          <Button variant="outline" size="sm" onClick={refreshFromStore}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Consultar Agora
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-amber-600">{stats.pendingCount}</p>
          <p className="text-xs text-surface-500">Pendentes / Em Analise</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-surface-900">{stats.avgApprovalDays} dias</p>
          <p className="text-xs text-surface-500">Tempo Medio de Aprovacao</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-brand-600">{stats.approvalRate}%</p>
          <p className="text-xs text-surface-500">Taxa de Aprovacao</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-red-600">{stats.rejectedThisMonth}</p>
          <p className="text-xs text-surface-500">Rejeitados Este Mes</p>
        </Card>
      </div>

      {/* Flow indicators */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-surface-600">Auto-polling ativo (a cada 30 min)</span>
          </div>
          <div className="h-4 w-px bg-surface-200" />
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-surface-600">
              <strong>{stats.newFromDoctors}</strong> nova(s) receita(s) de medicos
            </span>
          </div>
          <div className="h-4 w-px bg-surface-200" />
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs text-surface-600">
              <strong>{stats.awaitingPatientDocs}</strong> aguardando documentos do paciente
            </span>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card noPadding>
        <div className="p-6">
          <DataTable
            data={requests}
            columns={columns}
            searchable
            searchPlaceholder="Buscar por protocolo, paciente ou medico..."
            searchKeys={['protocol', 'patient', 'doctor']}
            pageSize={10}
            emptyMessage="Nenhuma autorizacao encontrada."
          />
        </div>
      </Card>

      {/* Manual Override Modal */}
      <Modal
        open={overrideModal && !!selectedRequest}
        onClose={() => { setOverrideModal(false); setSelectedRequest(null) }}
        title="Atualizacao Manual de Status"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setOverrideModal(false); setSelectedRequest(null) }}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (selectedRequest) {
                  updateRequest(selectedRequest.id, { status: newStatus })
                  refreshFromStore()
                }
                setOverrideModal(false)
                setSelectedRequest(null)
              }}
            >
              Salvar Alteracao
            </Button>
          </>
        }
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 text-sm space-y-1">
              <p><span className="text-surface-500">Protocolo:</span> <strong>{selectedRequest.protocol}</strong></p>
              <p><span className="text-surface-500">Paciente:</span> {selectedRequest.patient}</p>
              <p><span className="text-surface-500">Medico:</span> {selectedRequest.doctor}</p>
              <p><span className="text-surface-500">Dias aguardando:</span> {selectedRequest.daysWaiting}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Novo Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as AnvisaStatus)}
                className="flex h-10 w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
              >
                <option value="under_review">Em Analise</option>
                <option value="approved">Aprovado</option>
                <option value="rejected">Rejeitado</option>
              </select>
            </div>
            <p className="text-xs text-surface-400">
              Atualizacoes manuais ficam registradas no log de auditoria.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
