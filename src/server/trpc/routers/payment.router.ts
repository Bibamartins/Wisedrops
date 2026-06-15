import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure, patientProcedure, adminProcedure } from '../trpc'
import { PaymentService, PaymentError } from '@/server/services/payment.service'
import { PaymentMethod, PaymentPurpose, PaymentStatus } from '@prisma/client'
import { createPaypalOrder, paypalConfigured } from '@/server/services/paypal.service'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function mapPaymentError(err: unknown): never {
  if (err instanceof PaymentError) {
    const codeMap: Record<string, 'NOT_FOUND' | 'FORBIDDEN' | 'BAD_REQUEST' | 'CONFLICT'> = {
      CONSULTATION_NOT_FOUND: 'NOT_FOUND',
      ORDER_NOT_FOUND: 'NOT_FOUND',
      ANVISA_AUTH_NOT_FOUND: 'NOT_FOUND',
      PAYMENT_NOT_FOUND: 'NOT_FOUND',
      PATIENT_NOT_FOUND: 'NOT_FOUND',
      UNAUTHORIZED: 'FORBIDDEN',
      ALREADY_PAID: 'CONFLICT',
      INVALID_ORDER_STATUS: 'BAD_REQUEST',
      INVALID_INSTALLMENTS: 'BAD_REQUEST',
      INSTALLMENT_TOO_LOW: 'BAD_REQUEST',
      INVALID_METHOD: 'BAD_REQUEST',
      INVALID_PAYMENT_STATUS: 'BAD_REQUEST',
      REFUND_AMOUNT_EXCEEDED: 'BAD_REQUEST',
      NO_STRIPE_REFERENCE: 'BAD_REQUEST',
      NO_CLIENT_SECRET: 'BAD_REQUEST',
    }

    throw new TRPCError({
      code: codeMap[err.code] ?? 'INTERNAL_SERVER_ERROR',
      message: err.message,
    })
  }

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Erro interno ao processar pagamento',
  })
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const paymentRouter = createTRPCRouter({
  /**
   * Create a PaymentIntent for a consultation, order, or ANVISA fee.
   */
  createPaymentIntent: patientProcedure
    .input(
      z.discriminatedUnion('purpose', [
        z.object({
          purpose: z.literal('CONSULTATION'),
          consultationId: z.string().uuid(),
          doctorId: z.string().uuid(),
          method: z.nativeEnum(PaymentMethod),
          installments: z.number().int().min(1).max(10).optional(),
        }),
        z.object({
          purpose: z.literal('ORDER'),
          orderId: z.string().uuid(),
          method: z.nativeEnum(PaymentMethod),
          installments: z.number().int().min(1).max(10).optional(),
        }),
        z.object({
          purpose: z.literal('ANVISA_FEE'),
          anvisaAuthorizationId: z.string().uuid(),
          method: z.nativeEnum(PaymentMethod),
          installments: z.number().int().min(1).max(10).optional(),
        }),
      ])
    )
    .mutation(async ({ ctx, input }) => {
      try {
        switch (input.purpose) {
          case 'CONSULTATION':
            return await PaymentService.createConsultationPayment({
              consultationId: input.consultationId,
              patientUserId: ctx.session.userId,
              doctorId: input.doctorId,
              method: input.method,
              installments: input.installments,
            })

          case 'ORDER':
            return await PaymentService.createOrderPayment({
              orderId: input.orderId,
              patientUserId: ctx.session.userId,
              method: input.method,
              installments: input.installments,
            })

          case 'ANVISA_FEE':
            return await PaymentService.createAnvisaFeePayment({
              anvisaAuthorizationId: input.anvisaAuthorizationId,
              patientUserId: ctx.session.userId,
              method: input.method,
              installments: input.installments,
            })
        }
      } catch (err) {
        mapPaymentError(err)
      }
    }),

  /**
   * Retrieve the client secret for an existing pending payment,
   * so the frontend can resume the Stripe Elements flow.
   */
  confirmPayment: patientProcedure
    .input(z.object({ paymentId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        const clientSecret = await PaymentService.getClientSecret(input.paymentId)
        return { clientSecret }
      } catch (err) {
        mapPaymentError(err)
      }
    }),

  /**
   * Get current payment status (DB + live Stripe status).
   */
  getPaymentStatus: protectedProcedure
    .input(z.object({ paymentId: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        return await PaymentService.getPaymentStatus(input.paymentId)
      } catch (err) {
        mapPaymentError(err)
      }
    }),

  /**
   * List the authenticated patient's payments with optional filters.
   */
  listPayments: patientProcedure
    .input(
      z.object({
        purpose: z.nativeEnum(PaymentPurpose).optional(),
        status: z.nativeEnum(PaymentStatus).optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        return await PaymentService.listPayments(ctx.session.userId, {
          purpose: input.purpose,
          status: input.status,
          page: input.page,
          limit: input.limit,
        })
      } catch (err) {
        mapPaymentError(err)
      }
    }),

  /**
   * Request a refund (patient-initiated or admin-initiated).
   */
  requestRefund: protectedProcedure
    .input(
      z.object({
        paymentId: z.string().uuid(),
        amountCents: z.number().int().positive().optional(),
        reason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only patients who own the payment or admins can request refunds
      if (ctx.session.role !== 'ADMIN') {
        const payment = await PaymentService.getPaymentStatus(input.paymentId)
        if (!payment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Pagamento nao encontrado' })
        }

        // Verify ownership through the patient record
        const patient = await ctx.db.patient.findUnique({
          where: { userId: ctx.session.userId },
        })

        if (!patient) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Nao autorizado' })
        }

        // Check ownership via order or consultation
        const meta = payment.metadata as Record<string, unknown> | null
        const ownsViaConsultation = meta?.consultationId
          ? await ctx.db.consultation.findFirst({
              where: {
                id: meta.consultationId as string,
                patientId: patient.id,
              },
            })
          : null

        const ownsViaOrder = payment.purpose === 'ORDER'
          ? await ctx.db.order.findFirst({
              where: {
                payments: { some: { id: input.paymentId } },
                patientId: patient.id,
              },
            })
          : null

        const ownsViaAnvisa = meta?.patientId === patient.id

        if (!ownsViaConsultation && !ownsViaOrder && !ownsViaAnvisa) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Nao autorizado' })
        }
      }

      try {
        return await PaymentService.refund(input.paymentId, {
          amountCents: input.amountCents,
          reason: input.reason,
        })
      } catch (err) {
        mapPaymentError(err)
      }
    }),

  /**
   * Get available payment methods and installment options for an amount.
   */
  getPaymentMethods: protectedProcedure
    .input(z.object({ amountCents: z.number().int().positive() }))
    .query(({ input }) => {
      const installmentOptions = PaymentService.getInstallmentOptions(input.amountCents)

      return {
        methods: [
          {
            id: PaymentMethod.PIX,
            label: 'PIX',
            description: 'Pagamento instantaneo. Aprovacao em segundos.',
            discount: 5, // 5% discount for PIX
            discountedAmountCents: Math.round(input.amountCents * 0.95),
          },
          {
            id: PaymentMethod.CREDIT_CARD,
            label: 'Cartao de Credito',
            description: `Parcele em ate ${installmentOptions.length}x`,
            discount: 0,
            discountedAmountCents: input.amountCents,
            installmentOptions,
          },
          {
            id: PaymentMethod.BOLETO,
            label: 'Boleto Bancario',
            description: 'Vencimento em 3 dias uteis.',
            discount: 0,
            discountedAmountCents: input.amountCents,
          },
        ],
      }
    }),

  /**
   * Admin: list all payments in the system (with filters).
   */
  adminListAll: adminProcedure
    .input(
      z.object({
        purpose: z.nativeEnum(PaymentPurpose).optional(),
        status: z.nativeEnum(PaymentStatus).optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {}
      if (input.purpose) where.purpose = input.purpose
      if (input.status) where.status = input.status

      const [payments, total] = await Promise.all([
        ctx.db.payment.findMany({
          where,
          include: {
            order: { select: { id: true, patientId: true } },
            consultations: { select: { id: true, patientId: true, doctorId: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.db.payment.count({ where }),
      ])

      return { payments, total, pages: Math.ceil(total / input.limit) }
    }),

  // -------------------------------------------------------------------------
  // PayPal — checkout pra consulta
  // -------------------------------------------------------------------------

  /**
   * Cria uma ordem PayPal pra uma consulta e devolve o link de aprovação.
   * O paciente é redirecionado pra esse link; após pagar ele volta pro
   * /api/payments/paypal/return que captura a ordem e libera a consulta.
   */
  createConsultationPaypalCheckout: patientProcedure
    .input(z.object({ consultationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!paypalConfigured()) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'PayPal não está configurado (faltam credenciais no servidor).',
        })
      }

      // Verifica que a consulta é do paciente logado
      const patient = await ctx.db.patient.findUnique({
        where: { userId: ctx.session.userId },
        select: { id: true },
      })
      if (!patient) throw new TRPCError({ code: 'NOT_FOUND', message: 'Paciente não encontrado.' })

      const consultation = await ctx.db.consultation.findUnique({
        where: { id: input.consultationId },
        include: {
          doctor: { include: { user: { select: { fullName: true } } } },
        },
      })
      if (!consultation) throw new TRPCError({ code: 'NOT_FOUND' })
      if (consultation.patientId !== patient.id) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      // Se já pagou, não cria de novo
      const alreadyPaid = await ctx.db.payment.findFirst({
        where: {
          consultations: { some: { id: consultation.id } },
          status: PaymentStatus.SUCCEEDED,
        },
        select: { id: true },
      })
      if (alreadyPaid) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Esta consulta já foi paga.',
        })
      }

      const amountCents = consultation.priceCents || 8900
      const siteUrl = process.env.NEXTAUTH_URL || 'https://wisedrops-303.netlify.app'

      const order = await createPaypalOrder({
        amountCents,
        currency: 'BRL',
        description: `Consulta WiseDrops com Dr(a). ${consultation.doctor.user.fullName}`,
        referenceId: consultation.id,
        returnUrl: `${siteUrl}/api/payments/paypal/return?cid=${consultation.id}`,
        cancelUrl: `${siteUrl}/api/payments/paypal/cancel?cid=${consultation.id}`,
      })

      await ctx.db.payment.create({
        data: {
          purpose: PaymentPurpose.CONSULTATION,
          method: PaymentMethod.PAYPAL,
          status: PaymentStatus.PENDING,
          amountCents,
          consultations: { connect: { id: consultation.id } },
          metadata: { paypalOrderId: order.orderId },
        },
      })

      return { approveUrl: order.approveUrl, orderId: order.orderId }
    }),

  /**
   * Cria uma ordem PayPal pra um pedido de produto e devolve o link
   * de aprovação. O paciente é redirecionado pra esse link; após pagar,
   * o /api/payments/paypal/return-order captura e marca o Order como PAID.
   */
  createOrderPaypalCheckout: patientProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!paypalConfigured()) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'PayPal não está configurado (faltam credenciais no servidor).',
        })
      }

      const patient = await ctx.db.patient.findUnique({
        where: { userId: ctx.session.userId },
        select: { id: true },
      })
      if (!patient) throw new TRPCError({ code: 'NOT_FOUND' })

      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
        include: { items: { include: { product: true } } },
      })
      if (!order) throw new TRPCError({ code: 'NOT_FOUND' })
      if (order.patientId !== patient.id) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      if (order.status !== 'PENDING_PAYMENT') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Este pedido já foi pago ou está em outra etapa.',
        })
      }

      const siteUrl = process.env.NEXTAUTH_URL || 'https://wisedrops-303.netlify.app'
      const description = `Pedido WiseDrops #${order.id.slice(0, 8)} (${order.items.length} item)`

      const paypal = await createPaypalOrder({
        amountCents: order.totalCents,
        currency: 'BRL',
        description,
        referenceId: order.id,
        returnUrl: `${siteUrl}/api/payments/paypal/return-order?oid=${order.id}`,
        cancelUrl: `${siteUrl}/api/payments/paypal/cancel?oid=${order.id}`,
      })

      await ctx.db.payment.create({
        data: {
          orderId: order.id,
          purpose: PaymentPurpose.ORDER,
          method: PaymentMethod.PAYPAL,
          status: PaymentStatus.PENDING,
          amountCents: order.totalCents,
          metadata: { paypalOrderId: paypal.orderId },
        },
      })

      return { approveUrl: paypal.approveUrl, orderId: paypal.orderId }
    }),
})
