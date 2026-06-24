'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { trpc } from '@/lib/trpc'
import { StatusBadge } from '@/components/ui/status-badge'
import { mapOrderStatus } from '@/lib/status-registry'

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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900">Meus pedidos</h1>
        <p className="text-sm text-surface-500">
          Acompanhe seus pedidos de produtos e o status de cada um.
        </p>
      </div>

      {/* Banners de retorno de pagamento */}
      {paymentStatus === 'success' && (
        <StatusBadge
          kind="order"
          state="pago-em-processamento"
          variant="banner"
          showAction={false}
        />
      )}
      {paymentStatus === 'cancelled' && (
        <div className="p-4 rounded-xl bg-warning-50 border border-warning-100 text-sm text-warning-700">
          Pagamento cancelado. Você pode tentar novamente a qualquer momento.
        </div>
      )}
      {paymentStatus === 'error' && (
        <div className="p-4 rounded-xl bg-error-50 border border-error-100 text-sm text-error-700">
          Não conseguimos confirmar o pagamento. Tente novamente ou entre em contato com o suporte.
        </div>
      )}

      {/* Estado 1: Loading */}
      {query.isLoading && (
        <div className="space-y-3" role="status" aria-label="Carregando pedidos">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-surface-100 animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {/* Estado 2: Erro */}
      {query.isError && (
        <div className="p-4 rounded-xl bg-error-50 border border-error-100 text-sm text-error-700">
          <p className="font-medium">Erro ao carregar pedidos.</p>
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
      {!query.isLoading && !query.isError && orders.length === 0 && (
        <div className="p-8 rounded-2xl bg-white border border-surface-200 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-100">
            <span className="text-2xl" aria-hidden="true">📦</span>
          </div>
          <p className="text-sm font-medium text-surface-700">Você ainda não tem pedidos.</p>
          <p className="text-xs text-surface-500 mt-1 mb-4">
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

      {/* Estado 4: Dados */}
      {!query.isLoading && !query.isError && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((o) => {
            const registryState = mapOrderStatus(o.status)
            return (
              <div
                key={o.id}
                className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-surface-900">Pedido #{o.id.slice(0, 8)}</p>
                      <StatusBadge
                        kind="order"
                        state={registryState}
                        variant="badge"
                      />
                    </div>
                    <p className="text-xs text-surface-500 mt-0.5">
                      {formatDate(o.createdAt)} · {o.items.length} item(s)
                    </p>
                  </div>
                  <p className="font-semibold text-surface-900">{formatBRL(o.totalCents)}</p>
                </div>

                {/* Itens */}
                <div className="mt-3 space-y-1">
                  {o.items.map((it) => (
                    <p key={it.id} className="text-xs text-surface-600">
                      · {it.quantity}x {it.product?.name ?? '(produto)'} —{' '}
                      {formatBRL(it.totalCents)}
                    </p>
                  ))}
                </div>

                {/* Rastreio */}
                {o.trackingCode && (
                  <div className="mt-3 pt-3 border-t border-surface-100">
                    <p className="text-xs text-surface-500">
                      Rastreio:{' '}
                      <strong className="text-surface-700">{o.trackingCode}</strong>
                      {o.trackingCarrier ? ` (${o.trackingCarrier})` : ''}
                    </p>
                  </div>
                )}

                {/* CTA contextual: pedido aguardando pagamento */}
                {registryState === 'aguardando-pagamento' && (
                  <div className="mt-3 pt-3 border-t border-surface-100">
                    <StatusBadge
                      kind="order"
                      state={registryState}
                      variant="card"
                      showAction={false}
                    />
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
