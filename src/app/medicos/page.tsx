'use client'

/**
 * /medicos — Marketplace público de médicos (PR 7).
 * Sem autenticação. Lista médicos APPROVED + isPublic com filtros
 * de especialidade, faixa de preço, e ordenação.
 */

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { trpc } from '@/lib/trpc'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Search, Stethoscope, Star, Calendar, Clock } from 'lucide-react'

type SortKey = 'rating' | 'price-low' | 'price-high' | 'experience'

const SORT_LABELS: Record<SortKey, string> = {
  rating: 'Mais bem avaliados',
  'price-low': 'Menor preço',
  'price-high': 'Maior preço',
  experience: 'Mais experientes',
}

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtNextSlot(d: Date | null): string {
  if (!d) return 'Sem horários nos próximos 7 dias'
  const date = new Date(d)
  const today = new Date()
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `Hoje às ${time}`
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  ) {
    return `Amanhã às ${time}`
  }
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' }) +
    ' às ' + time
}

export default function MarketplacePage() {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | undefined>(undefined)
  const [sort, setSort] = useState<SortKey>('rating')

  const specialtiesQuery = trpc.marketplace.listSpecialties.useQuery()
  const doctorsQuery = trpc.marketplace.listDoctors.useQuery({
    specialty: selectedSpecialty,
    sort,
    page: 1,
    limit: 24,
  })

  const specialties = specialtiesQuery.data ?? []
  const doctors = doctorsQuery.data?.doctors ?? []
  const total = doctorsQuery.data?.total ?? 0

  const isLoading = doctorsQuery.isLoading
  const isError = doctorsQuery.isError

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Hero */}
      <header className="bg-white border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div className="max-w-2xl">
            <p className="text-overline text-brand-700 mb-3 uppercase tracking-widest font-semibold">
              Encontre seu médico
            </p>
            <h1 className="text-4xl md:text-display font-heading font-bold text-surface-900 leading-tight">
              Cannabis medicinal com médicos prescritores de confiança.
            </h1>
            <p className="mt-4 text-body-lg text-surface-600 max-w-xl">
              Médicos verificados, com experiência em cannabis medicinal. Escolha pelo seu perfil,
              agende a consulta e comece o tratamento.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-small text-surface-500">
              <span className="inline-flex items-center gap-2">
                <Stethoscope className="h-4 w-4" /> {total} médico{total === 1 ? '' : 's'} disponíve{total === 1 ? 'l' : 'is'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {/* Filters */}
          <aside className="space-y-6">
            <div>
              <h2 className="text-small font-semibold text-surface-900 mb-3 uppercase tracking-wider">
                Especialidade
              </h2>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSelectedSpecialty(undefined)}
                  className={`w-full text-left px-3 py-2 rounded-md text-small transition ${
                    !selectedSpecialty
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-surface-700 hover:bg-surface-100'
                  }`}
                >
                  Todas
                </button>
                {specialties.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSpecialty(s)}
                    className={`w-full text-left px-3 py-2 rounded-md text-small transition ${
                      selectedSpecialty === s
                        ? 'bg-brand-50 text-brand-700 font-medium'
                        : 'text-surface-700 hover:bg-surface-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-small font-semibold text-surface-900 mb-3 uppercase tracking-wider">
                Ordenar por
              </h2>
              <div className="space-y-1">
                {(Object.entries(SORT_LABELS) as Array<[SortKey, string]>).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSort(key)}
                    className={`w-full text-left px-3 py-2 rounded-md text-small transition ${
                      sort === key
                        ? 'bg-sage-50 text-sage-700 font-medium'
                        : 'text-surface-700 hover:bg-surface-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Listing */}
          <main>
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} padding="lg">
                    <div className="flex items-start gap-4">
                      <Skeleton width="72px" height="72px" circle />
                      <div className="flex-1 space-y-2">
                        <Skeleton height="20px" width="60%" />
                        <Skeleton height="14px" width="40%" />
                        <Skeleton height="14px" width="80%" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Skeleton height="14px" />
                      <Skeleton height="14px" width="70%" />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {isError && (
              <EmptyState
                icon={<Search className="h-10 w-10" />}
                title="Erro ao carregar médicos"
                description="Tentaremos de novo automaticamente. Se persistir, recarregue a página."
              />
            )}

            {!isLoading && !isError && doctors.length === 0 && (
              <EmptyState
                icon={<Stethoscope className="h-10 w-10" />}
                title="Nenhum médico encontrado"
                description={
                  selectedSpecialty
                    ? `Não há médicos públicos para "${selectedSpecialty}" no momento.`
                    : 'Estamos verificando novos médicos. Volte em breve.'
                }
                action={
                  selectedSpecialty ? (
                    <Button variant="secondary" onClick={() => setSelectedSpecialty(undefined)}>
                      Ver todos
                    </Button>
                  ) : undefined
                }
              />
            )}

            {!isLoading && !isError && doctors.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {doctors.map((d) => (
                  <Card
                    key={d.id}
                    variant="interactive"
                    padding="lg"
                    className="flex flex-col h-full"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar
                        src={d.photoUrl ?? undefined}
                        name={d.fullName}
                        size="lg"
                        alt={`Foto de ${d.fullName}`}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-h4 font-heading font-semibold text-surface-900 truncate">
                          {d.fullName}
                        </h3>
                        <p className="text-caption text-surface-500">
                          CRM {d.crm}/{d.crmState}
                        </p>
                        {d.averageRating > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-caption text-surface-600">
                            <Star className="h-3.5 w-3.5 fill-warning-500 text-warning-500" />
                            <span className="font-medium">{d.averageRating.toFixed(1)}</span>
                            <span>· {d.totalConsultations} consulta{d.totalConsultations === 1 ? '' : 's'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {d.headline && (
                      <p className="mt-4 text-body text-surface-700 italic leading-snug line-clamp-2">
                        “{d.headline}”
                      </p>
                    )}

                    {d.specialty.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {d.specialty.slice(0, 3).map((s) => (
                          <Badge key={s} variant="sage" size="sm">
                            {s}
                          </Badge>
                        ))}
                        {d.specialty.length > 3 && (
                          <Badge variant="neutral" size="sm">+{d.specialty.length - 3}</Badge>
                        )}
                      </div>
                    )}

                    <div className="mt-5 pt-5 border-t border-surface-100 flex-1 flex flex-col justify-end">
                      <div className="flex items-center gap-2 text-caption text-surface-500 mb-3">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{fmtNextSlot(d.nextSlot)}</span>
                      </div>
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-caption text-surface-500">Consulta a partir de</p>
                          <p className="text-h3 font-heading font-bold text-brand-700">
                            {fmtBRL(d.consultationPriceCents)}
                          </p>
                        </div>
                        <Link href={d.slug ? `/medicos/${d.slug}` : '#'}>
                          <Button variant="primary" size="sm">
                            Ver perfil
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
