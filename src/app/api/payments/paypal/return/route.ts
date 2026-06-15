/**
 * GET /api/payments/paypal/return?token=PAYPAL_ORDER_ID&PayerID=...&cid=CONSULTATION_ID
 * PayPal redireciona pra cá após o pagamento. Aqui a gente CAPTURA a ordem
 * e marca o Payment como SUCCEEDED. Em seguida redireciona pro app.
 */
import type { NextRequest } from 'next/server'
import { db } from '@/server/db/client'
import { capturePaypalOrder } from '@/server/services/paypal.service'
import { PaymentStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXTAUTH_URL || 'https://wisedrops-303.netlify.app'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')
  const cid = url.searchParams.get('cid')

  if (!orderId) {
    return Response.redirect(`${SITE}/consultations?payment=error&reason=missing_token`, 302)
  }

  // Encontra o Payment correspondente
  const payment = await db.payment.findFirst({
    where: {
      method: 'PAYPAL',
      metadata: { path: ['paypalOrderId'], equals: orderId },
    },
  })

  try {
    const result = await capturePaypalOrder(orderId)
    const success = result.status === 'COMPLETED'

    if (payment) {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: success ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
          paidAt: success ? new Date() : undefined,
          metadata: {
            paypalOrderId: orderId,
            paypalCaptureId: result.captureId,
            paypalPayerEmail: result.payerEmail,
            paypalStatus: result.status,
          },
        },
      })
    }

    const redirect = success
      ? `${SITE}/consultations?payment=success${cid ? `&cid=${cid}` : ''}`
      : `${SITE}/consultations?payment=error&reason=${encodeURIComponent(result.status)}`
    return Response.redirect(redirect, 302)
  } catch (err) {
    console.error('[paypal/return] capture failed:', err)
    if (payment) {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      })
    }
    return Response.redirect(
      `${SITE}/consultations?payment=error&reason=capture_failed`,
      302,
    )
  }
}
