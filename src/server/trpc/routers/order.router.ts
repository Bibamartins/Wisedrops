/**
 * Order tRPC Router
 *
 * Manages cannabis product orders: creation, status tracking,
 * cancellation, and admin status updates.
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import {
  createTRPCRouter,
  protectedProcedure,
  patientProcedure,
  adminProcedure,
} from '../trpc'
import { OrderStatus, PrescriptionStatus } from '@prisma/client'
import { NotificationService } from '@/server/services/notification.service'
import { PrescriptionService } from '@/server/services/prescription.service'
import { createOrderDeal, moveOrderDealStage } from '@/server/services/hubspot.service'

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createOrderSchema = z.object({
  prescriptionId: z.string().uuid(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1, 'Adicione ao menos um produto ao pedido.'),
  shippingAddress: z.object({
    street: z.string().min(1),
    number: z.string().min(1),
    complement: z.string().optional(),
    neighborhood: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    zipCode: z.string().regex(/^\d{8}$/, 'CEP invalido'),
  }),
  notes: z.string().max(500).optional(),
})

const listOrdersSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
})

const cancelOrderSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(5, 'Informe o motivo do cancelamento.').max(500),
})

const updateStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.nativeEnum(OrderStatus),
  trackingCode: z.string().optional(),
  trackingCarrier: z.string().optional(),
  estimatedDelivery: z.string().datetime().optional(),
  note: z.string().max(500).optional(),
})

// ---------------------------------------------------------------------------
// Cancellable statuses
// ---------------------------------------------------------------------------

const PATIENT_CANCELLABLE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
]

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const orderRouter = createTRPCRouter({
  /**
   * Create a new order from a valid prescription.
   */
  create: patientProcedure
    .input(createOrderSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Validate prescription
      const validity = await PrescriptionService.checkPrescriptionValidity(
        input.prescriptionId,
      )

      if (!validity.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: validity.reason ?? 'Receita invalida.',
        })
      }

      // 2. Verify prescription belongs to this patient
      const prescription = await ctx.db.prescription.findUnique({
        where: { id: input.prescriptionId },
        include: { patient: true },
      })

      if (!prescription) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Receita nao encontrada.' })
      }

      if (prescription.patient.userId !== ctx.session.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Esta receita nao pertence a voce.',
        })
      }

      // 3. Validate products and calculate prices
      const productIds = input.items.map((i) => i.productId)
      const products = await ctx.db.product.findMany({
        where: { id: { in: productIds }, isAvailable: true },
      })

      if (products.length !== productIds.length) {
        const foundIds = new Set(products.map((p) => p.id))
        const missing = productIds.filter((id) => !foundIds.has(id))
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Produto(s) indisponivel(is): ${missing.join(', ')}`,
        })
      }

      // Check stock
      const productMap = new Map(products.map((p) => [p.id, p]))
      for (const item of input.items) {
        const product = productMap.get(item.productId)!
        if (product.stockQuantity < item.quantity) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Estoque insuficiente para "${product.name}". Disponivel: ${product.stockQuantity}.`,
          })
        }
      }

      // 4. Calculate totals
      const orderItems = input.items.map((item) => {
        const product = productMap.get(item.productId)!
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPriceCents: product.priceCents,
          totalCents: product.priceCents * item.quantity,
        }
      })

      const subtotalCents = orderItems.reduce((sum, i) => sum + i.totalCents, 0)
      const shippingCents = calculateShipping(input.shippingAddress.state)
      const totalCents = subtotalCents + shippingCents

      // 5. Create order in a transaction
      const order = await ctx.db.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            patientId: prescription.patientId,
            prescriptionId: input.prescriptionId,
            status: OrderStatus.PENDING_PAYMENT,
            subtotalCents,
            shippingCents,
            discountCents: 0,
            totalCents,
            shippingAddress: input.shippingAddress,
            notes: input.notes,
            items: {
              create: orderItems,
            },
          },
          include: { items: { include: { product: true } } },
        })

        // Record initial status in history
        await tx.orderStatusHistory.create({
          data: {
            orderId: newOrder.id,
            status: OrderStatus.PENDING_PAYMENT,
            note: 'Pedido criado. Aguardando pagamento.',
          },
        })

        // Reserve stock
        for (const item of input.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { decrement: item.quantity } },
          })
        }

        return newOrder
      })

      // 6. Audit log
      await ctx.db.auditLog.create({
        data: {
          userId: ctx.session.userId,
          action: 'order.create',
          entityType: 'order',
          entityId: order.id,
          metadata: { totalCents, itemCount: input.items.length },
        },
      })

      // 7. HubSpot — cria deal "Pedido Criado" (best-effort)
      const patientUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.userId },
        select: { email: true, fullName: true },
      })
      if (patientUser) {
        await Promise.allSettled([
          createOrderDeal({
            patientEmail: patientUser.email,
            patientName: patientUser.fullName,
            orderId: order.id,
            totalCents,
            stage: 'CREATED',
          }),
        ])
      }

      return order
    }),

  /**
   * Get a specific order by ID. Patients can only see their own orders.
   */
  getById: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
        include: {
          items: { include: { product: true } },
          patient: { include: { user: { select: { id: true, fullName: true, email: true } } } },
          prescription: {
            select: { id: true, prescriptionType: true, validUntil: true, doctorId: true },
          },
          statusHistory: { orderBy: { createdAt: 'desc' } },
          payments: { orderBy: { createdAt: 'desc' } },
        },
      })

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido nao encontrado.' })
      }

      // Access control: patients can only see their own orders
      if (
        ctx.session.role === 'PATIENT' &&
        order.patient.user.id !== ctx.session.userId
      ) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' })
      }

      return order
    }),

  /**
   * List orders for the authenticated patient.
   */
  listForPatient: patientProcedure
    .input(listOrdersSchema)
    .query(async ({ ctx, input }) => {
      // Get patientId from user
      const patient = await ctx.db.patient.findUnique({
        where: { userId: ctx.session.userId },
        select: { id: true },
      })

      if (!patient) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Perfil de paciente nao encontrado.' })
      }

      const where = {
        patientId: patient.id,
        ...(input.status && { status: input.status }),
      }

      const [orders, total] = await Promise.all([
        ctx.db.order.findMany({
          where,
          include: {
            items: { include: { product: { select: { name: true, imageUrls: true } } } },
            statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.db.order.count({ where }),
      ])

      return {
        orders,
        total,
        pages: Math.ceil(total / input.limit),
        currentPage: input.page,
      }
    }),

  /**
   * Cancel an order. Patients can only cancel orders in early statuses.
   */
  cancel: patientProcedure
    .input(cancelOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const patient = await ctx.db.patient.findUnique({
        where: { userId: ctx.session.userId },
        select: { id: true },
      })

      if (!patient) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Perfil de paciente nao encontrado.' })
      }

      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
        include: { items: true },
      })

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido nao encontrado.' })
      }

      if (order.patientId !== patient.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Este pedido nao pertence a voce.' })
      }

      if (!PATIENT_CANCELLABLE_STATUSES.includes(order.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este pedido nao pode mais ser cancelado. Entre em contato com o suporte.',
        })
      }

      // Cancel in transaction: update status + restore stock
      await ctx.db.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED },
        })

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: OrderStatus.CANCELLED,
            note: `Cancelado pelo paciente: ${input.reason}`,
          },
        })

        // Restore stock
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          })
        }
      })

      // Audit
      await ctx.db.auditLog.create({
        data: {
          userId: ctx.session.userId,
          action: 'order.cancel',
          entityType: 'order',
          entityId: order.id,
          metadata: { reason: input.reason },
        },
      })

      // HubSpot — move deal pra Cancelado (best-effort)
      const patientUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.userId },
        select: { email: true },
      })
      if (patientUser) {
        await Promise.allSettled([
          moveOrderDealStage({
            patientEmail: patientUser.email,
            orderId: order.id,
            stage: 'CANCELLED',
          }),
        ])
      }

      return { success: true }
    }),

  /**
   * Get tracking information for an order.
   */
  getTracking: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
        include: {
          patient: { select: { userId: true } },
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      })

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido nao encontrado.' })
      }

      // Access control
      if (
        ctx.session.role === 'PATIENT' &&
        order.patient.userId !== ctx.session.userId
      ) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' })
      }

      return {
        orderId: order.id,
        currentStatus: order.status,
        trackingCode: order.trackingCode,
        trackingCarrier: order.trackingCarrier,
        estimatedDelivery: order.estimatedDelivery,
        deliveredAt: order.deliveredAt,
        history: order.statusHistory.map((h) => ({
          status: h.status,
          note: h.note,
          timestamp: h.createdAt,
        })),
      }
    }),

  /**
   * Update order status (admin / pharmacy manager only).
   */
  updateStatus: adminProcedure
    .input(updateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
        include: {
          patient: { include: { user: { select: { id: true, fullName: true } } } },
        },
      })

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido nao encontrado.' })
      }

      // Validate status transition
      validateStatusTransition(order.status, input.status)

      // Update order
      const updateData: Record<string, unknown> = {
        status: input.status,
      }

      if (input.trackingCode) updateData.trackingCode = input.trackingCode
      if (input.trackingCarrier) updateData.trackingCarrier = input.trackingCarrier
      if (input.estimatedDelivery) updateData.estimatedDelivery = new Date(input.estimatedDelivery)
      if (input.status === OrderStatus.DELIVERED) updateData.deliveredAt = new Date()

      await ctx.db.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: input.orderId },
          data: updateData,
        })

        await tx.orderStatusHistory.create({
          data: {
            orderId: input.orderId,
            status: input.status,
            note: input.note ?? null,
          },
        })

        // Mark prescription as dispensed if order is shipped
        if (input.status === OrderStatus.SHIPPED) {
          await tx.prescription.update({
            where: { id: order.prescriptionId },
            data: { status: PrescriptionStatus.DISPENSED },
          })
        }
      })

      // Notify patient
      await NotificationService.notifyOrderUpdate(order.patient.user.id, {
        patientName: order.patient.user.fullName,
        orderId: order.id,
        status: input.status,
        trackingCode: input.trackingCode,
        estimatedDelivery: input.estimatedDelivery
          ? new Date(input.estimatedDelivery).toLocaleDateString('pt-BR')
          : undefined,
      }).catch(console.error)

      // HubSpot — move deal pra estágio correspondente (best-effort)
      const stageMap: Partial<Record<OrderStatus, 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'>> = {
        [OrderStatus.PAID]: 'PAID',
        [OrderStatus.PROCESSING]: 'PROCESSING',
        [OrderStatus.AWAITING_ANVISA]: 'PROCESSING',
        [OrderStatus.ANVISA_APPROVED]: 'PROCESSING',
        [OrderStatus.SHIPPED]: 'SHIPPED',
        [OrderStatus.IN_TRANSIT]: 'SHIPPED',
        [OrderStatus.OUT_FOR_DELIVERY]: 'SHIPPED',
        [OrderStatus.DELIVERED]: 'DELIVERED',
        [OrderStatus.CANCELLED]: 'CANCELLED',
        [OrderStatus.REFUNDED]: 'CANCELLED',
      }
      const targetStage = stageMap[input.status]
      if (targetStage) {
        const patientUser = await ctx.db.user.findUnique({
          where: { id: order.patient.user.id },
          select: { email: true },
        })
        if (patientUser) {
          await Promise.allSettled([
            moveOrderDealStage({
              patientEmail: patientUser.email,
              orderId: order.id,
              stage: targetStage,
            }),
          ])
        }
      }

      // Audit
      await ctx.db.auditLog.create({
        data: {
          userId: ctx.session.userId,
          action: 'order.updateStatus',
          entityType: 'order',
          entityId: input.orderId,
          metadata: { fromStatus: order.status, toStatus: input.status },
        },
      })

      return { success: true }
    }),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Flat shipping cost based on state (simplified). */
function calculateShipping(state: string): number {
  // Free shipping for Sao Paulo
  if (state === 'SP') return 0

  const southeastStates = ['RJ', 'MG', 'ES']
  if (southeastStates.includes(state)) return 1990 // R$19,90

  const southStates = ['PR', 'SC', 'RS']
  if (southStates.includes(state)) return 2490 // R$24,90

  // Other regions
  return 3990 // R$39,90
}

/** Valid order status transitions. */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: [OrderStatus.PAID, OrderStatus.CANCELLED],
  PAID: [OrderStatus.PROCESSING, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
  PROCESSING: [OrderStatus.AWAITING_ANVISA, OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  AWAITING_ANVISA: [OrderStatus.ANVISA_APPROVED, OrderStatus.CANCELLED],
  ANVISA_APPROVED: [OrderStatus.PROCESSING, OrderStatus.SHIPPED],
  SHIPPED: [OrderStatus.IN_TRANSIT],
  IN_TRANSIT: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
  DELIVERED: [OrderStatus.REFUNDED],
  CANCELLED: [],
  REFUNDED: [],
}

function validateStatusTransition(from: OrderStatus, to: OrderStatus): void {
  const allowed = VALID_TRANSITIONS[from]
  if (!allowed || !allowed.includes(to)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Transicao de status invalida: ${from} -> ${to}.`,
    })
  }
}
