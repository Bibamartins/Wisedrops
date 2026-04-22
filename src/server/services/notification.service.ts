/**
 * Multi-Channel Notification Service
 *
 * Handles sending notifications across push, email, SMS, WhatsApp, and in-app channels.
 * Respects user preferences and quiet hours. Provides templated messages
 * for all core application events.
 */

import { db } from '@/server/db/client'
import {
  NotificationChannel,
  NotificationType,
  type Notification,
} from '@prisma/client'

// ---------------------------------------------------------------------------
// External SDK type stubs (real imports come from installed packages)
// ---------------------------------------------------------------------------

interface FCMClient {
  send(message: {
    token: string
    notification: { title: string; body: string }
    data?: Record<string, string>
  }): Promise<string>
}

interface ResendClient {
  emails: {
    send(params: {
      from: string
      to: string
      subject: string
      html: string
    }): Promise<{ id: string }>
  }
}

interface TwilioClient {
  messages: {
    create(params: {
      to: string
      from: string
      body: string
    }): Promise<{ sid: string }>
  }
}

interface WebSocketServer {
  to(userId: string): { emit(event: string, payload: unknown): void }
}

// ---------------------------------------------------------------------------
// Configuration (populated from env in production)
// ---------------------------------------------------------------------------

const config = {
  fcm: {
    // Firebase Admin SDK initialised elsewhere; we receive the messaging client
  },
  email: {
    from: process.env.EMAIL_FROM ?? 'WiseDrops <noreply@wisedrops.com.br>',
  },
  sms: {
    from: process.env.TWILIO_PHONE_NUMBER ?? '',
  },
  whatsapp: {
    from: process.env.TWILIO_WHATSAPP_NUMBER ?? 'whatsapp:+5511999999999',
  },
} as const

// ---------------------------------------------------------------------------
// Template System
// ---------------------------------------------------------------------------

export type TemplateKey =
  | 'APPOINTMENT_REMINDER'
  | 'DOSE_REMINDER'
  | 'ANVISA_STATUS'
  | 'ORDER_UPDATE'
  | 'PRESCRIPTION_READY'

interface TemplateData {
  APPOINTMENT_REMINDER: {
    patientName: string
    doctorName: string
    dateTime: string
    consultationType: string
    consultationId: string
  }
  DOSE_REMINDER: {
    patientName: string
    productName: string
    dosage: string
    instructions?: string
    treatmentPlanId: string
  }
  ANVISA_STATUS: {
    patientName: string
    protocol: string
    status: string
    detail?: string
  }
  ORDER_UPDATE: {
    patientName: string
    orderId: string
    status: string
    trackingCode?: string
    estimatedDelivery?: string
  }
  PRESCRIPTION_READY: {
    patientName: string
    doctorName: string
    prescriptionId: string
    validUntil: string
  }
}

interface RenderedTemplate {
  title: string
  body: string
  emailHtml: string
}

function renderTemplate<K extends TemplateKey>(
  key: K,
  data: TemplateData[K],
): RenderedTemplate {
  switch (key) {
    case 'APPOINTMENT_REMINDER': {
      const d = data as TemplateData['APPOINTMENT_REMINDER']
      return {
        title: 'Lembrete de Consulta',
        body: `Ola ${d.patientName}, sua consulta ${d.consultationType === 'VIDEO' ? 'por video' : d.consultationType === 'CHAT' ? 'por chat' : 'presencial'} com Dr(a). ${d.doctorName} esta agendada para ${d.dateTime}. Nao se atrase!`,
        emailHtml: buildEmailHtml(
          'Lembrete de Consulta',
          `<p>Ola <strong>${d.patientName}</strong>,</p>
           <p>Sua consulta ${d.consultationType === 'VIDEO' ? 'por video' : d.consultationType === 'CHAT' ? 'por chat' : 'presencial'} com <strong>Dr(a). ${d.doctorName}</strong> esta agendada para:</p>
           <p style="font-size:18px;font-weight:bold;color:#16a34a;">${d.dateTime}</p>
           <p>Acesse a plataforma com antecedencia para garantir que tudo funcione corretamente.</p>`,
        ),
      }
    }

    case 'DOSE_REMINDER': {
      const d = data as TemplateData['DOSE_REMINDER']
      return {
        title: 'Hora da sua dose',
        body: `${d.patientName}, esta na hora de tomar ${d.productName} - ${d.dosage}.${d.instructions ? ` ${d.instructions}` : ''}`,
        emailHtml: buildEmailHtml(
          'Lembrete de Dose',
          `<p>Ola <strong>${d.patientName}</strong>,</p>
           <p>Esta na hora da sua dose de <strong>${d.productName}</strong>.</p>
           <p>Dosagem: <strong>${d.dosage}</strong></p>
           ${d.instructions ? `<p>Instrucoes: ${d.instructions}</p>` : ''}
           <p>Registre a tomada no app para manter seu historico de adesao atualizado.</p>`,
        ),
      }
    }

    case 'ANVISA_STATUS': {
      const d = data as TemplateData['ANVISA_STATUS']
      const statusMap: Record<string, string> = {
        SUBMITTED: 'submetida',
        UNDER_ANALYSIS: 'em analise',
        APPROVED: 'aprovada',
        REJECTED: 'rejeitada',
      }
      return {
        title: 'Atualizacao ANVISA',
        body: `${d.patientName}, sua autorizacao ANVISA (${d.protocol}) foi ${statusMap[d.status] ?? d.status}.${d.detail ? ` ${d.detail}` : ''}`,
        emailHtml: buildEmailHtml(
          'Atualizacao da Autorizacao ANVISA',
          `<p>Ola <strong>${d.patientName}</strong>,</p>
           <p>Sua autorizacao ANVISA com protocolo <strong>${d.protocol}</strong> teve uma atualizacao de status:</p>
           <p style="font-size:16px;font-weight:bold;">Status: ${statusMap[d.status] ?? d.status}</p>
           ${d.detail ? `<p>${d.detail}</p>` : ''}
           <p>Acesse o app para mais detalhes.</p>`,
        ),
      }
    }

    case 'ORDER_UPDATE': {
      const d = data as TemplateData['ORDER_UPDATE']
      const orderStatusMap: Record<string, string> = {
        PAID: 'Pagamento confirmado',
        PROCESSING: 'Em processamento',
        SHIPPED: 'Enviado',
        IN_TRANSIT: 'Em transito',
        OUT_FOR_DELIVERY: 'Saiu para entrega',
        DELIVERED: 'Entregue',
        CANCELLED: 'Cancelado',
        REFUNDED: 'Reembolsado',
      }
      return {
        title: 'Atualizacao do Pedido',
        body: `${d.patientName}, seu pedido #${d.orderId.slice(0, 8)} esta: ${orderStatusMap[d.status] ?? d.status}.${d.trackingCode ? ` Rastreio: ${d.trackingCode}` : ''}`,
        emailHtml: buildEmailHtml(
          'Atualizacao do Seu Pedido',
          `<p>Ola <strong>${d.patientName}</strong>,</p>
           <p>Seu pedido <strong>#${d.orderId.slice(0, 8)}</strong> teve uma atualizacao:</p>
           <p style="font-size:16px;font-weight:bold;color:#16a34a;">${orderStatusMap[d.status] ?? d.status}</p>
           ${d.trackingCode ? `<p>Codigo de rastreio: <strong>${d.trackingCode}</strong></p>` : ''}
           ${d.estimatedDelivery ? `<p>Previsao de entrega: <strong>${d.estimatedDelivery}</strong></p>` : ''}`,
        ),
      }
    }

    case 'PRESCRIPTION_READY': {
      const d = data as TemplateData['PRESCRIPTION_READY']
      return {
        title: 'Receita Disponivel',
        body: `${d.patientName}, sua receita emitida por Dr(a). ${d.doctorName} esta disponivel. Valida ate ${d.validUntil}.`,
        emailHtml: buildEmailHtml(
          'Sua Receita Esta Pronta',
          `<p>Ola <strong>${d.patientName}</strong>,</p>
           <p>Dr(a). <strong>${d.doctorName}</strong> emitiu uma nova receita para voce.</p>
           <p>Validade: <strong>${d.validUntil}</strong></p>
           <p>Acesse o app para visualizar, baixar o PDF e, se desejar, pedir os produtos diretamente pela plataforma.</p>`,
        ),
      }
    }

    default: {
      const _exhaustive: never = key
      throw new Error(`Template desconhecido: ${_exhaustive}`)
    }
  }
}

function buildEmailHtml(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;margin-top:24px;">
    <tr><td style="background:#16a34a;padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;">WiseDrops</h1>
    </td></tr>
    <tr><td style="padding:32px;">
      <h2 style="margin:0 0 16px;color:#18181b;">${title}</h2>
      ${content}
    </td></tr>
    <tr><td style="padding:16px 32px;background:#f4f4f5;font-size:12px;color:#71717a;text-align:center;">
      WiseDrops - Cannabis Medicinal com Acompanhamento Inteligente<br>
      Este email foi enviado automaticamente. Nao responda.
    </td></tr>
  </table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Notification Type -> Template Key mapping
// ---------------------------------------------------------------------------

const notificationTypeToTemplate: Partial<Record<NotificationType, TemplateKey>> = {
  APPOINTMENT_REMINDER: 'APPOINTMENT_REMINDER',
  ADHERENCE_REMINDER: 'DOSE_REMINDER',
  ANVISA_STATUS_UPDATE: 'ANVISA_STATUS',
  ORDER_STATUS_UPDATE: 'ORDER_UPDATE',
  PRESCRIPTION_READY: 'PRESCRIPTION_READY',
}

// ---------------------------------------------------------------------------
// Channel senders (lazy-initialised singleton clients)
// ---------------------------------------------------------------------------

let fcmClient: FCMClient | null = null
let resendClient: ResendClient | null = null
let twilioClient: TwilioClient | null = null
let wsServer: WebSocketServer | null = null

function getFCM(): FCMClient {
  if (!fcmClient) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const admin = require('firebase-admin') as typeof import('firebase-admin')
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '{}'),
        ),
      })
    }
    fcmClient = admin.messaging() as unknown as FCMClient
  }
  return fcmClient
}

function getResend(): ResendClient {
  if (!resendClient) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Resend } = require('resend') as { Resend: new (key: string) => ResendClient }
    resendClient = new Resend(process.env.RESEND_API_KEY ?? '')
  }
  return resendClient
}

function getTwilio(): TwilioClient {
  if (!twilioClient) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const twilio = require('twilio') as (sid: string, token: string) => TwilioClient
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID ?? '',
      process.env.TWILIO_AUTH_TOKEN ?? '',
    )
  }
  return twilioClient
}

/** Must be called once during server startup with the Socket.IO / ws server. */
export function registerWebSocketServer(server: WebSocketServer): void {
  wsServer = server
}

// ---------------------------------------------------------------------------
// Individual channel senders
// ---------------------------------------------------------------------------

export async function sendPush(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  // Retrieve the user's FCM token (stored in a separate table or user metadata)
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  if (!user) return

  // In production we would query a device_tokens table. Simplified here.
  // const tokens = await db.deviceToken.findMany({ where: { userId } })
  const tokens: string[] = [] // placeholder

  const fcm = getFCM()
  const results = await Promise.allSettled(
    tokens.map((token) =>
      fcm.send({ token, notification: { title, body }, data }),
    ),
  )

  const failures = results.filter((r) => r.status === 'rejected')
  if (failures.length > 0) {
    console.error(`[Notification] FCM failures for user ${userId}:`, failures.length)
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const resend = getResend()
  try {
    await resend.emails.send({
      from: config.email.from,
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error('[Notification] Email send failed:', error)
    throw error
  }
}

export async function sendSMS(
  to: string,
  body: string,
): Promise<void> {
  const twilio = getTwilio()
  try {
    await twilio.messages.create({
      to,
      from: config.sms.from,
      body,
    })
  } catch (error) {
    console.error('[Notification] SMS send failed:', error)
    throw error
  }
}

export async function sendWhatsApp(
  to: string,
  body: string,
): Promise<void> {
  const twilio = getTwilio()
  try {
    await twilio.messages.create({
      to: `whatsapp:${to}`,
      from: config.whatsapp.from,
      body,
    })
  } catch (error) {
    console.error('[Notification] WhatsApp send failed:', error)
    throw error
  }
}

export async function sendInApp(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<Notification> {
  const notification = await db.notification.create({
    data: {
      userId,
      type,
      channel: NotificationChannel.IN_APP,
      title,
      body,
      data: data ?? undefined,
      sentAt: new Date(),
    },
  })

  // Push via WebSocket if available
  if (wsServer) {
    wsServer.to(userId).emit('notification', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      createdAt: notification.createdAt,
    })
  }

  return notification
}

// ---------------------------------------------------------------------------
// Quiet Hours Check
// ---------------------------------------------------------------------------

function isWithinQuietHours(
  quietStart: string | null | undefined,
  quietEnd: string | null | undefined,
): boolean {
  if (!quietStart || !quietEnd) return false

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const [startH, startM] = quietStart.split(':').map(Number)
  const [endH, endM] = quietEnd.split(':').map(Number)
  const startMinutes = (startH ?? 0) * 60 + (startM ?? 0)
  const endMinutes = (endH ?? 0) * 60 + (endM ?? 0)

  // Handle overnight quiet hours (e.g., 22:00 - 07:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

// ---------------------------------------------------------------------------
// Dispatch - Main entry point
// ---------------------------------------------------------------------------

export interface DispatchOptions {
  userId: string
  type: NotificationType
  templateKey?: TemplateKey
  templateData?: Record<string, unknown>
  /** Override title (used when not using templates) */
  title?: string
  /** Override body */
  body?: string
  /** Extra data payload */
  data?: Record<string, unknown>
  /** Force send even during quiet hours */
  urgent?: boolean
}

/**
 * Dispatch a notification respecting the user's channel preferences and quiet hours.
 *
 * 1. Resolve template (if templateKey provided)
 * 2. Load user preferences for this notification type
 * 3. Check quiet hours (skip non-urgent if within quiet window)
 * 4. Send to each enabled channel
 * 5. Record results in DB
 */
export async function dispatch(options: DispatchOptions): Promise<void> {
  const {
    userId,
    type,
    templateKey,
    templateData,
    data,
    urgent = false,
  } = options

  // 1. Resolve content
  let title = options.title ?? ''
  let body = options.body ?? ''
  let emailHtml = ''

  if (templateKey && templateData) {
    const rendered = renderTemplate(templateKey, templateData as never)
    title = title || rendered.title
    body = body || rendered.body
    emailHtml = rendered.emailHtml
  }

  if (!title || !body) {
    console.error('[Notification] dispatch called without title/body and no valid template')
    return
  }

  // 2. Load user + preferences
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, phone: true },
  })

  if (!user) {
    console.error(`[Notification] User ${userId} not found`)
    return
  }

  const preference = await db.notificationPreference.findUnique({
    where: { userId_notificationType: { userId, notificationType: type } },
  })

  // Default channels if no preference stored
  const enabledChannels: NotificationChannel[] =
    preference?.enabledChannels ?? [NotificationChannel.IN_APP, NotificationChannel.PUSH]

  // 3. Check quiet hours (in-app is always allowed)
  const inQuietHours = isWithinQuietHours(
    preference?.quietHoursStart,
    preference?.quietHoursEnd,
  )

  const channelsToSend = enabledChannels.filter((ch) => {
    if (ch === NotificationChannel.IN_APP) return true
    if (inQuietHours && !urgent) return false
    return true
  })

  // 4. Send to each channel
  const sendPromises = channelsToSend.map(async (channel) => {
    try {
      switch (channel) {
        case NotificationChannel.PUSH:
          await sendPush(userId, title, body, data ? Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)]),
          ) : undefined)
          break

        case NotificationChannel.EMAIL:
          await sendEmail(
            user.email,
            title,
            emailHtml || buildEmailHtml(title, `<p>${body}</p>`),
          )
          break

        case NotificationChannel.SMS:
          if (user.phone) {
            await sendSMS(user.phone, `${title}: ${body}`)
          }
          break

        case NotificationChannel.WHATSAPP:
          if (user.phone) {
            await sendWhatsApp(user.phone, `*${title}*\n\n${body}`)
          }
          break

        case NotificationChannel.IN_APP:
          await sendInApp(userId, type, title, body, data)
          break
      }

      // Record success (non-IN_APP; IN_APP already recorded in sendInApp)
      if (channel !== NotificationChannel.IN_APP) {
        await db.notification.create({
          data: {
            userId,
            type,
            channel,
            title,
            body,
            data: data ?? undefined,
            sentAt: new Date(),
          },
        })
      }
    } catch (error) {
      console.error(`[Notification] Failed on channel ${channel} for user ${userId}:`, error)
      await db.notification.create({
        data: {
          userId,
          type,
          channel,
          title,
          body,
          data: data ?? undefined,
          failedAt: new Date(),
          failReason: error instanceof Error ? error.message : String(error),
        },
      })
    }
  })

  await Promise.allSettled(sendPromises)
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

export class NotificationService {
  static dispatch = dispatch
  static sendPush = sendPush
  static sendEmail = sendEmail
  static sendSMS = sendSMS
  static sendWhatsApp = sendWhatsApp
  static sendInApp = sendInApp
  static registerWebSocketServer = registerWebSocketServer
  static renderTemplate = renderTemplate

  /** Shorthand for appointment reminder */
  static async notifyAppointmentReminder(
    userId: string,
    data: TemplateData['APPOINTMENT_REMINDER'],
  ): Promise<void> {
    await dispatch({
      userId,
      type: NotificationType.APPOINTMENT_REMINDER,
      templateKey: 'APPOINTMENT_REMINDER',
      templateData: data,
      data: { consultationId: data.consultationId },
    })
  }

  /** Shorthand for dose reminder */
  static async notifyDoseReminder(
    userId: string,
    data: TemplateData['DOSE_REMINDER'],
  ): Promise<void> {
    await dispatch({
      userId,
      type: NotificationType.ADHERENCE_REMINDER,
      templateKey: 'DOSE_REMINDER',
      templateData: data,
      data: { treatmentPlanId: data.treatmentPlanId },
    })
  }

  /** Shorthand for ANVISA status */
  static async notifyAnvisaStatus(
    userId: string,
    data: TemplateData['ANVISA_STATUS'],
  ): Promise<void> {
    await dispatch({
      userId,
      type: NotificationType.ANVISA_STATUS_UPDATE,
      templateKey: 'ANVISA_STATUS',
      templateData: data,
      urgent: data.status === 'APPROVED' || data.status === 'REJECTED',
    })
  }

  /** Shorthand for order update */
  static async notifyOrderUpdate(
    userId: string,
    data: TemplateData['ORDER_UPDATE'],
  ): Promise<void> {
    await dispatch({
      userId,
      type: NotificationType.ORDER_STATUS_UPDATE,
      templateKey: 'ORDER_UPDATE',
      templateData: data,
      data: { orderId: data.orderId },
    })
  }

  /** Shorthand for prescription ready */
  static async notifyPrescriptionReady(
    userId: string,
    data: TemplateData['PRESCRIPTION_READY'],
  ): Promise<void> {
    await dispatch({
      userId,
      type: NotificationType.PRESCRIPTION_READY,
      templateKey: 'PRESCRIPTION_READY',
      templateData: data,
      data: { prescriptionId: data.prescriptionId },
    })
  }
}
