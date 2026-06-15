'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { trpc } from '@/lib/trpc'

const CATEGORY_LABEL: Record<string, string> = {
  OIL: 'Óleo',
  CAPSULE: 'Cápsula',
  SPRAY: 'Spray',
  TOPICAL: 'Tópico',
  GUMMY: 'Goma',
  FLOWER: 'Flor',
  VAPORIZER: 'Vaporizador',
  OTHER: 'Outro',
}

export default function PatientProductsPage() {
  const [search, setSearch] = useState('')
  const listQuery = trpc.product.list.useQuery({
    page: 1,
    limit: 100,
    ...(search ? { search } : {}),
  })

  const products = useMemo(() => listQuery.data?.products ?? [], [listQuery.data])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900">Produtos</h1>
        <p className="text-sm text-surface-500">
          Catálogo de produtos disponíveis. Para comprar, você precisa de uma prescrição vigente
          do seu médico.
        </p>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nome, fabricante ou descrição..."
        className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />

      {listQuery.isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
        </div>
      )}

      {!listQuery.isLoading && products.length === 0 && (
        <div className="p-8 rounded-2xl bg-white border border-surface-200 text-center">
          <p className="text-sm font-medium text-surface-700">Nenhum produto disponível ainda.</p>
          <p className="text-xs text-surface-500 mt-1">
            O catálogo está sendo montado. Volte em breve.
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <div
            key={p.id}
            className="p-5 rounded-2xl bg-white border border-surface-200 shadow-sm flex flex-col"
          >
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sage-100 text-sage-700">
                {p.rdcClassification}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-100 text-surface-600">
                {CATEGORY_LABEL[p.category] ?? p.category}
              </span>
            </div>
            <h3 className="font-heading font-semibold text-surface-900">{p.name}</h3>
            <p className="text-xs text-surface-500 mt-0.5">{p.manufacturer}</p>
            <p className="text-xs text-surface-500 mt-1">
              {p.concentration} · {p.form}
            </p>
            {p.description && (
              <p className="text-xs text-surface-500 mt-2 line-clamp-3 flex-1">{p.description}</p>
            )}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-100">
              <p className="text-lg font-heading font-bold text-surface-900">
                R$ {(p.priceCents / 100).toFixed(2).replace('.', ',')}
              </p>
              <Link
                href={`/checkout/${p.id}`}
                className="px-4 py-2 rounded-lg gradient-brand text-white text-xs font-medium hover:opacity-90 transition"
              >
                Comprar
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
