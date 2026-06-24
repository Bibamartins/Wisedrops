'use client'

/**
 * /home — Home do paciente (PR 8).
 *
 * Onboarding linear: paciente novo só vê 1 CTA grande, paciente
 * recorrente vê dashboard rico. O estado vem da query
 * `quiz.getOnboardingState` que deduz do banco a posição na jornada.
 *
 * Estados (de mais novo pra mais avançado):
 *   NEW                  → "Faça seu diagnóstico" (quiz)
 *   QUIZ_DONE            → "Próximo passo: agende sua consulta"
 *   CONSULTATION_BOOKED  → "Sua consulta em X. [Entrar na sala]"
 *   CONSULTATION_DONE    → "Aguardando receita do seu médico (até 24h)"
 *   PRESCRIPTION_READY   → "Sua receita está pronta. [Comprar]"
 *   ORDER_PLACED         → "Pedido em rota. Previsão: [data]"
 *   TREATMENT_ACTIVE     → Dashboard completo
 */

import Link from 'next/link'
import { trpc } from '@/lib/trpc'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  ClipboardList,
  Stethoscope,
  Video,
  FileText,
  ShoppingBag,
  Truck,
  Sparkles,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import LegacyDashboard from '../dashboard/page'

function fmtDate(d: Date | string | null): string {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
}
function fmtTime(d: Date | string | null): string {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
function daysUntil(d: Date | string | null): number | null {
  if (!d) return null
  const ms = new Date(d).getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

// ---------------------------------------------------------------------------
// Componente de "stage card" reutilizado por todos os estados de onboarding
// ---------------------------------------------------------------------------
function StageCard({
  eyebrow,
  title,
  description,
  ctaPrimary,
  ctaSecondary,
  icon: Icon,
  tone = 'brand',
}: {
  eyebrow: string
  title: string
  description: string
  ctaPrimary?: { label: string; href: string }
  ctaSecondary?: { label: string; href: string }
  icon: React.ComponentType<{ className?: string }>
  tone?: 'brand' | 'sage' | 'info' | 'warning' | 'success'
}) {
  const toneClasses = {
    brand: { bg: 'bg-brand-50', icon: 'text-brand-700', eyebrow: 'text-brand-700' },
    sage: { bg: 'bg-sage-50', icon: 'text-sage-700', eyebrow: 'text-sage-700' },
    info: { bg: 'bg-info-50', icon: 'text-info-700', eyebrow: 'text-info-700' },
    warning: { bg: 'bg-warning-50', icon: 'text-warning-700', eyebrow: 'text-warning-700' },
    success: { bg: 'bg-success-50', icon: 'text-success-700', eyebrow: 'text-success-700' },
  }[tone]

  return (
    <Card padding="lg" variant="elevated" className="overflow-hidden">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className={`p-4 rounded-xl ${toneClasses.bg} shrink-0`}>
          <Icon className={`h-10 w-10 ${toneClasses.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-overline uppercase tracking-widest font-semibold ${toneClasses.eyebrow}`}>
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-heading font-bold text-surface-900 leading-tight">
            {title}
          </h1>
          <p className="mt-3 text-body-lg text-surface-600 max-w-xl leading-relaxed">
            {description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {ctaPrimary && (
              <Link href={ctaPrimary.href}>
                <Button variant="primary" size="lg">
                  {ctaPrimary.label}
                </Button>
              </Link>
            )}
            {ctaSecondary && (
              <Link href={ctaSecondary.href}>
                <Button variant="secondary" size="lg">
                  {ctaSecondary.label}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function HomePage() {
  const onboarding = trpc.quiz.getOnboardingState.useQuery()

  // Loading: hero skeleton
  if (onboarding.isLoading) {
    return (
      <div className="space-y-6">
        <Card padding="lg">
          <div className="flex gap-6">
            <Skeleton width="80px" height="80px" />
            <div className="flex-1 space-y-3">
              <Skeleton height="14px" width="120px" />
              <Skeleton height="32px" width="80%" />
              <Skeleton height="16px" width="60%" />
              <Skeleton height="40px" width="180px" />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Erro: degradação para dashboard legado
  if (onboarding.isError || !onboarding.data) {
    return <LegacyDashboard />
  }

  const { state, context } = onboarding.data

  // ---------------- TREATMENT_ACTIVE: dashboard completo --------------------
  if (state === 'TREATMENT_ACTIVE') {
    return <LegacyDashboard />
  }

  // ---------------- NEW --------------------
  if (state === 'NEW') {
    return (
      <div className="space-y-8">
        <StageCard
          icon={ClipboardList}
          tone="brand"
          eyebrow="Comece por aqui"
          title="Vamos entender o que está acontecendo com você."
          description="Em 8 perguntas a gente identifica a melhor jornada de tratamento pra sua condição. Sem cadastro extra, sem cobrança nessa etapa."
          ctaPrimary={{ label: 'Fazer meu diagnóstico', href: '/quiz' }}
          ctaSecondary={{ label: 'Ver médicos primeiro', href: '/medicos' }}
        />
        <p className="text-small text-surface-500 text-center">
          ⏱ Leva cerca de 3 minutos · Suas respostas ficam protegidas pela LGPD
        </p>
      </div>
    )
  }

  // ---------------- QUIZ_DONE --------------------
  if (state === 'QUIZ_DONE') {
    return (
      <div className="space-y-8">
        <StageCard
          icon={Stethoscope}
          tone="sage"
          eyebrow="Próximo passo"
          title="Agora é hora de conversar com um médico."
          description="Seu diagnóstico inicial indica que você se beneficia de avaliação médica. Escolha um especialista, agende a consulta e dê o próximo passo."
          ctaPrimary={{ label: 'Escolher médico', href: '/medicos' }}
          ctaSecondary={{ label: 'Refazer diagnóstico', href: '/quiz' }}
        />
      </div>
    )
  }

  // ---------------- CONSULTATION_BOOKED --------------------
  if (state === 'CONSULTATION_BOOKED') {
    const days = daysUntil(context.scheduledAt as Date | null)
    const isToday = days === 0
    const isSoon = days !== null && days <= 1
    return (
      <div className="space-y-8">
        <StageCard
          icon={Video}
          tone={isToday ? 'brand' : 'info'}
          eyebrow={isToday ? 'É hoje' : `Faltam ${days} dia${days === 1 ? '' : 's'}`}
          title={
            isToday
              ? `Sua consulta com ${context.doctorName?.split(' ').slice(0, 2).join(' ')} é hoje às ${fmtTime(context.scheduledAt as Date)}.`
              : `Consulta com ${context.doctorName?.split(' ').slice(0, 2).join(' ')} marcada para ${fmtDate(context.scheduledAt as Date)} às ${fmtTime(context.scheduledAt as Date)}.`
          }
          description={
            isSoon
              ? 'A sala fica disponível 15 minutos antes do horário. Use Chrome ou Safari, com fone de ouvido.'
              : 'Vamos te lembrar 24h antes e 1h antes da consulta por e-mail. Pode reagendar até 4h antes sem custo.'
          }
          ctaPrimary={
            isSoon
              ? { label: 'Entrar na sala', href: `/consultations/${context.consultationId}/video` }
              : { label: 'Ver detalhes', href: '/tratamento/consultas' }
          }
        />
      </div>
    )
  }

  // ---------------- CONSULTATION_DONE --------------------
  if (state === 'CONSULTATION_DONE') {
    return (
      <div className="space-y-8">
        <StageCard
          icon={Clock}
          tone="info"
          eyebrow="Quase lá"
          title="Aguardando receita do seu médico."
          description="Seu médico tem até 24 horas após a consulta para emitir a receita. Você vai receber um e-mail assim que estiver pronta — e poderá comprar o produto direto aqui pelo app."
          ctaPrimary={{ label: 'Ver minhas consultas', href: '/tratamento/consultas' }}
        />
      </div>
    )
  }

  // ---------------- PRESCRIPTION_READY --------------------
  if (state === 'PRESCRIPTION_READY') {
    return (
      <div className="space-y-8">
        <StageCard
          icon={FileText}
          tone="success"
          eyebrow="Sua receita está pronta"
          title="Agora é só fazer o pedido do seu produto."
          description="Sua prescrição foi assinada. Escolha o produto recomendado pelo seu médico, finalize a compra, e a gente cuida da autorização ANVISA pra você."
          ctaPrimary={{ label: 'Comprar produto', href: '/comprar' }}
          ctaSecondary={{ label: 'Ver receita', href: '/tratamento/receitas' }}
        />
      </div>
    )
  }

  // ---------------- ORDER_PLACED --------------------
  if (state === 'ORDER_PLACED') {
    const eta = context.estimatedDelivery as Date | null
    return (
      <div className="space-y-8">
        <StageCard
          icon={Truck}
          tone="info"
          eyebrow="Pedido em rota"
          title={
            eta
              ? `Seu pedido chega em ${fmtDate(eta)}.`
              : 'Seu pedido está sendo preparado.'
          }
          description="Estamos cuidando do envio + autorização ANVISA do seu pedido. Você recebe atualizações por e-mail em cada etapa: aprovação, envio e entrega."
          ctaPrimary={{ label: 'Acompanhar pedido', href: '/comprar/pedidos' }}
        />
      </div>
    )
  }

  // Fallback (impossível, mas defensivo): dashboard completo
  return <LegacyDashboard />
}
