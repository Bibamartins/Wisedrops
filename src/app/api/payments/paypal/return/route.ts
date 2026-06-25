/**
 * GET /api/payments/paypal/return?token=PAYPAL_ORDER_ID&PayerID=...&cid=CONSULTATION_ID
 * PayPal redireciona pra cá após o pagamento. Aqui a gente CAPTURA a ordem,
 * marca o Payment como SUCCEEDED e dispara:
 *  - e-mail pra paciente confirmando agendamento
 *  - e-mail pro médico avisando da nova consulta paga
 *  - sync HubSpot (lifecycle, deal stage)
 * Em seguida redireciona pro app.
 */
import type { NextRequest } from 'next/server'
import { db } from '@/server/db/client'
import { capturePaypalOrder } from '@/server/services/paypal.service'
import {
  sendPatientConsultationConfirmedEmail,
  sendDoctorNewConsultationEmail,
} from '@/server/services/email.service'
import { PaymentStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXTAUTH_URL || 'https://wisedrops.netlify.app'

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

    // Em caso de sucesso: dispara comunicação + sync (best-effort, nunca bloqueia)
    if (success && cid) {
      const consultation = await db.consultation.findUnique({
        where: { id: cid },
        include: {
          patient: { include: { user: { select: { fullName: true, email: true } } } },
          doctor:  { include: { user: { select: { fullName: true, email: true } } } },
        },
      })

      if (consultation) {
        const patientName = consultation.patient.user.fullName
        const patientEmail = consultation.patient.user.email
        const doctorName = consultation.doctor.user.fullName
        const doctorEmail = consultation.doctor.user.email

        const hasQuiz = await db.patientQuiz.count({ where: { patientId: consultation.patientId } })

        await Promise.allSettled([
          sendPatientConsultationConfirmedEmail({
            patientEmail,
            patientName,
            doctorName,
            scheduledAt: consultation.scheduledAt,
            consultationId: consultation.id,
          }),
          sendDoctorNewConsultationEmail({
            doctorEmail,
            doctorName,
            patientName,
            patientHasQuiz: hasQuiz > 0,
            scheduledAt: consultation.scheduledAt,
            consultationId: consultation.id,
          }),
        ])

        // HubSpot — move deal pra "Paga" (best-effort; ignora se serviço/token ausente)
        try {
          const { moveConsultationDealStage } = await import('@/server/services/hubspot.service')
          await moveConsultationDealStage({
            patientEmail,
            consultationId: consultation.id,
            stage: 'PAID',
          })
        } catch (e) {
          console.log('[paypal/return] hubspot sync skipped:', (e as Error).message)
        }
      }
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
