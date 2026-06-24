'use client'

/**
 * StatusBadge — gramática visual única para todos os estados do produto WiseDrops.
 *
 * 3 variantes:
 *   badge  → pill compacto com ícone + rótulo. Para listas, cards e tabelas.
 *   card   → pill + frase explicativa + CTA opcional. Para telas de detalhe.
 *   banner → full-width, ícone grande, frase e CTA proeminente. Para topo de tela.
 *
 * Todos os tokens de cor passam WCAG AA (texto -700 sobre bg -50/-100).
 * Referência de design: docs/arquitetura-produto.md § 5
 */

import { cn } from '@/lib/utils'
import {
  getStatus,
  TONE_TOKENS,
  type StatusKind,
} from '@/lib/status-registry'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface StatusBadgeProps {
  /** Entidade de domínio */
  kind: StatusKind
  /**
   * Chave canônica do registry (ex: 'agendada', 'em-rota').
   * Use mapXxxStatus() do registry para converter status do DB.
   */
  state: string
  /** Visual do componente (default: 'badge') */
  variant?: 'badge' | 'card' | 'banner'
  /**
   * Exibir CTA do nextAction?
   * - badge: default false
   * - card/banner: default true
   */
  showAction?: boolean
  /** Callback disparado ao clicar no CTA do nextAction */
  onActionClick?: () => void
  className?: string
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function StatusBadge({
  kind,
  state,
  variant = 'badge',
  showAction,
  onActionClick,
  className,
}: StatusBadgeProps) {
  const entry = getStatus(kind as Parameters<typeof getStatus>[0], state)
  const { label, icon: Icon, tone, sentence, nextAction } = entry
  const tokens = TONE_TOKENS[tone]

  // Cada variante decide seu default de showAction
  const showCta =
    showAction !== undefined
      ? showAction
      : variant !== 'badge' // card e banner mostram CTA por padrão

  const hasAction = showCta && !!nextAction

  // ── badge ────────────────────────────────────────────────────────────────
  if (variant === 'badge') {
    return (
      <span
        role="status"
        aria-label={`${label}: ${sentence}`}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5',
          'text-xs font-medium leading-none border',
          tokens.bg,
          tokens.text,
          tokens.border,
          className,
        )}
      >
        <Icon
          aria-hidden="true"
          className={cn(
            'h-3 w-3 shrink-0',
            // Ícone spin para estados de processamento/carregamento
            (tone === 'brand' ||
              (tone === 'info' &&
                (state.includes('andamento') ||
                  state.includes('processamento') ||
                  state.includes('anvisa')))) &&
              'animate-spin',
          )}
        />
        {label}
      </span>
    )
  }

  // ── card ─────────────────────────────────────────────────────────────────
  if (variant === 'card') {
    return (
      <div
        role="status"
        aria-label={`Status: ${label}`}
        className={cn(
          'flex items-start gap-3 rounded-xl border p-4',
          tokens.bg,
          tokens.border,
          className,
        )}
      >
        {/* Ícone */}
        <div
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            tokens.bgStrong,
          )}
          aria-hidden="true"
        >
          <Icon
            className={cn('h-4 w-4', tokens.textStrong)}
          />
        </div>

        {/* Texto */}
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-semibold leading-snug', tokens.text)}>
            {label}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-surface-600">
            {sentence}
          </p>

          {/* CTA */}
          {hasAction && (
            <button
              type="button"
              onClick={onActionClick}
              className={cn(
                'mt-2 inline-flex items-center text-xs font-medium underline-offset-2',
                'hover:underline focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-offset-1 rounded focus-visible:ring-current',
                tokens.text,
              )}
            >
              {nextAction!.label}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── banner ───────────────────────────────────────────────────────────────
  return (
    <div
      role="status"
      aria-label={`Status: ${label}`}
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center gap-4',
        'w-full rounded-2xl border p-5',
        tokens.bg,
        tokens.border,
        className,
      )}
    >
      {/* Ícone grande */}
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
          tokens.bgStrong,
        )}
        aria-hidden="true"
      >
        <Icon className={cn('h-6 w-6', tokens.textStrong)} />
      </div>

      {/* Texto */}
      <div className="min-w-0 flex-1">
        <p className={cn('font-heading text-base font-semibold leading-snug', tokens.textStrong)}>
          {label}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-surface-700">
          {sentence}
        </p>
      </div>

      {/* CTA */}
      {hasAction && (
        <button
          type="button"
          onClick={onActionClick}
          className={cn(
            'shrink-0 rounded-xl px-5 py-2.5 text-sm font-medium transition-opacity',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            tokens.bgStrong,
            tokens.textStrong,
            'hover:opacity-80',
          )}
        >
          {nextAction!.label}
        </button>
      )}
    </div>
  )
}
