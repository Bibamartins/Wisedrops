'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Leaf, Package, Search, SlidersHorizontal, X } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/ui/page-header'

// ============================================================
// Constants
// ============================================================

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

const CATEGORIES = Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }))

type RdcOrigin = 'RDC327' | 'RDC660' | ''

// ============================================================
// Skeleton de produto
// ============================================================

function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-surface-200 rounded-xl shadow-xs p-5 flex flex-col space-y-3">
      {/* Imagem placeholder */}
      <Skeleton className="w-full h-36 rounded-lg" />
      {/* Badges */}
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-sm" />
        <Skeleton className="h-5 w-12 rounded-sm" />
      </div>
      {/* Nome */}
      <Skeleton className="h-5 w-3/4" />
      {/* Fabricante */}
      <Skeleton className="h-3 w-1/2" />
      {/* Concentração */}
      <Skeleton className="h-3 w-2/3" />
      {/* Preço + botão */}
      <div className="flex items-center justify-between pt-3 border-t border-surface-100">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
    </div>
  )
}

// ============================================================
// Painel de filtros laterais (desktop) / modal (mobile futuro)
// ============================================================

interface FiltersState {
  categories: string[]
  rdcOrigin: RdcOrigin
  maxPriceCents: number | null
}

const DEFAULT_FILTERS: FiltersState = {
  categories: [],
  rdcOrigin: '',
  maxPriceCents: null,
}

interface FilterPanelProps {
  filters: FiltersState
  onChange: (filters: FiltersState) => void
  onReset: () => void
}

function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.rdcOrigin !== '' ||
    filters.maxPriceCents !== null

  function toggleCategory(cat: string) {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat]
    onChange({ ...filters, categories: next })
  }

  return (
    <aside
      aria-label="Filtros de produtos"
      className="w-full lg:w-56 shrink-0 space-y-6"
    >
      {/* Header de filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal size={14} strokeWidth={1.5} className="text-surface-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-surface-800">Filtros</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs text-brand-700 hover:text-brand-800 font-medium transition-colors duration-150"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Categoria */}
      <div>
        <p className="text-overline text-surface-400 uppercase tracking-widest text-[11px] mb-3">
          Categoria
        </p>
        <div className="space-y-2">
          {CATEGORIES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.categories.includes(value)}
                onChange={() => toggleCategory(value)}
                className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500 focus:ring-offset-0"
              />
              <span className="text-sm text-surface-600 group-hover:text-surface-800 transition-colors duration-150">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Divisor */}
      <div className="border-t border-surface-100" />

      {/* Origem ANVISA */}
      <div>
        <p className="text-overline text-surface-400 uppercase tracking-widest text-[11px] mb-3">
          Origem ANVISA
        </p>
        <div className="space-y-2">
          {([
            { value: '' as RdcOrigin, label: 'Todas' },
            { value: 'RDC327' as RdcOrigin, label: 'RDC 327' },
            { value: 'RDC660' as RdcOrigin, label: 'RDC 660' },
          ] as { value: RdcOrigin; label: string }[]).map(({ value, label }) => (
            <label key={value || 'all'} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="rdc-origin"
                value={value}
                checked={filters.rdcOrigin === value}
                onChange={() => onChange({ ...filters, rdcOrigin: value })}
                className="w-4 h-4 border-surface-300 text-brand-600 focus:ring-brand-500 focus:ring-offset-0"
              />
              <span className="text-sm text-surface-600 group-hover:text-surface-800 transition-colors duration-150">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  )
}

// ============================================================
// Card de produto
// ============================================================

interface Product {
  id: string
  name: string
  manufacturer: string
  category: string
  concentration: string
  form: string
  description?: string | null
  priceCents: number
  rdcClassification: string
  imageUrl?: string | null
}

function ProductCard({ product }: { product: Product }) {
  const priceFormatted = `R$ ${(product.priceCents / 100)
    .toFixed(2)
    .replace('.', ',')}`

  const isRdc660 = product.rdcClassification === 'RDC660'

  return (
    <Card
      variant="interactive"
      padding="none"
      className="flex flex-col overflow-hidden"
    >
      {/* Imagem do produto */}
      <div className="w-full h-36 bg-sage-50 flex items-center justify-center border-b border-surface-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Leaf
            size={40}
            strokeWidth={1}
            className="text-sage-300"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-5 flex flex-col flex-1">
        {/* Badges de classificação */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge
            variant={isRdc660 ? 'brand' : 'sage'}
            size="sm"
          >
            {product.rdcClassification}
          </Badge>
          <Badge variant="neutral" size="sm">
            {CATEGORY_LABEL[product.category] ?? product.category}
          </Badge>
        </div>

        {/* Nome */}
        <h3 className="font-heading font-semibold text-h4 text-surface-900 leading-snug mb-1 text-balance">
          {product.name}
        </h3>

        {/* Fabricante + forma */}
        <p className="text-caption text-surface-500 mb-0.5">
          {product.manufacturer}
        </p>
        <p className="text-caption text-surface-500 mb-2">
          {product.concentration} · {product.form}
        </p>

        {/* Descrição */}
        {product.description && (
          <p className="text-xs text-surface-500 line-clamp-3 flex-1 leading-relaxed mb-3">
            {product.description}
          </p>
        )}

        {/* Preço + CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-100 mt-auto">
          <p className="font-heading text-h3 font-semibold text-brand-700 tracking-tight">
            {priceFormatted}
          </p>
          <Link
            href={`/checkout/${product.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="primary" size="sm">
              Comprar
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}

// ============================================================
// Page
// ============================================================

export default function PatientProductsPage() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS)

  const listQuery = trpc.product.list.useQuery({
    page: 1,
    limit: 100,
    ...(search ? { search } : {}),
  })

  const allProducts: Product[] = useMemo(
    () => listQuery.data?.products ?? [],
    [listQuery.data]
  )

  // Filtragem client-side (categorias e RDC)
  const products = useMemo(() => {
    return allProducts.filter((p) => {
      if (filters.categories.length > 0 && !filters.categories.includes(p.category)) return false
      if (filters.rdcOrigin && p.rdcClassification !== filters.rdcOrigin) return false
      if (filters.maxPriceCents !== null && p.priceCents > filters.maxPriceCents) return false
      return true
    })
  }, [allProducts, filters])

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.rdcOrigin !== '' ||
    filters.maxPriceCents !== null

  return (
    <div className="min-h-screen bg-surface-50">
      {/* PageHeader */}
      <PageHeader
        title="Produtos"
        subtitle="Produtos prescritos e disponíveis para você"
        breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Produtos' }]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Barra de busca */}
        <div className="relative mb-6">
          <Search
            size={16}
            strokeWidth={1.5}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"
            aria-hidden="true"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors duration-150"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          )}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, fabricante ou descrição..."
            aria-label="Buscar produtos"
            className={cn(
              'w-full pl-9 pr-10 py-2.5 rounded border border-surface-300 text-sm',
              'text-surface-800 bg-white placeholder:text-surface-400',
              'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15',
              'transition-colors duration-150'
            )}
          />
        </div>

        {/* Layout filtros + grid */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Filtros laterais */}
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(DEFAULT_FILTERS)}
          />

          {/* Grid de produtos */}
          <div className="flex-1 min-w-0">
            {/* Estado: loading */}
            {listQuery.isLoading && (
              <div
                className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5"
                role="status"
                aria-label="Carregando produtos"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Estado: erro */}
            {listQuery.error && !listQuery.isLoading && (
              <Card variant="default" padding="default" className="border-error-100 bg-error-50">
                <p className="text-sm text-error-700 font-medium mb-3">
                  Erro ao carregar produtos. Tente novamente.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => listQuery.refetch()}
                >
                  Tentar novamente
                </Button>
              </Card>
            )}

            {/* Estado: vazio */}
            {!listQuery.isLoading && !listQuery.error && products.length === 0 && (
              <EmptyState
                icon={
                  <Package
                    size={40}
                    strokeWidth={1}
                    className="text-surface-300"
                    aria-hidden="true"
                  />
                }
                title={
                  hasActiveFilters || search
                    ? 'Nenhum produto encontrado'
                    : 'Catálogo ainda sendo montado'
                }
                description={
                  hasActiveFilters || search
                    ? 'Tente ajustar os filtros ou a busca para encontrar o que procura.'
                    : 'Novos produtos chegam em breve. Volte mais tarde.'
                }
                action={
                  hasActiveFilters || search ? (
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => {
                        setSearch('')
                        setFilters(DEFAULT_FILTERS)
                      }}
                    >
                      Limpar filtros
                    </Button>
                  ) : undefined
                }
              />
            )}

            {/* Estado: dados */}
            {!listQuery.isLoading && !listQuery.error && products.length > 0 && (
              <>
                {/* Contagem de resultados */}
                <p className="text-xs text-surface-500 mb-4">
                  {products.length === 1
                    ? '1 produto encontrado'
                    : `${products.length} produtos encontrados`}
                </p>

                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
