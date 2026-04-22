'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { DataTable, type Column } from '@/components/ui/data-table'
import { PRODUCTS, formatBRL, type Product } from '@/lib/products-catalog'

// ---------- Admin overlay (stock + availability) ----------
// The shared catalog doesn't track stock, so admin maintains its own
// overlay keyed by product id. Persisted in localStorage for the prototype.

interface StockOverlay {
  stock: number
  available: boolean
}

const OVERLAY_KEY = 'wisedrops_admin_stock'

// Seed a few values so the table looks populated on first load
const INITIAL_OVERLAY: Record<string, StockOverlay> = {
  'healify-tinc-sleep': { stock: 45, available: true },
  'healify-tinc-prevent': { stock: 120, available: true },
  'healify-tinc-slim': { stock: 22, available: true },
  'healify-tinc-boost': { stock: 8, available: true },
  'healify-gummy-sleep': { stock: 35, available: true },
  'healify-gummy-boost': { stock: 0, available: false },
  'healify-gummy-focus': { stock: 80, available: true },
  'healify-tab-focus': { stock: 15, available: true },
  'healify-top-boost': { stock: 50, available: true },
}

interface AdminProductRow extends Product {
  stock: number
  available: boolean
  [key: string]: unknown
}

// ---------- Component ----------

export default function AdminProductsPage() {
  const [overlay, setOverlay] = useState<Record<string, StockOverlay>>(INITIAL_OVERLAY)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [editStock, setEditStock] = useState('')

  // Hydrate overlay from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(OVERLAY_KEY)
      if (raw) {
        setOverlay(JSON.parse(raw))
      } else {
        localStorage.setItem(OVERLAY_KEY, JSON.stringify(INITIAL_OVERLAY))
      }
    } catch {
      // ignore
    }
  }, [])

  const persist = (next: Record<string, StockOverlay>) => {
    setOverlay(next)
    try {
      localStorage.setItem(OVERLAY_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  // Merge shared catalog with admin overlay
  const rows: AdminProductRow[] = useMemo(
    () =>
      PRODUCTS.map((p) => {
        const o = overlay[p.id] ?? { stock: 0, available: p.inStock }
        return { ...p, stock: o.stock, available: o.available }
      }),
    [overlay]
  )

  const handleToggleAvailability = (productId: string) => {
    const current = overlay[productId] ?? { stock: 0, available: true }
    persist({ ...overlay, [productId]: { ...current, available: !current.available } })
  }

  const handleSaveEdit = (productId: string) => {
    const current = overlay[productId] ?? { stock: 0, available: true }
    const newStock = parseInt(editStock, 10)
    persist({
      ...overlay,
      [productId]: {
        stock: Number.isNaN(newStock) ? current.stock : newStock,
        available: current.available,
      },
    })
    setEditingId(null)
  }

  // ---------- Columns ----------
  const columns: Column<AdminProductRow>[] = [
    {
      key: 'name',
      header: 'Produto',
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-medium text-surface-900">{p.name}</p>
          <p className="text-xs text-surface-500">
            {p.manufacturer}
            {p.productLine ? ` — ${p.productLine}` : ''} · {p.volume}
          </p>
        </div>
      ),
    },
    {
      key: 'concentration',
      header: 'Concentracao',
      render: (p) => <span className="text-xs text-surface-600">{p.concentration}</span>,
    },
    {
      key: 'regulation',
      header: 'Regulacao',
      render: (p) => {
        const isImported = p.origin === 'importado'
        return (
          <div className="flex flex-col gap-1">
            <Badge variant={isImported ? 'warning' : 'info'}>{p.regulation}</Badge>
            <span className="text-[10px] text-surface-400">
              {isImported ? 'Importado' : 'Nacional'}
            </span>
          </div>
        )
      },
    },
    {
      key: 'prescriptionType',
      header: 'Receita',
      className: 'text-center',
      render: (p) => (
        <Badge variant={p.prescriptionType === 'A' ? 'error' : 'success'}>
          {p.prescriptionType ?? '—'}
        </Badge>
      ),
    },
    {
      key: 'price',
      header: 'Preco',
      sortable: true,
      className: 'text-right',
      render: (p) =>
        editingId === p.id ? (
          <Input
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            className="w-28 text-right"
            placeholder="R$ 0,00"
          />
        ) : (
          <span className="text-sm font-medium text-surface-900">{formatBRL(p.price)}</span>
        ),
    },
    {
      key: 'stock',
      header: 'Estoque',
      sortable: true,
      className: 'text-center',
      render: (p) =>
        editingId === p.id ? (
          <Input
            type="number"
            value={editStock}
            onChange={(e) => setEditStock(e.target.value)}
            className="w-20 text-center"
          />
        ) : (
          <span
            className={`text-sm font-medium ${
              p.stock === 0
                ? 'text-red-600'
                : p.stock < 10
                ? 'text-amber-600'
                : 'text-surface-700'
            }`}
          >
            {p.stock} un.
          </span>
        ),
    },
    {
      key: 'available',
      header: 'Disponivel',
      className: 'text-center',
      render: (p) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleToggleAvailability(p.id)
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            p.available ? 'bg-brand-500' : 'bg-surface-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
              p.available ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Acoes',
      className: 'text-right',
      render: (p) =>
        editingId === p.id ? (
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); handleSaveEdit(p.id) }}>
              Salvar
            </Button>
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingId(null) }}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              setEditingId(p.id)
              setEditPrice(p.price.toFixed(2))
              setEditStock(String(p.stock))
            }}
          >
            Editar
          </Button>
        ),
    },
  ]

  const totalProducts = rows.length
  const availableCount = rows.filter((p) => p.available).length
  const lowStockCount = rows.filter((p) => p.stock > 0 && p.stock < 10).length
  const outOfStockCount = rows.filter((p) => p.stock === 0).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-surface-900">Gestao de Produtos</h1>
          <p className="text-surface-500 text-sm">
            Catalogo oficial Healify — importado via RDC 660
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>Adicionar Produto</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-surface-900">{totalProducts}</p>
          <p className="text-xs text-surface-500">Total de Produtos</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-brand-600">{availableCount}</p>
          <p className="text-xs text-surface-500">Disponiveis</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-amber-600">{lowStockCount}</p>
          <p className="text-xs text-surface-500">Estoque Baixo</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-red-600">{outOfStockCount}</p>
          <p className="text-xs text-surface-500">Sem Estoque</p>
        </Card>
      </div>

      {/* Table */}
      <Card noPadding>
        <div className="p-6">
          <DataTable
            data={rows}
            columns={columns}
            searchable
            searchPlaceholder="Buscar produto..."
            searchKeys={['name', 'manufacturer', 'productLine', 'category']}
            pageSize={10}
            emptyMessage="Nenhum produto encontrado."
          />
        </div>
      </Card>

      {/* Add Product Modal (prototype only) */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Adicionar Novo Produto"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                alert('Em um ambiente real, o produto seria enviado para aprovacao. Este e um prototipo.')
                setShowAddModal(false)
              }}
            >
              Enviar para Aprovacao
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
            Produtos adicionados passam por validacao regulatoria antes de entrarem no catalogo.
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nome do Produto" placeholder="Ex: Sleep Broad Spectrum Tincture" />
            <Input label="Fabricante" placeholder="Ex: Healify" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Concentracao" placeholder="Ex: 1500mg CBD + 500mg CBN" />
            <Input label="Volume" placeholder="Ex: 30mL" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Preco (R$)" type="number" placeholder="249.60" />
            <Input label="Estoque Inicial" type="number" placeholder="50" />
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Tipo de Receita</label>
              <select className="flex h-10 w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                <option value="B1">B1 — Branca Especial</option>
                <option value="A">A — Amarela</option>
                <option value="C1">C1 — Branca Controlada</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
