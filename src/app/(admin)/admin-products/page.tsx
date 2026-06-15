'use client'

import { useMemo, useState } from 'react'
import { trpc } from '@/lib/trpc'

type Origin = 'IMPORTED' | 'DOMESTIC'
type Category = 'OIL' | 'CAPSULE' | 'SPRAY' | 'TOPICAL' | 'GUMMY' | 'FLOWER' | 'VAPORIZER' | 'OTHER'
type PrescType = 'TYPE_A' | 'TYPE_B' | 'SIMPLE'

interface NewProduct {
  name: string
  manufacturer: string
  origin: Origin
  category: Category
  form: string
  concentration: string
  priceReais: string
  rdcClassification: 'RDC327' | 'RDC660'
  requiresPrescriptionType: PrescType
  stockQuantity: string
  description: string
}

function emptyDraft(): NewProduct {
  return {
    name: '',
    manufacturer: '',
    origin: 'DOMESTIC',
    category: 'OIL',
    form: 'Sublingual',
    concentration: '',
    priceReais: '',
    rdcClassification: 'RDC327',
    requiresPrescriptionType: 'TYPE_B',
    stockQuantity: '0',
    description: '',
  }
}

const CATEGORY_LABEL: Record<Category, string> = {
  OIL: 'Óleo',
  CAPSULE: 'Cápsula',
  SPRAY: 'Spray',
  TOPICAL: 'Tópico',
  GUMMY: 'Goma',
  FLOWER: 'Flor',
  VAPORIZER: 'Vaporizador',
  OTHER: 'Outro',
}

export default function AdminProductsPage() {
  const listQuery = trpc.product.list.useQuery({ page: 1, limit: 100 })
  const createMutation = trpc.product.create.useMutation({
    onSuccess: () => {
      listQuery.refetch()
      setOpen(false)
      setDraft(emptyDraft())
    },
  })
  const updateMutation = trpc.product.update.useMutation({
    onSuccess: () => listQuery.refetch(),
  })

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<NewProduct>(emptyDraft())
  const [err, setErr] = useState('')

  const products = useMemo(() => listQuery.data?.products ?? [], [listQuery.data])

  const handleCreate = async () => {
    setErr('')
    const priceCents = Math.round(parseFloat(draft.priceReais.replace(',', '.')) * 100)
    if (!draft.name || !draft.manufacturer || !draft.concentration) {
      setErr('Preencha nome, fabricante e concentração.')
      return
    }
    if (!isFinite(priceCents) || priceCents <= 0) {
      setErr('Preço inválido.')
      return
    }
    try {
      await createMutation.mutateAsync({
        name: draft.name,
        manufacturer: draft.manufacturer,
        origin: draft.origin,
        category: draft.category,
        form: draft.form,
        concentration: draft.concentration,
        priceCents,
        rdcClassification: draft.rdcClassification,
        requiresPrescriptionType: draft.requiresPrescriptionType,
        stockQuantity: parseInt(draft.stockQuantity || '0', 10),
        description: draft.description || undefined,
        imageUrls: [],
      })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao criar produto.')
    }
  }

  const toggleAvailable = async (id: string, current: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, data: { isAvailable: !current } })
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-surface-900">Catálogo de produtos</h1>
          <p className="text-sm text-surface-500">
            Produtos disponíveis para os pacientes comprarem após a prescrição.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition"
        >
          + Novo produto
        </button>
      </div>

      {listQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-surface-200 text-center text-sm text-surface-500">
          Nenhum produto no catálogo ainda. Crie o primeiro acima.
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl bg-white border border-surface-200 flex items-center justify-between gap-3 flex-wrap"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-surface-900">{p.name}</p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      p.isAvailable
                        ? 'bg-success-50 text-success-700 border-success-600/30'
                        : 'bg-surface-100 text-surface-500 border-surface-300'
                    }`}
                  >
                    {p.isAvailable ? 'Disponível' : 'Pausado'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sage-100 text-sage-700">
                    {p.rdcClassification}
                  </span>
                </div>
                <p className="text-xs text-surface-500">
                  {p.manufacturer} · {p.concentration} · {p.form} · estoque: {p.stockQuantity}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold text-surface-900">
                  R$ {(p.priceCents / 100).toFixed(2).replace('.', ',')}
                </p>
                <button
                  onClick={() => toggleAvailable(p.id, p.isAvailable)}
                  className="px-3 py-1.5 rounded-lg border border-surface-200 text-xs font-medium text-surface-700 hover:bg-surface-50 transition"
                >
                  {p.isAvailable ? 'Pausar' : 'Ativar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-heading font-bold text-surface-900 mb-4">Novo produto</h2>
            <div className="space-y-3">
              <input
                placeholder="Nome do produto"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                placeholder="Fabricante"
                value={draft.manufacturer}
                onChange={(e) => setDraft({ ...draft, manufacturer: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={draft.origin}
                  onChange={(e) => setDraft({ ...draft, origin: e.target.value as Origin })}
                  className="px-3 py-2 rounded-lg border border-surface-200 text-sm"
                >
                  <option value="DOMESTIC">Nacional (RDC 327)</option>
                  <option value="IMPORTED">Importado (RDC 660)</option>
                </select>
                <select
                  value={draft.rdcClassification}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      rdcClassification: e.target.value as 'RDC327' | 'RDC660',
                    })
                  }
                  className="px-3 py-2 rounded-lg border border-surface-200 text-sm"
                >
                  <option value="RDC327">RDC 327</option>
                  <option value="RDC660">RDC 660</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({ ...draft, category: e.target.value as Category })
                  }
                  className="px-3 py-2 rounded-lg border border-surface-200 text-sm"
                >
                  {(Object.entries(CATEGORY_LABEL) as [Category, string][]).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <select
                  value={draft.requiresPrescriptionType}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      requiresPrescriptionType: e.target.value as PrescType,
                    })
                  }
                  className="px-3 py-2 rounded-lg border border-surface-200 text-sm"
                >
                  <option value="TYPE_B">Receita B (THC &lt; 0,2%)</option>
                  <option value="TYPE_A">Receita A (THC &gt; 0,2%)</option>
                  <option value="SIMPLE">Receita simples</option>
                </select>
              </div>
              <input
                placeholder="Forma / via (Ex.: Sublingual)"
                value={draft.form}
                onChange={(e) => setDraft({ ...draft, form: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm"
              />
              <input
                placeholder="Concentração (Ex.: 200 mg/mL)"
                value={draft.concentration}
                onChange={(e) => setDraft({ ...draft, concentration: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  inputMode="decimal"
                  placeholder="Preço R$ (Ex.: 250,00)"
                  value={draft.priceReais}
                  onChange={(e) => setDraft({ ...draft, priceReais: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-surface-200 text-sm"
                />
                <input
                  type="number"
                  placeholder="Estoque"
                  value={draft.stockQuantity}
                  onChange={(e) => setDraft({ ...draft, stockQuantity: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-surface-200 text-sm"
                />
              </div>
              <textarea
                placeholder="Descrição (opcional)"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm resize-none"
              />
            </div>
            {err && (
              <div className="mt-3 p-3 rounded-xl bg-error-50 border border-error-600/30 text-sm text-error-600">
                {err}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg border border-surface-200 text-sm text-surface-700 hover:bg-surface-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isLoading}
                className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {createMutation.isLoading ? 'Criando...' : 'Criar produto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
