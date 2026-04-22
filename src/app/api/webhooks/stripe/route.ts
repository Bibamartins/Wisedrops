/**
 * Stripe Webhook Endpoint
 *
 * POST /api/webhooks/stripe
 *
 * Receives events from Stripe and delegates to PaymentService.handleWebhook.
 * The raw body is required for signature verification -- Next.js App Router
 * delivers it natively when we export the correct config.
 */

import { NextRequest, NextResponse } from 'next/server'
import { PaymentService, PaymentError } from '@/server/services/payment.service'

// Disable body parsing so we receive the raw buffer for Stripe signature verification
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Cabecalho stripe-signature ausente' },
      { status: 400 }
    )
  }

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json(
      { error: 'Nao foi possivel ler o corpo da requisicao' },
      { status: 400 }
    )
  }

  if (!rawBody) {
    return NextResponse.json(
      { error: 'Corpo da requisicao vazio' },
      { status: 400 }
    )
  }

  try {
    const result = await PaymentService.handleWebhook(rawBody, signature)

    if (result.handled) {
      console.log(
        `[Stripe Webhook] Evento processado: ${result.event}` +
          (result.paymentId ? ` (payment: ${result.paymentId})` : '')
      )
    } else {
      console.log(`[Stripe Webhook] Evento ignorado: ${result.event}`)
    }

    return NextResponse.json({ received: true, handled: result.handled })
  } catch (err) {
    if (err instanceof PaymentError && err.code === 'INVALID_WEBHOOK_SIGNATURE') {
      console.error(`[Stripe Webhook] Assinatura invalida: ${err.message}`)
      return NextResponse.json(
        { error: 'Assinatura do webhook invalida' },
        { status: 400 }
      )
    }

    console.error('[Stripe Webhook] Erro inesperado:', err)
    return NextResponse.json(
      { error: 'Erro interno ao processar webhook' },
      { status: 500 }
    )
  }
}
