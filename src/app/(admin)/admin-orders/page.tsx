'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Tabs } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils'

// ---------- Types ----------

type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'awaiting_anvisa'

interface Order {
  id: string
  code: string
  patient: string
  product: string
  totalCents: number
  status: OrderStatus
  createdAt: string
  tracking: string | null
  [key: string]: unknown
}

// ---------- Mock data ----------

const STATUS_MAP: Record<OrderStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  processing: { label: 'Processando', variant: 'info' },
  awaiting_anvisa: { label: 'Aguardando ANVISA', variant: 'warning' },
  shipped: { label: 'Enviado', variant: 'info' },
  delivered: { label: 'Entregue', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'error' },
  refunded: { label: 'Reembolsado', variant: 'neutral' },
}

const MOCK_ORDERS: Order[] = [
  { id: '1', code: '#4872', patient: 'Maria Silva', product: 'CBD Full Spectrum 3000mg', totalCents: 54900, status: 'processing', createdAt: '31/03/2026', tracking: null },
  { id: '2', code: '#4871', patient: 'Joao Santos', product: 'CBD Isolado 500mg', totalCents: 19900, status: 'shipped', createdAt: '30/03/2026', tracking: 'BR123456789' },
  { id: '3', code: '#4870', patient: 'Ana Pereira', product: 'THC:CBD 1:1 500mg', totalCents: 42900, status: 'awaiting_anvisa', createdAt: '30/03/2026', tracking: null },
  { id: '4', code: '#4869', patient: 'Pedro Costa', product: 'CBD Full Spectrum 1000mg', totalCents: 28900, status: 'delivered', createdAt: '28/03/2026', tracking: 'BR987654321' },
  { id: '5', code: '#4868', patient: 'Lucia Ferreira', product: 'CBD Capsulas 25mg', totalCents: 24900, status: 'delivered', createdAt: '27/03/2026', tracking: 'BR456789123' },
  { id: '6', code: '#4867', patient: 'Roberto Lima', product: 'CBD Broad Spectrum 2000mg', totalCents: 39900, status: 'processing', createdAt: '27/03/2026', tracking: null },
  { id: '7', code: '#4866', patient: 'Carla Mendes', product: 'CBG + CBD 1500mg', totalCents: 44900, status: 'shipped', createdAt: '26/03/2026', tracking: 'BR111222333' },
  { id: '8', code: '#4801', patient: 'Fernando Souza', product: 'CBD Full Spectrum 1000mg', totalCents: 34200, status: 'refunded', createdAt: '20/03/2026', tracking: null },
  { id: '9', code: '#4800', patient: 'Sandra Oliveira', product: 'THC Oral 10mg/ml', totalCents: 68900, status: 'cancelled', createdAt: '19/03/2026', tracking: null },
]

const TABS = [
  { id: 'all', label: 'Todos', count: MOCK_ORDERS.length },
  { id: 'processing', label: 'Processando', count: MOCK_ORDERS.filter((o) => o.status === 'processing').length },
  { id: 'awaiting_anvisa', label: 'ANVISA', count: MOCK_ORDERS.filter((o) => o.status === 'awaiting_anvisa').length },
  { id: 'shipped', label: 'Enviados', count: MOCK_ORDERS.filter((o) => o.status === 'shipped').length },
  { id: 'delivered', label: 'Entregues', count: MOCK_ORDERS.filter((o) => o.status === 'delivered').length },
]

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  processing: 'shipped',
  shipped: 'delivered',
}

// ---------- Component ----------

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [trackingModal, setTrackingModal] = useState<Order | null>(null)
  const [trackingCode, setTrackingCode] = useState('')
  const [refundModal, setRefundModal] = useState<Order | null>(null)

  const filteredOrders = activeTab === 'all'
    ? MOCK_ORDERS
    : MOCK_ORDERS.filter((o) => o.status === activeTab)

  const handleAdvanceStatus = (order: Order) => {
    const next = NEXT_STATUS[order.status]
    if (next) {
      alert(`Pedido ${order.code} atualizado para: ${STATUS_MAP[next].label}`)
    }
  }

  const columns: Column<Order>[] = [
    {
      key: 'code',
      header: 'Pedido',
      render: (o) => <span className="font-mono font-medium text-surface-900">{o.code}</span>,
    },
    {
      key: 'patient',
      header: 'Paciente',
      sortable: true,
      render: (o) => <span className="text-surface-700">{o.patient}</span>,
    },
    {
      key: 'product',
      header: 'Produto',
      render: (o) => <span className="text-sm text-surface-600">{o.product}</span>,
    },
    {
      key: 'totalCents',
      header: 'Valor',
      sortable: true,
      className: 'text-right',
      render: (o) => <span className="font-medium text-surface-900">{formatCurrency(o.totalCents)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => {
        const s = STATUS_MAP[o.status]
        return <Badge variant={s.variant} dot>{s.label}</Badge>
      },
    },
    {
      key: 'tracking',
      header: 'Rastreio',
      render: (o) =>
        o.tracking ? (
          <span className="font-mono text-xs text-brand-600">{o.tracking}</span>
        ) : (
          <span className="text-xs text-surface-300">—</span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Data',
      sortable: true,
      render: (o) => <span className="text-sm text-surface-500">{o.createdAt}</span>,
    },
    {
      key: 'actions',
      header: 'Acoes',
      className: 'text-right',
      render: (o) => (
        <div className="flex items-center justify-end gap-2">
          {o.status === 'processing' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  setTrackingModal(o)
                }}
              >
                Rastreio
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation()
                  handleAdvanceStatus(o)
                }}
              >
                Enviar
              </Button>
            </>
          )}
          {o.status === 'shipped' && (
            <Button
              size="sm"
              variant="primary"
              onClick={(e) => {
                e.stopPropagation()
                handleAdvanceStatus(o)
              }}
            >
              Confirmar Entrega
            </Button>
          )}
          {(o.status === 'delivered' || o.status === 'shipped') && (
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation()
                setRefundModal(o)
              }}
            >
              Reembolsar
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900">Gestao de Pedidos</h1>
        <p className="text-surface-500 text-sm">Acompanhamento e gerenciamento de todos os pedidos</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-surface-900">{MOCK_ORDERS.length}</p>
          <p className="text-xs text-surface-500">Total de Pedidos</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-brand-600">
            {formatCurrency(MOCK_ORDERS.reduce((sum, o) => sum + o.totalCents, 0))}
          </p>
          <p className="text-xs text-surface-500">Valor Total</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-blue-600">
            {MOCK_ORDERS.filter((o) => o.status === 'processing').length}
          </p>
          <p className="text-xs text-surface-500">Processando</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-amber-600">
            {MOCK_ORDERS.filter((o) => o.status === 'awaiting_anvisa').length}
          </p>
          <p className="text-xs text-surface-500">Aguardando ANVISA</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-green-600">
            {MOCK_ORDERS.filter((o) => o.status === 'delivered').length}
          </p>
          <p className="text-xs text-surface-500">Entregues</p>
        </Card>
      </div>

      {/* Table */}
      <Card noPadding>
        <div className="p-6">
          <CardHeader>
            <Tabs tabs={TABS} defaultTab="all" onChange={setActiveTab} />
          </CardHeader>
          <DataTable
            data={filteredOrders}
            columns={columns}
            searchable
            searchPlaceholder="Buscar pedido, paciente ou produto..."
            searchKeys={['code', 'patient', 'product']}
            pageSize={10}
            emptyMessage="Nenhum pedido encontrado."
          />
        </div>
      </Card>

      {/* Tracking Modal */}
      <Modal
        open={!!trackingModal}
        onClose={() => { setTrackingModal(null); setTrackingCode('') }}
        title="Adicionar Codigo de Rastreio"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setTrackingModal(null); setTrackingCode('') }}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              disabled={!trackingCode.trim()}
              onClick={() => {
                alert(`Rastreio ${trackingCode} adicionado ao pedido ${trackingModal?.code}`)
                setTrackingModal(null)
                setTrackingCode('')
              }}
            >
              Salvar Rastreio
            </Button>
          </>
        }
      >
        {trackingModal && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 text-sm space-y-1">
              <p><span className="text-surface-500">Pedido:</span> <strong>{trackingModal.code}</strong></p>
              <p><span className="text-surface-500">Paciente:</span> {trackingModal.patient}</p>
              <p><span className="text-surface-500">Produto:</span> {trackingModal.product}</p>
            </div>
            <Input
              label="Codigo de Rastreio"
              placeholder="Ex: BR123456789"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              helperText="O paciente sera notificado automaticamente por email e WhatsApp."
            />
          </div>
        )}
      </Modal>

      {/* Refund Modal */}
      <Modal
        open={!!refundModal}
        onClose={() => setRefundModal(null)}
        title="Confirmar Reembolso"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setRefundModal(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                alert(`Reembolso processado para pedido ${refundModal?.code}`)
                setRefundModal(null)
              }}
            >
              Confirmar Reembolso
            </Button>
          </>
        }
      >
        {refundModal && (
          <div className="space-y-4">
            <p className="text-sm text-surface-700">
              Confirma o reembolso do pedido <strong>{refundModal.code}</strong>?
            </p>
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm space-y-1">
              <p><span className="text-red-600">Paciente:</span> {refundModal.patient}</p>
              <p><span className="text-red-600">Valor:</span> <strong>{formatCurrency(refundModal.totalCents)}</strong></p>
              <p><span className="text-red-600">Produto:</span> {refundModal.product}</p>
            </div>
            <p className="text-xs text-surface-400">
              O reembolso sera processado via Stripe e o paciente recebera o valor em ate 10 dias uteis.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
