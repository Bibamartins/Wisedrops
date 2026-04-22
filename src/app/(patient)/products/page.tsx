'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PRODUCTS as CATALOG_PRODUCTS, type Product as CatalogProduct } from '@/lib/products-catalog'

// --- Types ---
type Product = CatalogProduct

interface CartItem {
  product: Product
  quantity: number
}

// Use shared Healify catalog
const MOCK_PRODUCTS = CATALOG_PRODUCTS

const CATEGORIES = [
  { key: 'all', label: 'Todos' },
  { key: 'oleo', label: 'Tinturas' },
  { key: 'goma', label: 'Gomas' },
  { key: 'capsula', label: 'Comprimidos' },
  { key: 'topico', label: 'Topicos' },
] as const

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [origin, setOrigin] = useState<string>('all')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const hasActivePrescription = true // Mock: would come from auth/context

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.manufacturer.toLowerCase().includes(search.toLowerCase())) return false
      if (category !== 'all' && p.category !== category) return false
      if (origin !== 'all' && p.origin !== origin) return false
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false
      return true
    })
  }, [search, category, origin, priceRange])

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    )
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  if (!hasActivePrescription) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-surface-900">Produtos</h1>
        </div>
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">🔒</span>
          <h2 className="text-xl font-heading font-bold text-surface-900 mb-2">
            Prescricao Necessaria
          </h2>
          <p className="text-surface-500 mb-6 max-w-md mx-auto">
            Para acessar o catalogo de produtos, voce precisa de uma prescricao medica ativa.
            Agende uma consulta com um de nossos medicos prescritores.
          </p>
          <Link
            href="/consultations/book"
            className="inline-block px-6 py-3 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition"
          >
            Agendar Consulta
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-surface-900">Produtos</h1>
          <p className="text-surface-500">Cannabis medicinal com aprovacao ANVISA</p>
        </div>
        <button
          onClick={() => setShowCart(!showCart)}
          className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 text-brand-700 font-medium hover:bg-brand-100 transition"
        >
          <span className="text-xl">🛒</span>
          <span>Carrinho</span>
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent-500 text-white text-xs font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Cart Drawer */}
      {showCart && (
        <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-surface-900">Carrinho de Compras</h2>
            <button onClick={() => setShowCart(false)} className="text-surface-400 hover:text-surface-600">
              ✕
            </button>
          </div>
          {cart.length === 0 ? (
            <p className="text-surface-400 text-center py-8">Seu carrinho esta vazio</p>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 border border-surface-100">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-surface-900">{item.product.name}</p>
                      <p className="text-xs text-surface-500">{formatBRL(item.product.price)} un.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg border border-surface-200 flex items-center justify-center text-surface-600 hover:bg-surface-50"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg border border-surface-200 flex items-center justify-center text-surface-600 hover:bg-surface-50"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="ml-2 text-red-400 hover:text-red-600 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-surface-200">
                <p className="font-heading font-bold text-surface-900">Total: {formatBRL(cartTotal)}</p>
                <button className="px-6 py-3 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition">
                  Finalizar Pedido
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400">🔍</span>
        <input
          type="text"
          placeholder="Buscar por nome ou fabricante..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-surface-200 bg-white text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filter Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden w-full flex items-center justify-between p-3 rounded-xl border border-surface-200 bg-white text-surface-700 font-medium mb-3"
          >
            <span>Filtros</span>
            <span>{showFilters ? '▲' : '▼'}</span>
          </button>

          <div className={`space-y-6 ${showFilters ? 'block' : 'hidden'} lg:block`}>
            {/* Category */}
            <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
              <h3 className="font-heading font-semibold text-surface-900 mb-3">Categoria</h3>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      category === cat.key
                        ? 'bg-brand-50 text-brand-700 font-medium'
                        : 'text-surface-600 hover:bg-surface-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Origin */}
            <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
              <h3 className="font-heading font-semibold text-surface-900 mb-3">Origem</h3>
              <div className="space-y-2">
                {[
                  { key: 'all', label: 'Todos' },
                  { key: 'nacional', label: 'Nacional' },
                  { key: 'importado', label: 'Importado' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setOrigin(opt.key)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      origin === opt.key
                        ? 'bg-brand-50 text-brand-700 font-medium'
                        : 'text-surface-600 hover:bg-surface-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
              <h3 className="font-heading font-semibold text-surface-900 mb-3">Faixa de Preco</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-surface-500">Min</span>
                  <input
                    type="range"
                    min={0}
                    max={1000}
                    step={50}
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="flex-1 accent-brand-600"
                  />
                  <span className="text-xs text-surface-700 w-16 text-right">{formatBRL(priceRange[0])}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-surface-500">Max</span>
                  <input
                    type="range"
                    min={0}
                    max={1000}
                    step={50}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="flex-1 accent-brand-600"
                  />
                  <span className="text-xs text-surface-700 w-16 text-right">{formatBRL(priceRange[1])}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-surface-500">{filteredProducts.length} produtos encontrados</p>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm hover:shadow-md transition"
              >
                {/* Product Image Placeholder */}
                <div className="w-full h-40 rounded-xl bg-surface-100 flex items-center justify-center mb-4">
                  <span className="text-5xl">
                    {product.category === 'oleo' && '🧴'}
                    {product.category === 'capsula' && '💊'}
                    {product.category === 'spray' && '🌬️'}
                    {product.category === 'goma' && '🍬'}
                    {product.category === 'topico' && '🧴'}
                  </span>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      product.regulation === 'RDC 327'
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {product.regulation}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      product.origin === 'nacional'
                        ? 'bg-surface-100 text-surface-600'
                        : 'bg-purple-50 text-purple-600'
                    }`}
                  >
                    {product.origin === 'nacional' ? 'Nacional' : 'Importado'}
                  </span>
                </div>

                {/* Info */}
                <h3 className="font-medium text-surface-900 text-sm mb-1">{product.name}</h3>
                <p className="text-xs text-surface-500 mb-2">{product.manufacturer} — {product.volume}</p>
                <p className="text-xs text-surface-400 mb-3">{product.concentration}</p>

                {/* CBD/THC Content */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 rounded-lg bg-brand-50 text-brand-700 text-xs font-medium">
                    CBD {product.cbdContent}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium">
                    THC {product.thcContent}
                  </span>
                </div>

                {/* Price + Action */}
                <div className="flex items-center justify-between pt-3 border-t border-surface-100">
                  <p className="text-lg font-heading font-bold text-surface-900">
                    {formatBRL(product.price)}
                  </p>
                  {product.inStock ? (
                    <button
                      onClick={() => addToCart(product)}
                      className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition"
                    >
                      Adicionar
                    </button>
                  ) : (
                    <span className="px-4 py-2 rounded-lg bg-surface-100 text-surface-400 text-sm font-medium">
                      Esgotado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <span className="text-5xl block mb-4">🔍</span>
              <p className="text-surface-500">Nenhum produto encontrado com os filtros selecionados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
