'use client'

/**
 * /medicos/[slug] — Perfil público do médico (PR 7).
 * Sem autenticação. Mostra bio, especialidades, disponibilidade
 * e próximos slots. CTA "Agendar" redireciona pro fluxo de booking.
 */

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Stethoscope,
  Star,
  Award,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Calendar,
} from 'lucide-react'

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatSlot(d: Date) {
  const date = new Date(d)
  const today = new Date()
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return { day: 'Hoje', time }
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  ) {
    return { day: 'Amanhã', time }
  }
  return {
    day: date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }),
    time,
  }
}

const DAY_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default function DoctorProfilePage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const slug = params?.slug ?? ''
  const query = trpc.marketplace.getDoctorBySlug.useQuery({ slug }, { enabled: !!slug })

  const doctor = query.data
  const isLoading = query.isLoading
  const isError = query.isError

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50">
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
          <Skeleton height="20px" width="120px" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton width="96px" height="96px" circle />
                <div className="space-y-2 flex-1">
                  <Skeleton height="28px" width="60%" />
                  <Skeleton height="14px" width="40%" />
                </div>
              </div>
              <Skeleton height="200px" />
            </div>
            <Skeleton height="320px" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !doctor) {
    return (
      <div className="min-h-screen bg-surface-50">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <EmptyState
            icon={<Stethoscope className="h-10 w-10" />}
            title="Médico não encontrado"
            description="Esse perfil não está disponível ou foi removido."
            action={
              <Button variant="secondary" onClick={() => router.push('/medicos')}>
                Ver todos os médicos
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const handleBook = (iso?: string) => {
    const path = `/consultations/book?doctor=${doctor.id}${iso ? `&slot=${encodeURIComponent(iso)}` : ''}`
    router.push(path)
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Link
          href="/medicos"
          className="inline-flex items-center gap-1 text-small text-surface-600 hover:text-surface-900 transition mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para todos os médicos
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Coluna principal */}
          <div className="space-y-6">
            {/* Header do médico */}
            <Card padding="lg">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <Avatar
                  src={doctor.photoUrl ?? doctor.avatarUrl ?? undefined}
                  name={doctor.fullName}
                  size="xl"
                  alt={`Foto de ${doctor.fullName}`}
                />
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl md:text-h1 font-heading font-bold text-surface-900">
                    {doctor.fullName}
                  </h1>
                  <p className="text-small text-surface-500 mt-1">
                    CRM {doctor.crm}/{doctor.crmState}
                  </p>

                  {doctor.headline && (
                    <p className="mt-3 text-body-lg italic text-surface-700">
                      “{doctor.headline}”
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {doctor.specialty.map((s) => (
                      <Badge key={s} variant="sage" size="md">
                        {s}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {doctor.averageRating > 0 && (
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 fill-warning-500 text-warning-500" />
                        <div>
                          <p className="text-body font-semibold text-surface-900">
                            {doctor.averageRating.toFixed(1)}
                          </p>
                          <p className="text-caption text-surface-500">Avaliação</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-sage-600" />
                      <div>
                        <p className="text-body font-semibold text-surface-900">
                          {doctor.totalConsultations}
                        </p>
                        <p className="text-caption text-surface-500">Consultas</p>
                      </div>
                    </div>
                    {doctor.yearsOfExperience != null && (
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-sage-600" />
                        <div>
                          <p className="text-body font-semibold text-surface-900">
                            {doctor.yearsOfExperience} ano{doctor.yearsOfExperience === 1 ? '' : 's'}
                          </p>
                          <p className="text-caption text-surface-500">Experiência</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Bio */}
            {doctor.bio && (
              <Card padding="lg">
                <h2 className="text-h3 font-heading font-semibold text-surface-900 mb-3">
                  Sobre o(a) Dr(a). {doctor.fullName.split(' ').slice(-1)[0]}
                </h2>
                <p className="text-body text-surface-700 whitespace-pre-line leading-relaxed">
                  {doctor.bio}
                </p>
              </Card>
            )}

            {/* Disponibilidade semanal */}
            {doctor.availability.length > 0 && (
              <Card padding="lg">
                <h2 className="text-h3 font-heading font-semibold text-surface-900 mb-4">
                  Horários de atendimento
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {doctor.availability.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-md bg-surface-50 border border-surface-100"
                    >
                      <Clock className="h-4 w-4 text-sage-600" />
                      <div className="flex-1">
                        <p className="text-small font-medium text-surface-900">
                          {DAY_OF_WEEK[a.dayOfWeek]}
                        </p>
                        <p className="text-caption text-surface-500">
                          {a.startTime} — {a.endTime} · slots de {a.slotDurationMinutes}min
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar: card de agendamento (sticky em desktop) */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <Card padding="lg" variant="elevated">
              <p className="text-caption text-surface-500 uppercase tracking-wider font-semibold">
                Consulta por vídeo
              </p>
              <p className="text-display font-heading font-bold text-brand-700 mt-1">
                {fmtBRL(doctor.consultationPriceCents)}
              </p>
              <p className="text-small text-surface-500 mt-1">Pagamento via PayPal</p>

              {doctor.isAcceptingPatients ? (
                <div className="mt-6">
                  <p className="text-small font-medium text-surface-900 mb-3">
                    Próximos horários
                  </p>
                  {doctor.nextSlots.length === 0 ? (
                    <p className="text-small text-surface-500 italic">
                      Sem horários nos próximos 7 dias. Tente outro médico ou volte em breve.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {doctor.nextSlots.map((s) => {
                        const { day, time } = formatSlot(new Date(s))
                        return (
                          <button
                            key={String(s)}
                            type="button"
                            onClick={() => handleBook(new Date(s).toISOString())}
                            className="text-left p-3 rounded-md border border-surface-200 hover:border-brand-500 hover:bg-brand-50 transition"
                          >
                            <p className="text-caption text-surface-500 capitalize">{day}</p>
                            <p className="text-small font-semibold text-surface-900">{time}</p>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full mt-5"
                    onClick={() => handleBook()}
                  >
                    <Calendar className="h-4 w-4" />
                    Agendar consulta
                  </Button>
                </div>
              ) : (
                <div className="mt-6 p-4 rounded-md bg-warning-50 border border-warning-100">
                  <p className="text-small text-warning-700 font-medium">
                    Médico não está aceitando pacientes
                  </p>
                  <p className="text-caption text-warning-700 mt-1">
                    Volte em breve ou veja outros médicos disponíveis.
                  </p>
                </div>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
