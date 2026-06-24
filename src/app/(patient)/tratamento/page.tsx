'use client'

import Link from 'next/link'
import { Calendar, FileText, BookOpen, History, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { trpc } from '@/lib/trpc'
import { Skeleton } from '@/components/ui/skeleton'

// ---------------------------------------------------------------------------
// Tipos locais
// ---------------------------------------------------------------------------

interface HubCard {
  href: string
  icon: LucideIcon
  iconColorClass: string
  iconBgClass: string
  eyebrow: string
  title: string
  description: string
  cta: string
}

const HUB_CARDS: HubCard[] = [
  {
    href: '/tratamento/consultas',
    icon: Calendar,
    iconColorClass: 'text-sage-600',
    iconBgClass: 'bg-sage-50',
    eyebrow: 'Agendamento',
    title: 'Consultas',
    description: 'Suas consultas — passadas, futuras e a próxima com seu médico.',
    cta: 'Ver consultas',
  },
  {
    href: '/tratamento/receitas',
    icon: FileText,
    iconColorClass: 'text-brand-700',
    iconBgClass: 'bg-brand-50',
    eyebrow: 'Prescrições',
    title: 'Receitas',
    description: 'Receitas digitais ativas e histórico de prescrições emitidas.',
    cta: 'Ver receitas',
  },
  {
    href: '/tratamento/diario',
    icon: BookOpen,
    iconColorClass: 'text-info-700',
    iconBgClass: 'bg-info-50',
    eyebrow: 'Acompanhamento',
    title: 'Diário de sintomas',
    description: 'Registre evolução dos sintomas, doses e bem-estar diário.',
    cta: 'Abrir diário',
  },
  {
    href: '/tratamento/historico',
    icon: History,
    iconColorClass: 'text-surface-600',
    iconBgClass: 'bg-surface-100',
    eyebrow: 'Histórico',
    title: 'Histórico clínico',
    description: 'Prontuário, condições, alergias, medicações em uso e evolução.',
    cta: 'Ver histórico',
  },
]

// ---------------------------------------------------------------------------
// Banner de próxima consulta
// ---------------------------------------------------------------------------

function NextConsultationBanner() {
  const { data, isLoading, isError } = trpc.consultation.listForPatient.useQuery(
    { page: 1, limit: 5 },
    { staleTime: 60_000 }
  )

  if (isLoading) {
    return (
      <div className="bg-white border border-surface-200 rounded-xl shadow-xs p-5 flex items-center gap-4">
        <Skeleton circle width={44} height={44} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    )
  }

  if (isError || !data) return null

  const upcoming = data.consultations
    .filter((c) =>
      c.status === 'SCHEDULED' || c.status === 'WAITING_ROOM' || c.status === 'IN_PROGRESS'
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )

  const next = upcoming[0]
  if (!next) return null

  const scheduledDate = new Date(next.scheduledAt)
  const dateLabel = scheduledDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
  const timeLabel = scheduledDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="bg-sage-50 border border-sage-200 rounded-xl p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-full bg-sage-100 flex items-center justify-center shrink-0">
        <Calendar size={20} strokeWidth={1.5} className="text-sage-600" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-overline text-sage-600 mb-0.5">Próxima consulta</p>
        <p className="font-heading font-semibold text-surface-900 text-base capitalize">
          {dateLabel} às {timeLabel}
        </p>
        <p className="text-sm text-surface-600 mt-0.5">
          Dr(a). {next.doctor.user.fullName}
          {next.doctor.specialty?.length ? ` · ${next.doctor.specialty[0]}` : ''}
        </p>
      </div>
      <Link
        href="/tratamento/consultas"
        className="shrink-0 text-sm font-medium text-sage-700 hover:text-sage-800 transition-colors duration-150"
      >
        Ver detalhes →
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Card do hub (editoral, interativo)
// ---------------------------------------------------------------------------

function HubCard({ card }: { card: HubCard }) {
  const Icon = card.icon
  return (
    <Link href={card.href} className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-lg">
      <Card variant="interactive" padding="lg" className="h-full">
        {/* Eyebrow + ícone */}
        <div className="flex items-start justify-between mb-4">
          <p className="text-overline text-surface-400 uppercase tracking-widest text-[11px] font-semibold">
            {card.eyebrow}
          </p>
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.iconBgClass}`}
            aria-hidden="true"
          >
            <Icon size={20} strokeWidth={1.5} className={card.iconColorClass} />
          </div>
        </div>

        {/* Título + descrição */}
        <h2 className="font-heading font-semibold text-surface-900 text-base group-hover:text-brand-700 transition-colors duration-150 mb-1.5">
          {card.title}
        </h2>
        <p className="text-sm text-surface-500 leading-relaxed mb-5">
          {card.description}
        </p>

        {/* CTA inline */}
        <p className="text-sm font-medium text-brand-700 group-hover:text-brand-800 transition-colors duration-150 flex items-center gap-1">
          {card.cta}
          <span aria-hidden="true" className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
        </p>
      </Card>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default function TratamentoHubPage() {
  return (
    <div>
      <PageHeader
        title="Seu tratamento"
        subtitle="Tudo da sua jornada terapêutica em um só lugar."
        className="-mx-4 -mt-4 lg:-mx-8 lg:-mt-8"
      />

      <div className="pt-6 space-y-6">
        {/* Banner próxima consulta */}
        <NextConsultationBanner />

        {/* Grid 2col mobile-first, 2col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HUB_CARDS.map((card) => (
            <HubCard key={card.href} card={card} />
          ))}
        </div>
      </div>
    </div>
  )
}
