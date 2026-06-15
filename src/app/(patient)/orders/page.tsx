'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { trpc } from '@/lib/trpc'

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING_PAYMENT: {
    label: 'Aguardando pagamento',
    cls: 'bg-warning-50 text-warning-700 border-warning-600/30',
  },
  PAID: { label: 'Pago', cls: 'bg-success-50 text-success-700 border-success-600/30' },
  PROCESSING: { label: 'Em preparação', cls: 'bg-info-50 text-info-700 border-info-600/30' },
  AWAITING_ANVISA: {
    label: 'Aguardando ANVISA',
    cls: 'bg-sage-100 text-sage-700 border-sage-400',
  },
  ANVISA_APPROVED: {
    label: 'ANVISA aprovou',
    cls: 'bg-sage-100 text-sage-700 border-sage-400',
  },
  SHIPPED: { label: 'Enviado', cls: 'bg-info-50 text-info-700 border-info-600/30' },
  IN_TRANSIT: { label: 'Em trânsito', cls: 'bg-info-50 text-info-700 border-info-600/30' },
  OUT_FOR_DELIVERY: {
    label: 'Saiu pra entrega',
    cls: 'bg-info-50 text-info-700 border-info-600/30',
  },
  DELIVERED: { label: 'Entregue', cls: 'bg-success-50 text-success-700 border-success-600/30' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-error-50 text-error-600 border-error-600/30' },
  REFUNDED: { label: 'Reembolsado', cls: 'bg-surface-100 text-surface-600 border-surface-300' },
}

function formatBRL(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`
}

function formatDate(d: string | Date) {
  const dt = d instanceof Date ? d : new Date(d)
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function PatientOrdersPage() {
  const searchParams = useSearchParams()
  const paymentStatus = searchParams.get('payment')
  const query = trpc.order.listForPatient.useQuery({ page: 1, limit: 50 })
  const orders = useMemo(() => query.data?.orders ?? [], [query.data])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900">Meus pedidos</h1>
        <p className="text-sm text-surface-500">
          Acompanhe seus pedidos de produtos e o status de cada um.
        </p>
      </div>

      {paymentStatus === 'success' && (
        <div className="p-4 rounded-xl bg-success-50 border border-success-600/30 text-sm text-success-700">
          ✅ Pagamento confirmado! Seu pedido está em preparação.
        </div>
      )}
      {paymentStatus === 'cancelled' && (
        <div className="p-4 rounded-xl bg-warning-50 border border-warning-600/30 text-sm text-warning-700">
          Pagamento cancelado. Você pode tentar novamente a qualquer momento.
        </div>
      )}
      {paymentStatus === 'error' && (
        <div className="p-4 rounded-xl bg-error-50 border border-error-600/30 text-sm text-error-600">
          Não conseguimos confirmar o pagamento. Tente novamente ou entre em contato.
        </div>
      )}

      {query.isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
        </div>
      )}

      {!query.isLoading && orders.length === 0 && (
        <div className="p-8 rounded-2xl bg-white border border-surface-200 text-center">
          <p className="text-sm font-medium text-surface-700">Você ainda não tem pedidos.</p>
          <p className="text-xs text-surface-500 mt-1 mb-3">
            Quando comprar um produto, ele aparecerá aqui.
          </p>
          <Link
            href="/products"
            className="inline-block px-5 py-2 rounded-xl gradient-brand text-white text-sm font-medium"
          >
            Ver produtos
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((o) => {
          const st = STATUS_LABEL[o.status] ?? {
            label: o.status,
            cls: 'bg-surface-100 text-surface-600 border-surface-300',
          }
          return (
            <div
              key={o.id}
              className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-surface-900">Pedido #{o.id.slice(0, 8)}</p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5">
                    {formatDate(o.createdAt)} · {o.items.length} item(s)
                  </p>
                </div>
                <p className="font-semibold text-surface-900">{formatBRL(o.totalCents)}</p>
              </div>
              <div className="mt-3 space-y-1">
                {o.items.map((it) => (
                  <p key={it.id} className="text-xs text-surface-600">
                    • {it.quantity}× {it.product?.name ?? '(produto)'} —{' '}
                    {formatBRL(it.totalCents)}
                  </p>
                ))}
              </div>
              {o.trackingCode && (
                <div className="mt-3 pt-3 border-t border-surface-100">
                  <p className="text-xs text-surface-500">
                    Rastreio:{' '}
                    <strong className="text-surface-700">{o.trackingCode}</strong>
                    {o.trackingCarrier ? ` (${o.trackingCarrier})` : ''}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
