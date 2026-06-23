/**
 * GET /api/payments/paypal/return-order?token=PAYPAL_ORDER_ID&oid=ORDER_ID
 * PayPal redireciona pra cá após o pagamento de um pedido de produtos.
 * Captura a ordem, atualiza o Payment + Order (PAID), e redireciona pra /orders.
 */
import type { NextRequest } from 'next/server'
import { db } from '@/server/db/client'
import { capturePaypalOrder } from '@/server/services/paypal.service'
import { sendPatientOrderConfirmedEmail } from '@/server/services/email.service'
import { PaymentStatus, OrderStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXTAUTH_URL || 'https://wisedrops-303.netlify.app'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const paypalOrderId = url.searchParams.get('token')
  const orderId = url.searchParams.get('oid')

  if (!paypalOrderId) {
    return Response.redirect(`${SITE}/orders?payment=error&reason=missing_token`, 302)
  }

  const payment = await db.payment.findFirst({
    where: {
      method: 'PAYPAL',
      metadata: { path: ['paypalOrderId'], equals: paypalOrderId },
    },
  })

  try {
    const result = await capturePaypalOrder(paypalOrderId)
    const success = result.status === 'COMPLETED'

    if (payment) {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: success ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
          paidAt: success ? new Date() : undefined,
          metadata: {
            paypalOrderId,
            paypalCaptureId: result.captureId,
            paypalPayerEmail: result.payerEmail,
            paypalStatus: result.status,
          },
        },
      })
    }

    if (success && orderId) {
      // Update order status PENDING_PAYMENT → PAID + record history
      await db.$transaction(async (tx) => {
        const ord = await tx.order.findUnique({ where: { id: orderId } })
        if (ord && ord.status === OrderStatus.PENDING_PAYMENT) {
          await tx.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.PAID },
          })
          await tx.orderStatusHistory.create({
            data: {
              orderId,
              status: OrderStatus.PAID,
              note: `Pagamento confirmado via PayPal (${paypalOrderId.slice(0, 8)})`,
            },
          })
        }
      })

      // Comunicação + HubSpot sync (best-effort)
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: { patient: { include: { user: { select: { fullName: true, email: true } } } } },
      })
      if (order) {
        const patientName = order.patient.user.fullName
        const patientEmail = order.patient.user.email

        await Promise.allSettled([
          sendPatientOrderConfirmedEmail({
            patientEmail,
            patientName,
            orderId: order.id,
            totalCents: order.totalCents,
          }),
        ])

        try {
          const { moveOrderDealStage } = await import('@/server/services/hubspot.service')
          await moveOrderDealStage({ patientEmail, orderId: order.id, stage: 'PAID' })
        } catch (e) {
          console.log('[paypal/return-order] hubspot sync skipped:', (e as Error).message)
        }
      }
    }

    const redirect = success
      ? `${SITE}/orders?payment=success${orderId ? `&oid=${orderId}` : ''}`
      : `${SITE}/orders?payment=error&reason=${encodeURIComponent(result.status)}`
    return Response.redirect(redirect, 302)
  } catch (err) {
    console.error('[paypal/return-order] capture failed:', err)
    if (payment) {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      })
    }
    return Response.redirect(`${SITE}/orders?payment=error&reason=capture_failed`, 302)
  }
}
