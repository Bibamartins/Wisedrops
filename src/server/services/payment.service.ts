/**
 * Stripe Payment Service
 *
 * Handles all payment operations for WiseDrops:
 * - Consultation payments (split with doctor via Stripe Connect)
 * - Product order payments (with shipping)
 * - ANVISA fee payments (R$155)
 * - PIX, Credit Card (with installments), and Boleto
 * - Webhooks, refunds, and status tracking
 *
 * All amounts in BRL cents (centavos).
 */

import Stripe from 'stripe'
import { db } from '@/server/db/client'
import { PaymentMethod, PaymentPurpose, PaymentStatus, OrderStatus } from '@prisma/client'

// ---------------------------------------------------------------------------
// Stripe client singleton
// ---------------------------------------------------------------------------

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
})

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONSULTATION_PRICE_CENTS = 8_900 // R$89,00
const ANVISA_FEE_CENTS = 15_500 // R$155,00
const PLATFORM_FEE_PERCENTAGE = 15 // 15% platform fee on consultations
const MAX_INSTALLMENTS = 10
const MIN_INSTALLMENT_CENTS = 1_000 // R$10,00 minimum per installment
const PIX_EXPIRATION_SECONDS = 3600 // 1 hour
const BOLETO_EXPIRATION_DAYS = 3

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateConsultationPaymentInput {
  consultationId: string
  patientUserId: string
  doctorId: string
  method: PaymentMethod
  installments?: number
}

export interface CreateOrderPaymentInput {
  orderId: string
  patientUserId: string
  method: PaymentMethod
  installments?: number
}

export interface CreateAnvisaFeePaymentInput {
  anvisaAuthorizationId: string
  patientUserId: string
  method: PaymentMethod
  installments?: number
}

export interface PaymentResult {
  paymentId: string
  stripePaymentIntentId: string
  clientSecret: string
  status: PaymentStatus
  pixCode?: string | null
  pixQrCodeUrl?: string | null
  boletoUrl?: string | null
  boletoPdf?: string | null
  boletoExpiresAt?: string | null
}

export interface InstallmentOption {
  installments: number
  installmentAmountCents: number
  totalAmountCents: number
  interestRate: number
  label: string
}

interface WebhookResult {
  handled: boolean
  event: string
  paymentId?: string
}

// ---------------------------------------------------------------------------
// Payment Service
// ---------------------------------------------------------------------------

export class PaymentService {
  // =========================================================================
  // CREATE CONSULTATION PAYMENT
  // =========================================================================

  /**
   * Create a payment for a teleconsultation.
   * Uses Stripe Connect to split funds: platform keeps 15%, doctor receives 85%.
   */
  static async createConsultationPayment(
    input: CreateConsultationPaymentInput
  ): Promise<PaymentResult> {
    const consultation = await db.consultation.findUnique({
      where: { id: input.consultationId },
      include: {
        doctor: true,
        patient: { include: { user: true } },
      },
    })

    if (!consultation) {
      throw new PaymentError('Consulta nao encontrada', 'CONSULTATION_NOT_FOUND')
    }

    if (consultation.patient.userId !== input.patientUserId) {
      throw new PaymentError('Nao autorizado', 'UNAUTHORIZED')
    }

    if (consultation.paymentId) {
      // Check if there is already a successful payment
      const existing = await db.payment.findUnique({
        where: { id: consultation.paymentId },
      })
      if (existing && existing.status === PaymentStatus.SUCCEEDED) {
        throw new PaymentError('Esta consulta ja foi paga', 'ALREADY_PAID')
      }
    }

    const priceCents = consultation.priceCents ?? CONSULTATION_PRICE_CENTS
    const platformFeeCents = Math.round(priceCents * (PLATFORM_FEE_PERCENTAGE / 100))

    // Validate installments
    const installments = validateInstallments(input.installments, priceCents, input.method)

    // Build Stripe PaymentIntent params
    const intentParams = buildPaymentIntentParams({
      amountCents: priceCents,
      method: input.method,
      installments,
      description: `WiseDrops - Consulta medica #${consultation.id.slice(0, 8)}`,
      metadata: {
        purpose: PaymentPurpose.CONSULTATION,
        consultationId: consultation.id,
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
      },
      customerEmail: consultation.patient.user.email,
    })

    // Stripe Connect: transfer to doctor after platform fee
    if (consultation.doctor.stripeConnectId) {
      intentParams.transfer_data = {
        destination: consultation.doctor.stripeConnectId,
        amount: priceCents - platformFeeCents,
      }
    }

    const paymentIntent = await stripe.paymentIntents.create(intentParams)

    // Persist payment record
    const payment = await db.payment.create({
      data: {
        purpose: PaymentPurpose.CONSULTATION,
        method: input.method,
        status: PaymentStatus.PENDING,
        amountCents: priceCents,
        platformFeeCents,
        stripePaymentIntentId: paymentIntent.id,
        pixCode: extractPixCode(paymentIntent),
        boletoUrl: extractBoletoUrl(paymentIntent),
        metadata: {
          consultationId: consultation.id,
          doctorStripeId: consultation.doctor.stripeConnectId,
          installments,
        },
      },
    })

    // Link payment to consultation
    await db.consultation.update({
      where: { id: consultation.id },
      data: { paymentId: payment.id },
    })

    return buildPaymentResult(payment.id, paymentIntent)
  }

  // =========================================================================
  // CREATE ORDER PAYMENT
  // =========================================================================

  /**
   * Create a payment for a product order (cannabis products + shipping).
   */
  static async createOrderPayment(
    input: CreateOrderPaymentInput
  ): Promise<PaymentResult> {
    const order = await db.order.findUnique({
      where: { id: input.orderId },
      include: {
        patient: { include: { user: true } },
        items: { include: { product: true } },
        payments: true,
      },
    })

    if (!order) {
      throw new PaymentError('Pedido nao encontrado', 'ORDER_NOT_FOUND')
    }

    if (order.patient.userId !== input.patientUserId) {
      throw new PaymentError('Nao autorizado', 'UNAUTHORIZED')
    }

    // Check if order already has a successful payment
    const existingSuccess = order.payments.find((p) => p.status === PaymentStatus.SUCCEEDED)
    if (existingSuccess) {
      throw new PaymentError('Este pedido ja foi pago', 'ALREADY_PAID')
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new PaymentError('Pedido nao esta aguardando pagamento', 'INVALID_ORDER_STATUS')
    }

    const totalCents = order.totalCents
    const installments = validateInstallments(input.installments, totalCents, input.method)

    // Build line-item description
    const itemDescriptions = order.items
      .map((item) => `${item.quantity}x ${item.product.name}`)
      .join(', ')

    const intentParams = buildPaymentIntentParams({
      amountCents: totalCents,
      method: input.method,
      installments,
      description: `WiseDrops - Pedido #${order.id.slice(0, 8)}: ${itemDescriptions}`,
      metadata: {
        purpose: PaymentPurpose.ORDER,
        orderId: order.id,
        patientId: order.patientId,
      },
      customerEmail: order.patient.user.email,
    })

    const paymentIntent = await stripe.paymentIntents.create(intentParams)

    const payment = await db.payment.create({
      data: {
        orderId: order.id,
        purpose: PaymentPurpose.ORDER,
        method: input.method,
        status: PaymentStatus.PENDING,
        amountCents: totalCents,
        stripePaymentIntentId: paymentIntent.id,
        pixCode: extractPixCode(paymentIntent),
        boletoUrl: extractBoletoUrl(paymentIntent),
        metadata: {
          orderId: order.id,
          itemCount: order.items.length,
          shippingCents: order.shippingCents,
          installments,
        },
      },
    })

    return buildPaymentResult(payment.id, paymentIntent)
  }

  // =========================================================================
  // CREATE ANVISA FEE PAYMENT
  // =========================================================================

  /**
   * Create a payment for the ANVISA authorization fee (R$155).
   */
  static async createAnvisaFeePayment(
    input: CreateAnvisaFeePaymentInput
  ): Promise<PaymentResult> {
    const authorization = await db.anvisaAuthorization.findUnique({
      where: { id: input.anvisaAuthorizationId },
      include: {
        patient: { include: { user: true } },
      },
    })

    if (!authorization) {
      throw new PaymentError('Autorizacao ANVISA nao encontrada', 'ANVISA_AUTH_NOT_FOUND')
    }

    if (authorization.patient.userId !== input.patientUserId) {
      throw new PaymentError('Nao autorizado', 'UNAUTHORIZED')
    }

    const installments = validateInstallments(
      input.installments,
      ANVISA_FEE_CENTS,
      input.method
    )

    const intentParams = buildPaymentIntentParams({
      amountCents: ANVISA_FEE_CENTS,
      method: input.method,
      installments,
      description: `WiseDrops - Taxa ANVISA - Autorizacao #${authorization.id.slice(0, 8)}`,
      metadata: {
        purpose: PaymentPurpose.ANVISA_FEE,
        anvisaAuthorizationId: authorization.id,
        patientId: authorization.patientId,
      },
      customerEmail: authorization.patient.user.email,
    })

    const paymentIntent = await stripe.paymentIntents.create(intentParams)

    const payment = await db.payment.create({
      data: {
        purpose: PaymentPurpose.ANVISA_FEE,
        method: input.method,
        status: PaymentStatus.PENDING,
        amountCents: ANVISA_FEE_CENTS,
        stripePaymentIntentId: paymentIntent.id,
        pixCode: extractPixCode(paymentIntent),
        boletoUrl: extractBoletoUrl(paymentIntent),
        metadata: {
          anvisaAuthorizationId: authorization.id,
          installments,
        },
      },
    })

    return buildPaymentResult(payment.id, paymentIntent)
  }

  // =========================================================================
  // WEBHOOK HANDLER
  // =========================================================================

  /**
   * Process incoming Stripe webhook events.
   * Returns information about what was processed.
   */
  static async handleWebhook(
    rawBody: string | Buffer,
    signature: string
  ): Promise<WebhookResult> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
    } catch (err) {
      throw new PaymentError(
        `Assinatura do webhook invalida: ${err instanceof Error ? err.message : String(err)}`,
        'INVALID_WEBHOOK_SIGNATURE'
      )
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        return PaymentService.handlePaymentSucceeded(
          event.data.object as Stripe.PaymentIntent,
          event.type
        )

      case 'payment_intent.payment_failed':
        return PaymentService.handlePaymentFailed(
          event.data.object as Stripe.PaymentIntent,
          event.type
        )

      case 'payment_intent.canceled':
        return PaymentService.handlePaymentCanceled(
          event.data.object as Stripe.PaymentIntent,
          event.type
        )

      case 'charge.refunded':
        return PaymentService.handleChargeRefunded(
          event.data.object as Stripe.Charge,
          event.type
        )

      case 'charge.dispute.created':
        return PaymentService.handleDisputeCreated(
          event.data.object as Stripe.Dispute,
          event.type
        )

      default:
        return { handled: false, event: event.type }
    }
  }

  // ---- Webhook sub-handlers ----

  private static async handlePaymentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
    eventType: string
  ): Promise<WebhookResult> {
    const payment = await db.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    })

    if (!payment) {
      console.warn(`[Payment] No local record for PI ${paymentIntent.id}`)
      return { handled: false, event: eventType }
    }

    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCEEDED,
        paidAt: new Date(),
      },
    })

    // Purpose-specific side effects
    const metadata = paymentIntent.metadata

    if (payment.purpose === PaymentPurpose.ORDER && payment.orderId) {
      await db.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.PAID },
      })
      await db.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: OrderStatus.PAID,
          note: 'Pagamento confirmado via Stripe',
        },
      })
    }

    if (payment.purpose === PaymentPurpose.CONSULTATION && metadata.consultationId) {
      // Consultation payment confirmed -- no status change needed yet;
      // the consultation stays SCHEDULED until the appointment starts.
      await db.auditLog.create({
        data: {
          action: 'payment.consultation_paid',
          entityType: 'consultation',
          entityId: metadata.consultationId,
          metadata: { paymentId: payment.id, amountCents: payment.amountCents },
        },
      })
    }

    if (payment.purpose === PaymentPurpose.ANVISA_FEE && metadata.anvisaAuthorizationId) {
      await db.auditLog.create({
        data: {
          action: 'payment.anvisa_fee_paid',
          entityType: 'anvisa_authorization',
          entityId: metadata.anvisaAuthorizationId,
          metadata: { paymentId: payment.id },
        },
      })
    }

    return { handled: true, event: eventType, paymentId: payment.id }
  }

  private static async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent,
    eventType: string
  ): Promise<WebhookResult> {
    const payment = await db.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    })

    if (!payment) {
      return { handled: false, event: eventType }
    }

    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        metadata: {
          ...(payment.metadata as Record<string, unknown> ?? {}),
          failureCode: paymentIntent.last_payment_error?.code,
          failureMessage: paymentIntent.last_payment_error?.message,
        },
      },
    })

    return { handled: true, event: eventType, paymentId: payment.id }
  }

  private static async handlePaymentCanceled(
    paymentIntent: Stripe.PaymentIntent,
    eventType: string
  ): Promise<WebhookResult> {
    const payment = await db.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    })

    if (!payment) {
      return { handled: false, event: eventType }
    }

    await db.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    })

    return { handled: true, event: eventType, paymentId: payment.id }
  }

  private static async handleChargeRefunded(
    charge: Stripe.Charge,
    eventType: string
  ): Promise<WebhookResult> {
    const paymentIntentId =
      typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id

    if (!paymentIntentId) {
      return { handled: false, event: eventType }
    }

    const payment = await db.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    })

    if (!payment) {
      return { handled: false, event: eventType }
    }

    const isFullRefund = charge.amount_refunded >= charge.amount
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        refundedAt: new Date(),
      },
    })

    // If a full refund on an order, update order status
    if (isFullRefund && payment.orderId) {
      await db.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.REFUNDED },
      })
      await db.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: OrderStatus.REFUNDED,
          note: 'Reembolso total processado',
        },
      })
    }

    return { handled: true, event: eventType, paymentId: payment.id }
  }

  private static async handleDisputeCreated(
    dispute: Stripe.Dispute,
    eventType: string
  ): Promise<WebhookResult> {
    // Log dispute for admin investigation
    const chargeId =
      typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id
    console.error(`[Payment] DISPUTE created for charge ${chargeId}: ${dispute.reason}`)

    await db.auditLog.create({
      data: {
        action: 'payment.dispute_created',
        entityType: 'payment',
        metadata: {
          disputeId: dispute.id,
          chargeId,
          reason: dispute.reason,
          amountCents: dispute.amount,
        },
      },
    })

    return { handled: true, event: eventType }
  }

  // =========================================================================
  // REFUND HANDLING
  // =========================================================================

  /**
   * Request a full or partial refund for a payment.
   */
  static async refund(
    paymentId: string,
    opts?: { amountCents?: number; reason?: string }
  ): Promise<{ refundId: string; status: string }> {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      throw new PaymentError('Pagamento nao encontrado', 'PAYMENT_NOT_FOUND')
    }

    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new PaymentError(
        'Apenas pagamentos confirmados podem ser reembolsados',
        'INVALID_PAYMENT_STATUS'
      )
    }

    if (!payment.stripePaymentIntentId) {
      throw new PaymentError('Pagamento sem referencia Stripe', 'NO_STRIPE_REFERENCE')
    }

    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: payment.stripePaymentIntentId,
      reason: 'requested_by_customer',
    }

    if (opts?.amountCents) {
      if (opts.amountCents > payment.amountCents) {
        throw new PaymentError(
          'Valor do reembolso excede o valor do pagamento',
          'REFUND_AMOUNT_EXCEEDED'
        )
      }
      refundParams.amount = opts.amountCents
    }

    const refund = await stripe.refunds.create(refundParams)

    const isFullRefund = !opts?.amountCents || opts.amountCents >= payment.amountCents

    await db.payment.update({
      where: { id: paymentId },
      data: {
        status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        refundedAt: new Date(),
        metadata: {
          ...(payment.metadata as Record<string, unknown> ?? {}),
          refundId: refund.id,
          refundAmountCents: refund.amount,
          refundReason: opts?.reason ?? 'Solicitado pelo paciente',
        },
      },
    })

    // Update order status if applicable
    if (isFullRefund && payment.orderId) {
      await db.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.REFUNDED },
      })
      await db.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: OrderStatus.REFUNDED,
          note: opts?.reason ?? 'Reembolso solicitado pelo paciente',
        },
      })
    }

    await db.auditLog.create({
      data: {
        action: 'payment.refund_created',
        entityType: 'payment',
        entityId: paymentId,
        metadata: {
          refundId: refund.id,
          amountCents: refund.amount,
          isFullRefund,
          reason: opts?.reason,
        },
      },
    })

    return { refundId: refund.id, status: refund.status ?? 'pending' }
  }

  // =========================================================================
  // QUERY METHODS
  // =========================================================================

  /**
   * Get a payment by its database ID, enriched with Stripe status.
   */
  static async getPaymentStatus(paymentId: string) {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      throw new PaymentError('Pagamento nao encontrado', 'PAYMENT_NOT_FOUND')
    }

    let stripeStatus: string | null = null
    if (payment.stripePaymentIntentId) {
      try {
        const intent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId)
        stripeStatus = intent.status
      } catch {
        // Non-fatal: return DB status only
      }
    }

    return {
      id: payment.id,
      purpose: payment.purpose,
      method: payment.method,
      status: payment.status,
      stripeStatus,
      amountCents: payment.amountCents,
      platformFeeCents: payment.platformFeeCents,
      pixCode: payment.pixCode,
      boletoUrl: payment.boletoUrl,
      paidAt: payment.paidAt,
      refundedAt: payment.refundedAt,
      createdAt: payment.createdAt,
      metadata: payment.metadata,
    }
  }

  /**
   * List payments for a given user (via their patient record or orders).
   */
  static async listPayments(
    userId: string,
    opts?: {
      purpose?: PaymentPurpose
      status?: PaymentStatus
      page?: number
      limit?: number
    }
  ) {
    const patient = await db.patient.findUnique({
      where: { userId },
    })

    if (!patient) {
      throw new PaymentError('Paciente nao encontrado', 'PATIENT_NOT_FOUND')
    }

    const page = opts?.page ?? 1
    const limit = opts?.limit ?? 20

    // Payments are linked via orders or consultation metadata
    const where: Record<string, unknown> = {}

    if (opts?.purpose) where.purpose = opts.purpose
    if (opts?.status) where.status = opts.status

    // Build an OR that covers all link paths to this patient
    where.OR = [
      { order: { patientId: patient.id } },
      { consultations: { some: { patientId: patient.id } } },
      {
        purpose: PaymentPurpose.ANVISA_FEE,
        metadata: { path: ['patientId'], equals: patient.id },
      },
    ]

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.payment.count({ where }),
    ])

    return { payments, total, pages: Math.ceil(total / limit) }
  }

  /**
   * Calculate available installment options for a given amount.
   * Installments 1-3 are interest-free; 4-10 have 1.99%/month interest.
   */
  static getInstallmentOptions(amountCents: number): InstallmentOption[] {
    const options: InstallmentOption[] = []

    for (let i = 1; i <= MAX_INSTALLMENTS; i++) {
      const installmentAmount = Math.ceil(amountCents / i)

      if (i > 1 && installmentAmount < MIN_INSTALLMENT_CENTS) break

      // Interest-free up to 3x; 1.99%/month after
      const interestRate = i <= 3 ? 0 : 1.99
      let totalAmount = amountCents

      if (interestRate > 0) {
        // Compound interest: total = principal * (1 + rate)^n
        const monthlyRate = interestRate / 100
        totalAmount = Math.round(amountCents * Math.pow(1 + monthlyRate, i))
      }

      const perInstallment = Math.ceil(totalAmount / i)

      const label =
        i === 1
          ? `1x de R$${(totalAmount / 100).toFixed(2).replace('.', ',')} (a vista)`
          : interestRate === 0
          ? `${i}x de R$${(perInstallment / 100).toFixed(2).replace('.', ',')} sem juros`
          : `${i}x de R$${(perInstallment / 100).toFixed(2).replace('.', ',')} (${interestRate}% a.m.)`

      options.push({
        installments: i,
        installmentAmountCents: perInstallment,
        totalAmountCents: totalAmount,
        interestRate,
        label,
      })
    }

    return options
  }

  /**
   * Retrieve the Stripe client secret for a payment that is already created.
   * Useful when the user returns to complete a pending payment.
   */
  static async getClientSecret(paymentId: string): Promise<string> {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment?.stripePaymentIntentId) {
      throw new PaymentError('Pagamento nao encontrado', 'PAYMENT_NOT_FOUND')
    }

    const intent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId)

    if (!intent.client_secret) {
      throw new PaymentError('Nao foi possivel recuperar o pagamento', 'NO_CLIENT_SECRET')
    }

    return intent.client_secret
  }
}

// ---------------------------------------------------------------------------
// Helpers (module-private)
// ---------------------------------------------------------------------------

function validateInstallments(
  installments: number | undefined,
  amountCents: number,
  method: PaymentMethod
): number {
  if (method !== PaymentMethod.CREDIT_CARD) return 1

  const n = installments ?? 1
  if (n < 1 || n > MAX_INSTALLMENTS) {
    throw new PaymentError(
      `Parcelamento deve ser entre 1 e ${MAX_INSTALLMENTS}`,
      'INVALID_INSTALLMENTS'
    )
  }

  const perInstallment = Math.ceil(amountCents / n)
  if (n > 1 && perInstallment < MIN_INSTALLMENT_CENTS) {
    throw new PaymentError(
      `Parcela minima de R$${(MIN_INSTALLMENT_CENTS / 100).toFixed(2).replace('.', ',')}`,
      'INSTALLMENT_TOO_LOW'
    )
  }

  return n
}

interface PaymentIntentBuildParams {
  amountCents: number
  method: PaymentMethod
  installments: number
  description: string
  metadata: Record<string, string>
  customerEmail: string
}

function buildPaymentIntentParams(
  params: PaymentIntentBuildParams
): Stripe.PaymentIntentCreateParams {
  const base: Stripe.PaymentIntentCreateParams = {
    amount: params.amountCents,
    currency: 'brl',
    description: params.description,
    metadata: params.metadata,
    receipt_email: params.customerEmail,
  }

  switch (params.method) {
    case PaymentMethod.PIX:
      return {
        ...base,
        payment_method_types: ['pix'],
        payment_method_options: {
          pix: {
            expires_after_seconds: PIX_EXPIRATION_SECONDS,
          },
        },
      }

    case PaymentMethod.BOLETO:
      return {
        ...base,
        payment_method_types: ['boleto'],
        payment_method_options: {
          boleto: {
            expires_after_days: BOLETO_EXPIRATION_DAYS,
          },
        },
      }

    case PaymentMethod.CREDIT_CARD: {
      const intentParams: Stripe.PaymentIntentCreateParams = {
        ...base,
        payment_method_types: ['card'],
      }

      // If installments > 1, calculate total with interest and set installment plan
      if (params.installments > 1) {
        const interestRate = params.installments <= 3 ? 0 : 1.99
        let totalAmount = params.amountCents

        if (interestRate > 0) {
          const monthlyRate = interestRate / 100
          totalAmount = Math.round(params.amountCents * Math.pow(1 + monthlyRate, params.installments))
        }

        intentParams.amount = totalAmount
        intentParams.payment_method_options = {
          card: {
            installments: {
              enabled: true,
            },
          },
        }
        intentParams.metadata = {
          ...intentParams.metadata,
          installments: String(params.installments),
          originalAmountCents: String(params.amountCents),
          interestRate: String(interestRate),
        }
      }

      return intentParams
    }

    default:
      throw new PaymentError(`Metodo de pagamento nao suportado: ${params.method}`, 'INVALID_METHOD')
  }
}

function extractPixCode(intent: Stripe.PaymentIntent): string | null {
  const action = intent.next_action
  if (action?.type === 'pix_display_qr_code') {
    return (action as unknown as { pix_display_qr_code: { data: string } }).pix_display_qr_code
      ?.data ?? null
  }
  return null
}

function extractBoletoUrl(intent: Stripe.PaymentIntent): string | null {
  const action = intent.next_action
  if (action?.type === 'boleto_display_details') {
    return (action as unknown as {
      boleto_display_details: { hosted_voucher_url: string }
    }).boleto_display_details?.hosted_voucher_url ?? null
  }
  return null
}

function buildPaymentResult(
  paymentId: string,
  intent: Stripe.PaymentIntent
): PaymentResult {
  const result: PaymentResult = {
    paymentId,
    stripePaymentIntentId: intent.id,
    clientSecret: intent.client_secret!,
    status: PaymentStatus.PENDING,
  }

  // PIX data
  const pixAction = intent.next_action
  if (pixAction?.type === 'pix_display_qr_code') {
    const pixData = (pixAction as unknown as {
      pix_display_qr_code: { data: string; image_url_png: string }
    }).pix_display_qr_code
    result.pixCode = pixData?.data ?? null
    result.pixQrCodeUrl = pixData?.image_url_png ?? null
  }

  // Boleto data
  if (pixAction?.type === 'boleto_display_details') {
    const boletoData = (pixAction as unknown as {
      boleto_display_details: {
        hosted_voucher_url: string
        pdf: string
        expires_at: number
      }
    }).boleto_display_details
    result.boletoUrl = boletoData?.hosted_voucher_url ?? null
    result.boletoPdf = boletoData?.pdf ?? null
    result.boletoExpiresAt = boletoData?.expires_at
      ? new Date(boletoData.expires_at * 1000).toISOString()
      : null
  }

  return result
}

// ---------------------------------------------------------------------------
// Custom error class
// ---------------------------------------------------------------------------

export class PaymentError extends Error {
  code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'PaymentError'
    this.code = code
  }
}
