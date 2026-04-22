'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PRODUCTS, CATEGORIES, PRODUCT_LINES, formatBRL, type Product } from '@/lib/products-catalog'

export default function DoctorProductsCatalog() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [productLine, setProductLine] = useState<string>('all')
  const [rxType, setRxType] = useState<string>('all')
  const [selected, setSelected] = useState<Product | null>(null)

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.manufacturer.toLowerCase().includes(search.toLowerCase())) return false
      if (category !== 'all' && p.category !== category) return false
      if (productLine !== 'all' && p.productLine !== productLine) return false
      if (rxType !== 'all' && p.prescriptionType !== rxType) return false
      return true
    })
  }, [search, category, productLine, rxType])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold text-surface-900">Catalogo Healify</h1>
          <p className="text-surface-500">Referencia medica para prescricao — {PRODUCTS.length} produtos Healify disponiveis</p>
        </div>
        <Link
          href="/prescriptions/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition"
        >
          <span>📋</span> Nova Receita
        </Link>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <span className="text-xl">💊</span>
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">Referencia para prescricao</p>
            <p className="text-sm text-blue-700">
              Este catalogo mostra todos os produtos disponiveis com informacoes medicas: indicacoes,
              posologia tipica, contraindicacoes e tipo de receita necessaria (A, B1 ou C1).
            </p>
          </div>
        </div>
      </div>

      {/* Product Lines Quick Access */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {PRODUCT_LINES.filter(l => l.key !== 'all').map((line) => {
          const count = PRODUCTS.filter(p => p.productLine === line.key).length
          return (
            <button
              key={line.key}
              onClick={() => setProductLine(productLine === line.key ? 'all' : line.key)}
              className={`p-3 rounded-xl border text-left transition ${
                productLine === line.key
                  ? 'bg-brand-50 border-brand-400 ring-2 ring-brand-200'
                  : 'bg-white border-surface-200 hover:border-brand-300'
              }`}
            >
              <p className="text-sm font-semibold text-surface-900">{line.label}</p>
              <p className="text-[10px] text-surface-500 mb-1">{line.desc}</p>
              <p className="text-xs font-medium text-brand-600">{count} produto(s)</p>
            </button>
          )
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-surface-200">
          <p className="text-xs text-surface-500">Total Healify</p>
          <p className="text-2xl font-heading font-bold text-surface-900">{PRODUCTS.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200">
          <p className="text-xs text-surface-500">Importados (RDC 660)</p>
          <p className="text-2xl font-heading font-bold text-accent-600">
            {PRODUCTS.filter(p => p.origin === 'importado').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200">
          <p className="text-xs text-surface-500">Com THC (Receita A)</p>
          <p className="text-2xl font-heading font-bold text-orange-600">
            {PRODUCTS.filter(p => p.prescriptionType === 'A').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200">
          <p className="text-xs text-surface-500">Zero THC (B1/C1)</p>
          <p className="text-2xl font-heading font-bold text-brand-600">
            {PRODUCTS.filter(p => p.prescriptionType !== 'A').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white border border-surface-200 space-y-3">
        <input
          type="text"
          placeholder="🔍 Buscar por nome ou fabricante..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-surface-500 mb-1 block">Categoria</label>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    category === c.key
                      ? 'bg-brand-50 border-brand-300 text-brand-700'
                      : 'bg-white border-surface-200 text-surface-600 hover:border-surface-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-surface-500 mb-1 block">Linha de Produto</label>
            <div className="flex flex-wrap gap-1">
              {PRODUCT_LINES.map((l) => (
                <button
                  key={l.key}
                  onClick={() => setProductLine(l.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    productLine === l.key
                      ? 'bg-brand-50 border-brand-300 text-brand-700'
                      : 'bg-white border-surface-200 text-surface-600 hover:border-surface-300'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-surface-500 mb-1 block">Tipo de Receita</label>
            <div className="flex flex-wrap gap-1">
              {[
                { k: 'all', l: 'Todas' },
                { k: 'A', l: 'A (THC)' },
                { k: 'B1', l: 'B1' },
                { k: 'C1', l: 'C1' },
              ].map((r) => (
                <button
                  key={r.k}
                  onClick={() => setRxType(r.k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    rxType === r.k
                      ? 'bg-brand-50 border-brand-300 text-brand-700'
                      : 'bg-white border-surface-200 text-surface-600 hover:border-surface-300'
                  }`}
                >
                  {r.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <p className="text-sm text-surface-500">{filtered.length} produto(s) encontrado(s)</p>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((product) => (
          <div
            key={product.id}
            className="p-5 rounded-2xl bg-white border border-surface-200 hover:shadow-md hover:border-brand-300 transition cursor-pointer"
            onClick={() => setSelected(product)}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1">
                {product.productLine && (
                  <p className="text-[10px] font-bold uppercase text-brand-600 tracking-wide mb-0.5">
                    {product.productLine}
                  </p>
                )}
                <h3 className="font-heading font-semibold text-surface-900 text-sm leading-tight">{product.name}</h3>
                <p className="text-xs text-surface-500 mt-0.5">{product.manufacturer} {product.spectrum ? `• ${product.spectrum}` : ''}</p>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex-shrink-0 ${
                  product.prescriptionType === 'A'
                    ? 'bg-yellow-100 text-yellow-800'
                    : product.prescriptionType === 'B1'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                Receita {product.prescriptionType}
              </span>
            </div>

            <div className="space-y-1.5 text-xs mb-3">
              <div className="flex items-center gap-1">
                <span className="text-surface-400">Composicao:</span>
                <span className="text-surface-700 font-medium">{product.concentration}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-surface-400">Volume:</span>
                <span className="text-surface-700 font-medium">{product.volume}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mb-3">
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                  product.origin === 'nacional'
                    ? 'bg-brand-50 text-brand-700'
                    : 'bg-accent-50 text-accent-700'
                }`}
              >
                {product.origin === 'nacional' ? '🇧🇷 Nacional' : '🌍 Importado'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-surface-100 text-surface-600">
                {product.regulation}
              </span>
            </div>

            {product.indications && (
              <div className="pt-3 border-t border-surface-100">
                <p className="text-[10px] font-semibold text-surface-500 uppercase mb-1">Indicacoes principais</p>
                <div className="flex flex-wrap gap-1">
                  {product.indications.slice(0, 2).map((ind) => (
                    <span key={ind} className="px-2 py-0.5 rounded-md bg-surface-50 text-[10px] text-surface-700">
                      {ind}
                    </span>
                  ))}
                  {product.indications.length > 2 && (
                    <span className="text-[10px] text-surface-400">+{product.indications.length - 2}</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-100">
              <span className="text-sm font-heading font-bold text-surface-900">{formatBRL(product.price)}</span>
              <button className="text-xs text-brand-600 font-medium hover:underline">
                Ver detalhes →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Product Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-6 border-b border-surface-200 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      selected.prescriptionType === 'A'
                        ? 'bg-yellow-100 text-yellow-800'
                        : selected.prescriptionType === 'B1'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    Receita {selected.prescriptionType}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                    selected.origin === 'nacional' ? 'bg-brand-50 text-brand-700' : 'bg-accent-50 text-accent-700'
                  }`}>
                    {selected.origin === 'nacional' ? '🇧🇷 Nacional' : '🌍 Importado'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-surface-100 text-surface-600">
                    {selected.regulation}
                  </span>
                </div>
                <h2 className="text-xl font-heading font-bold text-surface-900">{selected.name}</h2>
                <p className="text-sm text-surface-500">{selected.manufacturer} • {selected.volume}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 text-surface-400 hover:text-surface-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Composition */}
              <div>
                <h3 className="text-xs font-bold uppercase text-surface-500 mb-2">Composicao</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-brand-50">
                    <p className="text-xs text-brand-700">CBD</p>
                    <p className="text-lg font-heading font-bold text-brand-900">{selected.cbdContent}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-50">
                    <p className="text-xs text-orange-700">THC</p>
                    <p className="text-lg font-heading font-bold text-orange-900">{selected.thcContent}</p>
                  </div>
                </div>
                <p className="text-xs text-surface-500 mt-2">{selected.concentration}</p>
              </div>

              {/* Indications */}
              {selected.indications && (
                <div>
                  <h3 className="text-xs font-bold uppercase text-surface-500 mb-2">✅ Indicacoes</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.indications.map((ind) => (
                      <span key={ind} className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-sm">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dosage */}
              {selected.typicalDosage && (
                <div>
                  <h3 className="text-xs font-bold uppercase text-surface-500 mb-2">💊 Posologia Tipica</h3>
                  <p className="text-sm text-surface-700 bg-surface-50 p-3 rounded-xl">{selected.typicalDosage}</p>
                </div>
              )}

              {/* Contraindications */}
              {selected.contraindications && (
                <div>
                  <h3 className="text-xs font-bold uppercase text-surface-500 mb-2">⚠️ Contraindicacoes</h3>
                  <ul className="space-y-1">
                    {selected.contraindications.map((c) => (
                      <li key={c} className="text-sm text-surface-700 flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Price */}
              <div className="p-4 rounded-xl bg-surface-50 flex items-center justify-between">
                <div>
                  <p className="text-xs text-surface-500">Preco ao paciente</p>
                  <p className="text-2xl font-heading font-bold text-surface-900">{formatBRL(selected.price)}</p>
                </div>
                <Link
                  href={`/prescriptions/new?product=${selected.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition"
                >
                  📝 Prescrever
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
