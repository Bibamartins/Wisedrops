/**
 * status-registry.ts
 * Fonte da verdade para TODOS os estados do produto WiseDrops.
 *
 * Gramática: (kind, state) → { label, icon, tone, sentence, nextAction }
 *
 * Referência arquitetural: docs/arquitetura-produto.md § 5
 * Mapeamentos DB→registry: funções mapXxxStatus() no final do arquivo.
 *
 * REGRA: nunca inventar estado novo aqui sem espelho no schema Prisma.
 */

import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader,
  Pause,
  Truck,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export type Tone =
  | 'sage'
  | 'brand'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'

export type StatusKind =
  | 'consultation'
  | 'prescription'
  | 'order'
  | 'treatment'
  | 'doctor'

export interface StatusNextAction {
  /** Texto do CTA exibido ao usuário */
  label: string
  /**
   * Regra de exibição:
   * - 'always'        → sempre visível
   * - 'within-15min'  → apenas quando a consulta começa em ≤ 15 min
   */
  show: 'always' | 'within-15min'
}

export interface StatusEntry {
  /** Rótulo curto (1-3 palavras) para pill/badge */
  label: string
  /** Ícone semântico Lucide */
  icon: LucideIcon
  /** Tom de cor semântico — mapeia para tokens Tailwind do design system */
  tone: Tone
  /** Frase explicativa completa (1-2 frases, PT-BR, voz ativa) */
  sentence: string
  /** CTA opcional */
  nextAction?: StatusNextAction
}

// ---------------------------------------------------------------------------
// Registro canônico
// ---------------------------------------------------------------------------

export const STATUS_REGISTRY = {
  // ── Consulta ─────────────────────────────────────────────────────────────
  consultation: {
    agendada: {
      label: 'Agendada',
      icon: Clock,
      tone: 'sage' as Tone,
      sentence: 'Sua consulta está marcada. Você receberá um aviso quando faltar 15 minutos.',
      nextAction: { label: 'Entrar na sala', show: 'within-15min' as const },
    },
    'em-andamento': {
      label: 'Em andamento',
      icon: Loader,
      tone: 'brand' as Tone,
      sentence: 'A consulta está acontecendo agora.',
      nextAction: { label: 'Voltar à sala', show: 'always' as const },
    },
    'concluida-aguardando-receita': {
      label: 'Aguardando receita',
      icon: Clock,
      tone: 'info' as Tone,
      sentence: 'Consulta concluída. Aguardando seu médico emitir a receita (até 24h).',
    },
    concluida: {
      label: 'Concluída',
      icon: CheckCircle,
      tone: 'success' as Tone,
      sentence: 'Consulta concluída com sucesso. A receita está disponível.',
    },
    cancelada: {
      label: 'Cancelada',
      icon: XCircle,
      tone: 'error' as Tone,
      sentence: 'Consulta cancelada.',
      nextAction: { label: 'Reagendar', show: 'always' as const },
    },
    'nao-compareceu': {
      label: 'Não compareceu',
      icon: XCircle,
      tone: 'neutral' as Tone,
      sentence: 'O paciente não compareceu à consulta.',
      nextAction: { label: 'Reagendar', show: 'always' as const },
    },
  },

  // ── Receita ───────────────────────────────────────────────────────────────
  prescription: {
    rascunho: {
      label: 'Rascunho',
      icon: Clock,
      tone: 'neutral' as Tone,
      sentence: 'Em elaboração pelo médico.',
    },
    'assinada-aguardando-anvisa': {
      label: 'Em análise ANVISA',
      icon: Loader,
      tone: 'info' as Tone,
      sentence: 'Receita assinada e em análise na ANVISA. Em média leva 3 a 5 dias úteis.',
    },
    aprovada: {
      label: 'Aprovada',
      icon: CheckCircle,
      tone: 'success' as Tone,
      sentence: 'Receita aprovada. Você já pode comprar o produto.',
      nextAction: { label: 'Comprar agora', show: 'always' as const },
    },
    recusada: {
      label: 'Requer correção',
      icon: AlertCircle,
      tone: 'error' as Tone,
      sentence: 'Foi necessário corrigir um dado da receita. Veja a mensagem do médico.',
      nextAction: { label: 'Ver mensagem do médico', show: 'always' as const },
    },
    dispensada: {
      label: 'Dispensada',
      icon: CheckCircle,
      tone: 'sage' as Tone,
      sentence: 'Receita já foi utilizada em um pedido.',
    },
    expirada: {
      label: 'Expirada',
      icon: XCircle,
      tone: 'neutral' as Tone,
      sentence: 'Esta receita venceu. Agende um retorno para obter uma nova prescrição.',
      nextAction: { label: 'Agendar retorno', show: 'always' as const },
    },
  },

  // ── Pedido ────────────────────────────────────────────────────────────────
  order: {
    'aguardando-pagamento': {
      label: 'Aguardando pagamento',
      icon: Clock,
      tone: 'warning' as Tone,
      sentence: 'Conclua o pagamento em 1h ou o pedido será cancelado automaticamente.',
      nextAction: { label: 'Pagar agora', show: 'always' as const },
    },
    'pago-em-processamento': {
      label: 'Em processamento',
      icon: Loader,
      tone: 'info' as Tone,
      sentence: 'Pagamento recebido. Estamos preparando o despacho do seu pedido.',
    },
    'em-rota': {
      label: 'Em rota',
      icon: Truck,
      tone: 'info' as Tone,
      sentence: 'Pedido despachado e a caminho.',
      nextAction: { label: 'Rastrear entrega', show: 'always' as const },
    },
    entregue: {
      label: 'Entregue',
      icon: CheckCircle,
      tone: 'success' as Tone,
      sentence: 'Pedido entregue com sucesso. Pronto para iniciar o tratamento.',
      nextAction: { label: 'Ver protocolo de tratamento', show: 'always' as const },
    },
    cancelado: {
      label: 'Cancelado',
      icon: XCircle,
      tone: 'error' as Tone,
      sentence: 'Pedido cancelado. O reembolso será processado em até 5 dias úteis.',
    },
    reembolsado: {
      label: 'Reembolsado',
      icon: CheckCircle,
      tone: 'neutral' as Tone,
      sentence: 'Pedido cancelado e reembolso concluído.',
    },
  },

  // ── Tratamento ────────────────────────────────────────────────────────────
  treatment: {
    'nao-iniciado': {
      label: 'Não iniciado',
      icon: Pause,
      tone: 'neutral' as Tone,
      sentence: 'Comece o tratamento quando receber o produto.',
      nextAction: { label: 'Ver protocolo', show: 'always' as const },
    },
    'em-andamento': {
      label: 'Em andamento',
      icon: Loader,
      tone: 'sage' as Tone,
      sentence: 'Tratamento em curso. Continue seguindo o protocolo.',
      nextAction: { label: 'Registrar dose', show: 'always' as const },
    },
    pausa: {
      label: 'Pausado',
      icon: Pause,
      tone: 'warning' as Tone,
      sentence: 'Tratamento pausado. Retome quando estiver pronto ou fale com seu médico.',
      nextAction: { label: 'Retomar tratamento', show: 'always' as const },
    },
    concluido: {
      label: 'Concluído',
      icon: CheckCircle,
      tone: 'success' as Tone,
      sentence: 'Tratamento concluído. Agende um retorno para avaliar os resultados.',
      nextAction: { label: 'Agendar retorno', show: 'always' as const },
    },
    descontinuado: {
      label: 'Descontinuado',
      icon: XCircle,
      tone: 'neutral' as Tone,
      sentence: 'Tratamento descontinuado. Fale com seu médico para mais informações.',
    },
  },

  // ── Médico ────────────────────────────────────────────────────────────────
  doctor: {
    'pendente-verificacao': {
      label: 'Em análise',
      icon: Clock,
      tone: 'warning' as Tone,
      sentence: 'Documentação em análise pela equipe WiseDrops (1 a 3 dias úteis).',
    },
    'sob-revisao': {
      label: 'Em revisão',
      icon: Loader,
      tone: 'info' as Tone,
      sentence: 'Documentação em revisão detalhada. Entraremos em contato em breve.',
    },
    ativo: {
      label: 'Ativo',
      icon: CheckCircle,
      tone: 'success' as Tone,
      sentence: 'Médico ativo e disponível para atendimento.',
    },
    suspenso: {
      label: 'Suspenso',
      icon: AlertCircle,
      tone: 'error' as Tone,
      sentence: 'Conta suspensa. Entre em contato com o suporte para mais informações.',
    },
    inativo: {
      label: 'Inativo',
      icon: Pause,
      tone: 'neutral' as Tone,
      sentence: 'Médico não está aceitando novos pacientes no momento.',
    },
    rejeitado: {
      label: 'Reprovado',
      icon: XCircle,
      tone: 'error' as Tone,
      sentence: 'Cadastro não aprovado. Verifique seus documentos e tente novamente.',
    },
  },
} as const satisfies Record<StatusKind, Record<string, StatusEntry>>

// ---------------------------------------------------------------------------
// Tipo utilitário: extrai os states válidos de um kind
// ---------------------------------------------------------------------------

export type ConsultationState = keyof typeof STATUS_REGISTRY.consultation
export type PrescriptionState = keyof typeof STATUS_REGISTRY.prescription
export type OrderState        = keyof typeof STATUS_REGISTRY.order
export type TreatmentState    = keyof typeof STATUS_REGISTRY.treatment
export type DoctorState       = keyof typeof STATUS_REGISTRY.doctor

export type AnyState =
  | ConsultationState
  | PrescriptionState
  | OrderState
  | TreatmentState
  | DoctorState

// ---------------------------------------------------------------------------
// Funções de lookup tipadas
// ---------------------------------------------------------------------------

export function getStatus(kind: 'consultation', state: string): StatusEntry
export function getStatus(kind: 'prescription', state: string): StatusEntry
export function getStatus(kind: 'order', state: string): StatusEntry
export function getStatus(kind: 'treatment', state: string): StatusEntry
export function getStatus(kind: 'doctor', state: string): StatusEntry
export function getStatus(kind: StatusKind, state: string): StatusEntry {
  const kindMap = STATUS_REGISTRY[kind] as Record<string, StatusEntry>
  return (
    kindMap[state] ?? {
      label: state,
      icon: AlertCircle,
      tone: 'neutral' as Tone,
      sentence: 'Estado desconhecido.',
    }
  )
}

// ---------------------------------------------------------------------------
// Mapas DB → registry  (schema Prisma → chave do registry)
// ---------------------------------------------------------------------------

/** ConsultationStatus (Prisma) → ConsultationState (registry) */
export function mapConsultationStatus(dbStatus: string): ConsultationState {
  const map: Record<string, ConsultationState> = {
    SCHEDULED:    'agendada',
    WAITING_ROOM: 'agendada',
    IN_PROGRESS:  'em-andamento',
    COMPLETED:    'concluida',
    CANCELLED:    'cancelada',
    NO_SHOW:      'nao-compareceu',
  }
  return map[dbStatus] ?? 'agendada'
}

/** PrescriptionStatus (Prisma) → PrescriptionState (registry) */
export function mapPrescriptionStatus(dbStatus: string): PrescriptionState {
  const map: Record<string, PrescriptionState> = {
    DRAFT:           'rascunho',
    SIGNED:          'assinada-aguardando-anvisa',
    SENT_TO_ANVISA:  'assinada-aguardando-anvisa',
    ANVISA_APPROVED: 'aprovada',
    ANVISA_REJECTED: 'recusada',
    DISPENSED:       'dispensada',
    EXPIRED:         'expirada',
    CANCELLED:       'recusada',
  }
  return map[dbStatus] ?? 'rascunho'
}

/** OrderStatus (Prisma) → OrderState (registry) */
export function mapOrderStatus(dbStatus: string): OrderState {
  const map: Record<string, OrderState> = {
    PENDING_PAYMENT:   'aguardando-pagamento',
    PAID:              'pago-em-processamento',
    PROCESSING:        'pago-em-processamento',
    AWAITING_ANVISA:   'pago-em-processamento',
    ANVISA_APPROVED:   'pago-em-processamento',
    SHIPPED:           'em-rota',
    IN_TRANSIT:        'em-rota',
    OUT_FOR_DELIVERY:  'em-rota',
    DELIVERED:         'entregue',
    CANCELLED:         'cancelado',
    REFUNDED:          'reembolsado',
  }
  return map[dbStatus] ?? 'aguardando-pagamento'
}

/**
 * TreatmentStatus (Prisma) → TreatmentState (registry)
 *
 * Nota: ACTIVE no Prisma cobre tanto "em andamento" quanto "não iniciado".
 * O chamador deve passar o estado correto com base em `startedAt` do plano.
 */
export function mapTreatmentStatus(dbStatus: string): TreatmentState {
  const map: Record<string, TreatmentState> = {
    ACTIVE:        'em-andamento',
    PAUSED:        'pausa',
    COMPLETED:     'concluido',
    DISCONTINUED:  'descontinuado',
  }
  return map[dbStatus] ?? 'nao-iniciado'
}

/**
 * DoctorVerificationStatus (Prisma) + AccountStatus (Prisma) → DoctorState (registry)
 *
 * A lógica combinada:
 * - verificationStatus=PENDING/UNDER_REVIEW + accountStatus=PENDING_VERIFICATION → pendente/sob-revisao
 * - verificationStatus=APPROVED + accountStatus=ACTIVE  → ativo
 * - accountStatus=SUSPENDED → suspenso
 * - accountStatus=DEACTIVATED → inativo
 * - verificationStatus=REJECTED → rejeitado
 */
export function mapDoctorStatus(
  verificationStatus: string,
  accountStatus: string,
): DoctorState {
  if (accountStatus === 'SUSPENDED') return 'suspenso'
  if (accountStatus === 'DEACTIVATED') return 'inativo'
  if (verificationStatus === 'REJECTED') return 'rejeitado'
  if (verificationStatus === 'UNDER_REVIEW') return 'sob-revisao'
  if (verificationStatus === 'PENDING') return 'pendente-verificacao'
  if (verificationStatus === 'APPROVED' && accountStatus === 'ACTIVE') return 'ativo'
  return 'pendente-verificacao'
}

// ---------------------------------------------------------------------------
// Mapa tone → tokens Tailwind  (usado pelo StatusBadge)
// ---------------------------------------------------------------------------

/**
 * Tokens WCAG AA garantidos:
 * - texto 700 sobre bg 50/100 → ratio mínimo 5.4:1 em todos os tons
 * - brand-500 (#f97316) NUNCA usado em texto — apenas brand-700 em diante
 */
export const TONE_TOKENS: Record<
  Tone,
  { bg: string; text: string; border: string; bgStrong: string; textStrong: string }
> = {
  sage:    { bg: 'bg-sage-50',    text: 'text-sage-700',    border: 'border-sage-200',    bgStrong: 'bg-sage-100',    textStrong: 'text-sage-800'    },
  brand:   { bg: 'bg-brand-50',   text: 'text-brand-700',   border: 'border-brand-200',   bgStrong: 'bg-brand-100',   textStrong: 'text-brand-800'   },
  info:    { bg: 'bg-info-50',    text: 'text-info-700',    border: 'border-info-100',    bgStrong: 'bg-info-100',    textStrong: 'text-info-700'    },
  success: { bg: 'bg-success-50', text: 'text-success-700', border: 'border-success-100', bgStrong: 'bg-success-100', textStrong: 'text-success-700' },
  warning: { bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-100', bgStrong: 'bg-warning-100', textStrong: 'text-warning-700' },
  error:   { bg: 'bg-error-50',   text: 'text-error-700',   border: 'border-error-100',   bgStrong: 'bg-error-100',   textStrong: 'text-error-700'   },
  neutral: { bg: 'bg-surface-100',text: 'text-surface-700', border: 'border-surface-200', bgStrong: 'bg-surface-200', textStrong: 'text-surface-700' },
}
