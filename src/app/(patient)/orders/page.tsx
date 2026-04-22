'use client'

import { useState } from 'react'

// --- Types ---
interface OrderItem {
  name: string
  quantity: number
  unitPrice: number
}

interface TimelineStep {
  key: string
  label: string
  date: string | null
  completed: boolean
  current: boolean
}

interface Order {
  id: string
  code: string
  date: string
  status: 'PENDING_PAYMENT' | 'PAID' | 'ANVISA_REVIEW' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  statusLabel: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  estimatedDelivery: string | null
  trackingCode: string | null
  timeline: TimelineStep[]
}

// --- Mock Data ---
const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-001',
    code: 'WD-2026-001847',
    date: '2026-03-25',
    status: 'SHIPPED',
    statusLabel: 'Enviado',
    items: [
      { name: 'CBD Full Spectrum 30mg/mL', quantity: 2, unitPrice: 289.90 },
      { name: 'CBD Gomas 10mg', quantity: 1, unitPrice: 189.90 },
    ],
    subtotal: 769.70,
    shipping: 29.90,
    total: 799.60,
    estimatedDelivery: '2026-04-03',
    trackingCode: 'BR123456789XX',
    timeline: [
      { key: 'ordered', label: 'Pedido Realizado', date: '25/03/2026', completed: true, current: false },
      { key: 'paid', label: 'Pagamento Confirmado', date: '25/03/2026', completed: true, current: false },
      { key: 'anvisa', label: 'Aprovacao ANVISA', date: '27/03/2026', completed: true, current: false },
      { key: 'shipped', label: 'Enviado', date: '29/03/2026', completed: true, current: true },
      { key: 'delivered', label: 'Entregue', date: null, completed: false, current: false },
    ],
  },
  {
    id: 'ord-002',
    code: 'WD-2026-001523',
    date: '2026-03-15',
    status: 'ANVISA_REVIEW',
    statusLabel: 'Aguardando ANVISA',
    items: [
      { name: 'THC:CBD 1:1 Oleo 10mg/mL', quantity: 1, unitPrice: 549.90 },
    ],
    subtotal: 549.90,
    shipping: 0,
    total: 549.90,
    estimatedDelivery: '2026-04-10',
    trackingCode: null,
    timeline: [
      { key: 'ordered', label: 'Pedido Realizado', date: '15/03/2026', completed: true, current: false },
      { key: 'paid', label: 'Pagamento Confirmado', date: '15/03/2026', completed: true, current: false },
      { key: 'anvisa', label: 'Aprovacao ANVISA', date: null, completed: false, current: true },
      { key: 'shipped', label: 'Enviado', date: null, completed: false, current: false },
      { key: 'delivered', label: 'Entregue', date: null, completed: false, current: false },
    ],
  },
  {
    id: 'ord-003',
    code: 'WD-2026-000987',
    date: '2026-02-10',
    status: 'DELIVERED',
    statusLabel: 'Entregue',
    items: [
      { name: 'CBD Full Spectrum 30mg/mL', quantity: 1, unitPrice: 289.90 },
      { name: 'CBD Isolado Capsulas 25mg', quantity: 1, unitPrice: 199.90 },
    ],
    subtotal: 489.80,
    shipping: 29.90,
    total: 519.70,
    estimatedDelivery: '2026-02-22',
    trackingCode: 'BR987654321XX',
    timeline: [
      { key: 'ordered', label: 'Pedido Realizado', date: '10/02/2026', completed: true, current: false },
      { key: 'paid', label: 'Pagamento Confirmado', date: '10/02/2026', completed: true, current: false },
      { key: 'anvisa', label: 'Aprovacao ANVISA', date: '13/02/2026', completed: true, current: false },
      { key: 'shipped', label: 'Enviado', date: '15/02/2026', completed: true, current: false },
      { key: 'delivered', label: 'Entregue', date: '22/02/2026', completed: true, current: false },
    ],
  },
  {
    id: 'ord-004',
    code: 'WD-2025-004112',
    date: '2025-12-05',
    status: 'CANCELLED',
    statusLabel: 'Cancelado',
    items: [
      { name: 'CBD Spray Oral 15mg/dose', quantity: 1, unitPrice: 329.90 },
    ],
    subtotal: 329.90,
    shipping: 29.90,
    total: 359.80,
    estimatedDelivery: null,
    trackingCode: null,
    timeline: [
      { key: 'ordered', label: 'Pedido Realizado', date: '05/12/2025', completed: true, current: false },
      { key: 'cancelled', label: 'Cancelado pelo usuario', date: '06/12/2025', completed: true, current: true },
    ],
  },
]

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getStatusColor(status: Order['status']): string {
  switch (status) {
    case 'PENDING_PAYMENT': return 'bg-amber-100 text-amber-700'
    case 'PAID': return 'bg-blue-100 text-blue-700'
    case 'ANVISA_REVIEW': return 'bg-purple-100 text-purple-700'
    case 'SHIPPED': return 'bg-brand-100 text-brand-700'
    case 'DELIVERED': return 'bg-brand-100 text-brand-700'
    case 'CANCELLED': return 'bg-red-100 text-red-700'
    default: return 'bg-surface-100 text-surface-600'
  }
}

export default function OrdersPage() {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  const filtered = MOCK_ORDERS.filter((o) => {
    if (filter === 'active') return ['PENDING_PAYMENT', 'PAID', 'ANVISA_REVIEW', 'SHIPPED'].includes(o.status)
    if (filter === 'completed') return ['DELIVERED', 'CANCELLED'].includes(o.status)
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900">Meus Pedidos</h1>
        <p className="text-surface-500">Acompanhe suas compras de cannabis medicinal</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1">
        {[
          { key: 'all' as const, label: 'Todos' },
          { key: 'active' as const, label: 'Em Andamento' },
          { key: 'completed' as const, label: 'Finalizados' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
              filter === tab.key
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders */}
      <div className="space-y-4">
        {filtered.map((order) => {
          const isExpanded = expandedOrder === order.id
          return (
            <div
              key={order.id}
              className="rounded-2xl bg-white border border-surface-200 shadow-sm overflow-hidden"
            >
              {/* Order Header */}
              <button
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                className="w-full p-6 text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm font-medium text-surface-900">{order.code}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.statusLabel}
                      </span>
                    </div>
                    <p className="text-xs text-surface-500">
                      Realizado em {new Date(order.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold text-surface-900">{formatBRL(order.total)}</p>
                    <p className="text-xs text-surface-500">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                    </p>
                  </div>
                </div>

                {/* Mini Timeline */}
                {order.status !== 'CANCELLED' && (
                  <div className="flex items-center gap-1">
                    {order.timeline.filter((s) => s.key !== 'cancelled').map((step, i, arr) => (
                      <div key={step.key} className="flex items-center flex-1">
                        <div
                          className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            step.completed ? 'bg-brand-500' : step.current ? 'bg-brand-300 ring-4 ring-brand-100' : 'bg-surface-200'
                          }`}
                        />
                        {i < arr.length - 1 && (
                          <div
                            className={`flex-1 h-0.5 ${
                              step.completed && arr[i + 1]?.completed ? 'bg-brand-500' : step.completed ? 'bg-brand-300' : 'bg-surface-200'
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Estimated Delivery */}
                {order.estimatedDelivery && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                  <p className="text-xs text-surface-500 mt-2">
                    Previsao de entrega: {new Date(order.estimatedDelivery).toLocaleDateString('pt-BR')}
                  </p>
                )}

                <div className="flex items-center justify-center mt-3">
                  <span className="text-xs text-surface-400">{isExpanded ? '▲ Menos detalhes' : '▼ Mais detalhes'}</span>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-6 pb-6 space-y-5 border-t border-surface-100 pt-5">
                  {/* Full Timeline */}
                  <div>
                    <h3 className="font-heading font-semibold text-surface-900 mb-3">Rastreamento</h3>
                    <div className="space-y-0">
                      {order.timeline.map((step, i) => (
                        <div key={step.key} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-4 h-4 rounded-full flex-shrink-0 ${
                                step.completed
                                  ? step.key === 'cancelled'
                                    ? 'bg-red-500'
                                    : 'bg-brand-500'
                                  : step.current
                                  ? 'bg-brand-300 ring-4 ring-brand-100'
                                  : 'bg-surface-200'
                              }`}
                            />
                            {i < order.timeline.length - 1 && (
                              <div className={`w-0.5 h-10 ${step.completed ? 'bg-brand-200' : 'bg-surface-200'}`} />
                            )}
                          </div>
                          <div className="pb-3">
                            <p className={`text-sm font-medium ${step.completed || step.current ? 'text-surface-900' : 'text-surface-400'}`}>
                              {step.label}
                            </p>
                            <p className="text-xs text-surface-400">{step.date ?? 'Pendente'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tracking Code */}
                  {order.trackingCode && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 border border-surface-100">
                      <span>📦</span>
                      <div>
                        <p className="text-xs text-surface-500">Codigo de Rastreio</p>
                        <p className="font-mono text-sm font-medium text-surface-900">{order.trackingCode}</p>
                      </div>
                      <button className="ml-auto text-xs text-brand-600 hover:underline">Copiar</button>
                    </div>
                  )}

                  {/* Order Items */}
                  <div>
                    <h3 className="font-heading font-semibold text-surface-900 mb-3">Itens do Pedido</h3>
                    <div className="space-y-2">
                      {order.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-xl bg-surface-50 border border-surface-100"
                        >
                          <div>
                            <p className="font-medium text-sm text-surface-900">{item.name}</p>
                            <p className="text-xs text-surface-500">Qtd: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium text-surface-900">{formatBRL(item.unitPrice * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 pt-3 border-t border-surface-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-surface-500">Subtotal</span>
                      <span className="text-surface-700">{formatBRL(order.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-surface-500">Frete</span>
                      <span className="text-surface-700">
                        {order.shipping === 0 ? 'Gratis' : formatBRL(order.shipping)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span className="text-surface-900">Total</span>
                      <span className="text-surface-900">{formatBRL(order.total)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    {order.status === 'DELIVERED' && (
                      <button className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition">
                        Comprar Novamente
                      </button>
                    )}
                    <button className="px-4 py-2 rounded-lg border border-surface-200 text-surface-700 text-sm font-medium hover:bg-surface-50 transition">
                      Nota Fiscal
                    </button>
                    {['PENDING_PAYMENT', 'PAID'].includes(order.status) && (
                      <button className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition">
                        Cancelar Pedido
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <span className="text-5xl block mb-4">📦</span>
          <p className="text-surface-500">Nenhum pedido encontrado</p>
        </div>
      )}
    </div>
  )
}
