'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Tabs, TabContent } from '@/components/ui/tabs'

// ---------- Types ----------

interface Doctor {
  id: string
  name: string
  crm: string
  state: string
  specialty: string
  email: string
  status: 'pending' | 'approved' | 'rejected'
  rating: number
  totalConsultations: number
  registeredAt: string
  [key: string]: unknown
}

// ---------- Mock data ----------

const MOCK_DOCTORS: Doctor[] = [
  { id: '1', name: 'Dr. Ricardo Mendes', crm: '123456', state: 'SP', specialty: 'Neurologia', email: 'ricardo@email.com', status: 'pending', rating: 0, totalConsultations: 0, registeredAt: '30/03/2026' },
  { id: '2', name: 'Dra. Fernanda Lima', crm: '654321', state: 'RJ', specialty: 'Psiquiatria', email: 'fernanda@email.com', status: 'pending', rating: 0, totalConsultations: 0, registeredAt: '29/03/2026' },
  { id: '3', name: 'Dr. Marcos Souza', crm: '789012', state: 'MG', specialty: 'Clinica da Dor', email: 'marcos@email.com', status: 'pending', rating: 0, totalConsultations: 0, registeredAt: '28/03/2026' },
  { id: '4', name: 'Dr. Carlos Oliveira', crm: '345678', state: 'SP', specialty: 'Neurologia', email: 'carlos@email.com', status: 'approved', rating: 4.9, totalConsultations: 342, registeredAt: '01/01/2026' },
  { id: '5', name: 'Dra. Ana Beatriz Costa', crm: '901234', state: 'RS', specialty: 'Psiquiatria', email: 'anab@email.com', status: 'approved', rating: 4.8, totalConsultations: 218, registeredAt: '15/01/2026' },
  { id: '6', name: 'Dr. Paulo Henrique Dias', crm: '567890', state: 'PR', specialty: 'Oncologia', email: 'paulo@email.com', status: 'approved', rating: 4.7, totalConsultations: 156, registeredAt: '01/02/2026' },
  { id: '7', name: 'Dra. Juliana Martins', crm: '234567', state: 'BA', specialty: 'Reumatologia', email: 'juliana@email.com', status: 'approved', rating: 4.6, totalConsultations: 89, registeredAt: '20/02/2026' },
  { id: '8', name: 'Dr. Rafael Almeida', crm: '112233', state: 'CE', specialty: 'Neurologia', email: 'rafael@email.com', status: 'rejected', rating: 0, totalConsultations: 0, registeredAt: '10/03/2026' },
]

const STATUS_MAP = {
  pending: { label: 'Pendente', variant: 'warning' as const },
  approved: { label: 'Aprovado', variant: 'success' as const },
  rejected: { label: 'Rejeitado', variant: 'error' as const },
}

const TABS = [
  { id: 'all', label: 'Todos', count: MOCK_DOCTORS.length },
  { id: 'pending', label: 'Pendentes', count: MOCK_DOCTORS.filter((d) => d.status === 'pending').length },
  { id: 'approved', label: 'Aprovados', count: MOCK_DOCTORS.filter((d) => d.status === 'approved').length },
  { id: 'rejected', label: 'Rejeitados', count: MOCK_DOCTORS.filter((d) => d.status === 'rejected').length },
]

// ---------- Component ----------

export default function DoctorsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [actionModal, setActionModal] = useState<'approve' | 'reject' | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const filteredDoctors = activeTab === 'all'
    ? MOCK_DOCTORS
    : MOCK_DOCTORS.filter((d) => d.status === activeTab)

  const columns: Column<Doctor>[] = [
    {
      key: 'name',
      header: 'Medico',
      sortable: true,
      render: (doc) => (
        <div>
          <p className="font-medium text-surface-900">{doc.name}</p>
          <p className="text-xs text-surface-500">{doc.email}</p>
        </div>
      ),
    },
    {
      key: 'crm',
      header: 'CRM',
      render: (doc) => (
        <span className="text-surface-700 font-mono text-xs">
          CRM/{doc.state} {doc.crm}
        </span>
      ),
    },
    {
      key: 'specialty',
      header: 'Especialidade',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (doc) => {
        const s = STATUS_MAP[doc.status]
        return <Badge variant={s.variant} dot>{s.label}</Badge>
      },
    },
    {
      key: 'rating',
      header: 'Avaliacao',
      sortable: true,
      className: 'text-center',
      render: (doc) =>
        doc.status === 'approved' ? (
          <span className="text-sm font-medium text-yellow-600">
            {doc.rating.toFixed(1)}
          </span>
        ) : (
          <span className="text-surface-300">—</span>
        ),
    },
    {
      key: 'totalConsultations',
      header: 'Consultas',
      sortable: true,
      className: 'text-center',
      render: (doc) => (
        <span className="text-sm text-surface-700">{doc.totalConsultations}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Acoes',
      className: 'text-right',
      render: (doc) => (
        <div className="flex items-center justify-end gap-2">
          {doc.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedDoctor(doc)
                  setActionModal('approve')
                }}
              >
                Aprovar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedDoctor(doc)
                  setActionModal('reject')
                }}
              >
                Rejeitar
              </Button>
            </>
          )}
          {doc.status === 'approved' && (
            <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
              Ver Perfil
            </Button>
          )}
          {doc.status === 'rejected' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedDoctor(doc)
                setActionModal('approve')
              }}
            >
              Reavaliar
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-surface-900">Gestao de Medicos</h1>
          <p className="text-surface-500 text-sm">Verificacao e gerenciamento do corpo clinico</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-surface-900">{MOCK_DOCTORS.length}</p>
          <p className="text-xs text-surface-500">Total de Medicos</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-amber-600">
            {MOCK_DOCTORS.filter((d) => d.status === 'pending').length}
          </p>
          <p className="text-xs text-surface-500">Aguardando Verificacao</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-brand-600">
            {MOCK_DOCTORS.filter((d) => d.status === 'approved').length}
          </p>
          <p className="text-xs text-surface-500">Ativos na Plataforma</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-surface-900">
            {(MOCK_DOCTORS.filter((d) => d.status === 'approved').reduce((acc, d) => acc + d.rating, 0) /
              MOCK_DOCTORS.filter((d) => d.status === 'approved').length).toFixed(1)}
          </p>
          <p className="text-xs text-surface-500">Avaliacao Media</p>
        </Card>
      </div>

      {/* Tabs + Table */}
      <Card>
        <CardHeader>
          <Tabs tabs={TABS} defaultTab="all" onChange={setActiveTab} />
        </CardHeader>
        <DataTable
          data={filteredDoctors}
          columns={columns}
          searchable
          searchPlaceholder="Buscar por nome ou CRM..."
          searchKeys={['name', 'crm', 'email']}
          pageSize={10}
          emptyMessage="Nenhum medico encontrado."
        />
      </Card>

      {/* Approve Modal */}
      <Modal
        open={actionModal === 'approve' && !!selectedDoctor}
        onClose={() => {
          setActionModal(null)
          setSelectedDoctor(null)
        }}
        title="Aprovar Medico"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setActionModal(null); setSelectedDoctor(null) }}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                alert(`Medico ${selectedDoctor?.name} aprovado com sucesso!`)
                setActionModal(null)
                setSelectedDoctor(null)
              }}
            >
              Confirmar Aprovacao
            </Button>
          </>
        }
      >
        {selectedDoctor && (
          <div className="space-y-4">
            <p className="text-sm text-surface-700">
              Confirma a aprovacao de <strong>{selectedDoctor.name}</strong> (CRM/{selectedDoctor.state} {selectedDoctor.crm})?
            </p>
            <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-2 text-sm">
              <p><span className="text-surface-500">Especialidade:</span> {selectedDoctor.specialty}</p>
              <p><span className="text-surface-500">Email:</span> {selectedDoctor.email}</p>
              <p><span className="text-surface-500">Data de Cadastro:</span> {selectedDoctor.registeredAt}</p>
            </div>
            <p className="text-xs text-surface-400">
              Ao aprovar, o medico podera atender pacientes e emitir prescricoes na plataforma.
            </p>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={actionModal === 'reject' && !!selectedDoctor}
        onClose={() => {
          setActionModal(null)
          setSelectedDoctor(null)
          setRejectReason('')
        }}
        title="Rejeitar Medico"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setActionModal(null); setSelectedDoctor(null); setRejectReason('') }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim()}
              onClick={() => {
                alert(`Medico ${selectedDoctor?.name} rejeitado. Motivo: ${rejectReason}`)
                setActionModal(null)
                setSelectedDoctor(null)
                setRejectReason('')
              }}
            >
              Confirmar Rejeicao
            </Button>
          </>
        }
      >
        {selectedDoctor && (
          <div className="space-y-4">
            <p className="text-sm text-surface-700">
              Informe o motivo da rejeicao de <strong>{selectedDoctor.name}</strong>:
            </p>
            <Input
              label="Motivo da Rejeicao"
              placeholder="Ex: CRM nao encontrado no registro do conselho..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              error={rejectReason.length === 0 ? undefined : undefined}
              helperText="O medico sera notificado por email com este motivo."
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
