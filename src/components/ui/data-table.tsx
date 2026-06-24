'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------
// DataTable — repintado com tokens v2
// API pública mantida (Column, DataTableProps — retrocompatível)
// -----------------------------------------------------------------------

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  className?: string
  render?: (item: T, index: number) => React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  searchKeys?: string[]
  pageSize?: number
  onRowClick?: (item: T) => void
  emptyMessage?: string
  emptyIcon?: React.ReactNode
  className?: string
  actions?: React.ReactNode
  /** Loading state — mostra skeleton rows */
  isLoading?: boolean
}

type SortDir = 'asc' | 'desc' | null

// Skeleton row para estado de loading
function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-surface-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-4 bg-surface-100 rounded animate-pulse" style={{ width: `${60 + (i % 3) * 15}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchable = false,
  searchPlaceholder = 'Buscar...',
  searchKeys = [],
  pageSize = 10,
  onRowClick,
  emptyMessage = 'Nenhum registro encontrado.',
  className,
  actions,
  isLoading = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [page, setPage] = useState(0)

  const filteredData = useMemo(() => {
    let result = [...data]

    if (search && searchKeys.length > 0) {
      const query = search.toLowerCase()
      result = result.filter((item) =>
        searchKeys.some((key) => {
          const value = item[key]
          return typeof value === 'string' && value.toLowerCase().includes(query)
        })
      )
    }

    if (sortKey && sortDir) {
      result.sort((a, b) => {
        const aVal = a[sortKey]
        const bVal = b[sortKey]
        if (aVal == null || bVal == null) return 0
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal
        }
        return 0
      })
    }

    return result
  }, [data, search, searchKeys, sortKey, sortDir])

  const totalPages = Math.ceil(filteredData.length / pageSize)
  const paginatedData = filteredData.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc')
      else {
        setSortKey(null)
        setSortDir(null)
      }
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(0)
  }

  function SortIcon({ colKey }: { colKey: string }) {
    if (sortKey !== colKey)
      return <ChevronsUpDown size={12} strokeWidth={1.5} className="text-surface-300" />
    if (sortDir === 'asc')
      return <ChevronUp size={12} strokeWidth={2} className="text-brand-600" />
    return <ChevronDown size={12} strokeWidth={2} className="text-brand-600" />
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      {(searchable || actions) && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {searchable && (
            <div className="relative max-w-sm flex-1 min-w-[200px]">
              <Search
                size={16}
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
                placeholder={searchPlaceholder}
                className={cn(
                  'h-10 w-full rounded border border-surface-300 bg-white',
                  'pl-9 pr-3 text-sm text-surface-800 placeholder:text-surface-400',
                  'transition-colors duration-150',
                  'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15',
                  'hover:border-surface-400'
                )}
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-surface-200">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="bg-surface-50 border-b border-surface-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    // overline style — uppercase, tracking wide, font-semibold 11px
                    'py-3 px-4 text-left text-[11px] font-semibold text-surface-600 uppercase tracking-widest',
                    col.sortable && 'cursor-pointer select-none hover:text-surface-800',
                    col.className
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading state — 5 skeleton rows
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            ) : paginatedData.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-surface-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => (
                <tr
                  key={idx}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  className={cn(
                    'border-b border-surface-100 transition-colors duration-150',
                    onRowClick &&
                      'cursor-pointer hover:bg-surface-50 focus-within:bg-surface-50'
                  )}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onRowClick(item)
                          }
                        }
                      : undefined
                  }
                  role={onRowClick ? 'button' : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('py-3 px-4 text-surface-700', col.className)}>
                      {col.render
                        ? col.render(item, page * pageSize + idx)
                        : (item[col.key] as React.ReactNode) ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm flex-wrap gap-3">
          <p className="text-surface-500 text-xs">
            Mostrando {page * pageSize + 1}–
            {Math.min((page + 1) * pageSize, filteredData.length)} de{' '}
            {filteredData.length} registros
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Página anterior"
              className={cn(
                'h-8 w-8 flex items-center justify-center rounded border border-surface-300',
                'text-surface-600 hover:bg-surface-50 transition-colors duration-150',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              <ChevronLeft size={14} strokeWidth={2} />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum =
                totalPages <= 5
                  ? i
                  : Math.max(0, Math.min(page - 2, totalPages - 5)) + i
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  aria-label={`Página ${pageNum + 1}`}
                  aria-current={pageNum === page ? 'page' : undefined}
                  className={cn(
                    'h-8 w-8 rounded text-sm font-medium transition-colors duration-150',
                    pageNum === page
                      ? 'bg-brand-600 text-white'
                      : 'text-surface-600 hover:bg-surface-100'
                  )}
                >
                  {pageNum + 1}
                </button>
              )
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              aria-label="Próxima página"
              className={cn(
                'h-8 w-8 flex items-center justify-center rounded border border-surface-300',
                'text-surface-600 hover:bg-surface-50 transition-colors duration-150',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
