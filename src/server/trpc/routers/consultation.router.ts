import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, patientProcedure, doctorProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { ConsultationStatus, ConsultationType } from '@prisma/client'
import { createRoom, generateToken } from '@/server/services/video.service'
import { sendEmail } from '@/server/services/notification.service'

// ---------------------------------------------------------------------------
// Helper: post-booking side effects (video room + emails)
// Fire-and-forget — booking succeeds even if these fail.
// ---------------------------------------------------------------------------
async function runBookingSideEffects(consultationId: string): Promise<void> {
  // Look up full consultation + user info
  const consultation = await (await import('@/server/db/client')).db.consultation.findUnique({
    where: { id: consultationId },
    include: {
      patient: { include: { user: { select: { email: true, fullName: true } } } },
      doctor: { include: { user: { select: { email: true, fullName: true } } } },
    },
  })
  if (!consultation) return

  const scheduledBR = new Date(consultation.scheduledAt).toLocaleString('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  })

  // 1) Create Daily.co room (writes videoRoomId back to consultation)
  if (process.env.DAILY_API_KEY && process.env.DAILY_API_KEY !== 'daily_placeholder') {
    try {
      await createRoom(consultation.id)
    } catch (err) {
      console.error('[booking] Daily.co room creation failed:', err)
    }
  }

  // 2) Email the doctor
  const doctorEmail = consultation.doctor.user.email
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_placeholder' && doctorEmail) {
    try {
      await sendEmail(
        doctorEmail,
        `Nova consulta agendada — ${consultation.patient.user.fullName}`,
        `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg,#F97316,#EA580C); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0;">WiseDrops</h1>
          </div>
          <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #111;">Nova consulta agendada</h2>
            <p>Ola Dr(a). <strong>${consultation.doctor.user.fullName}</strong>,</p>
            <p><strong>${consultation.patient.user.fullName}</strong> agendou uma consulta com voce.</p>
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0;"><strong>📅 Data:</strong> ${scheduledBR}</p>
              <p style="margin: 8px 0 0;"><strong>🎥 Tipo:</strong> ${consultation.type === 'VIDEO' ? 'Video' : 'Presencial'}</p>
              ${consultation.chiefComplaint ? `<p style="margin: 8px 0 0;"><strong>💬 Queixa:</strong> ${consultation.chiefComplaint}</p>` : ''}
            </div>
            <p style="color: #6b7280; font-size: 14px;">Acesse seu portal medico para revisar a agenda completa.</p>
          </div>
        </div>`
      )
    } catch (err) {
      console.error('[booking] Doctor email failed:', err)
    }
  }

  // 3) Email the patient (confirmation)
  const patientEmail = consultation.patient.user.email
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_placeholder' && patientEmail) {
    try {
      await sendEmail(
        patientEmail,
        `Consulta confirmada com ${consultation.doctor.user.fullName}`,
        `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg,#F97316,#EA580C); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0;">WiseDrops</h1>
          </div>
          <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #111;">Consulta confirmada! 🎉</h2>
            <p>Ola <strong>${consultation.patient.user.fullName}</strong>,</p>
            <p>Sua consulta foi agendada com sucesso.</p>
            <div style="background: #fff7ed; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0;"><strong>👨‍⚕️ Medico:</strong> ${consultation.doctor.user.fullName}</p>
              <p style="margin: 8px 0 0;"><strong>📅 Data:</strong> ${scheduledBR}</p>
              <p style="margin: 8px 0 0;"><strong>🎥 Tipo:</strong> ${consultation.type === 'VIDEO' ? 'Video' : 'Presencial'}</p>
            </div>
            <p>Voce recebera um lembrete 24h antes. Na hora da consulta, acesse seu portal e clique em "Entrar na consulta".</p>
            <p style="color: #6b7280; font-size: 14px;">Precisa reagendar? Entre no portal e use a opcao "Cancelar" antes da data.</p>
          </div>
        </div>`
      )
    } catch (err) {
      console.error('[booking] Patient email failed:', err)
    }
  }
}

export const consultationRouter = createTRPCRouter({
  // Get available slots for a doctor on a specific date
  getAvailableSlots: protectedProcedure
    .input(z.object({
      doctorId: z.string().uuid(),
      date: z.string(), // YYYY-MM-DD
    }))
    .query(async ({ ctx, input }) => {
      const doctor = await ctx.db.doctor.findUnique({
        where: { id: input.doctorId },
        include: { availability: true },
      })
      if (!doctor) throw new TRPCError({ code: 'NOT_FOUND', message: 'Medico nao encontrado' })

      const date = new Date(input.date)
      const dayOfWeek = date.getDay()

      // Get doctor's availability for this day of week
      const dayAvailability = doctor.availability.filter(
        (a) => a.dayOfWeek === dayOfWeek && a.isActive
      )
      if (dayAvailability.length === 0) return []

      // Get existing consultations for this date
      const startOfDay = new Date(input.date + 'T00:00:00')
      const endOfDay = new Date(input.date + 'T23:59:59')

      const existingConsultations = await ctx.db.consultation.findMany({
        where: {
          doctorId: input.doctorId,
          scheduledAt: { gte: startOfDay, lte: endOfDay },
          status: { notIn: [ConsultationStatus.CANCELLED, ConsultationStatus.NO_SHOW] },
        },
      })

      const bookedTimes = new Set(
        existingConsultations.map((c) => c.scheduledAt.toISOString())
      )

      // Generate available slots
      const slots: string[] = []
      for (const avail of dayAvailability) {
        const [startH, startM] = avail.startTime.split(':').map(Number)
        const [endH, endM] = avail.endTime.split(':').map(Number)
        const startMinutes = startH * 60 + startM
        const endMinutes = endH * 60 + endM

        for (let m = startMinutes; m < endMinutes; m += avail.slotDurationMinutes) {
          const hour = Math.floor(m / 60)
          const minute = m % 60
          const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          const slotDate = new Date(`${input.date}T${slotTime}:00`)

          if (!bookedTimes.has(slotDate.toISOString()) && slotDate > new Date()) {
            slots.push(slotTime)
          }
        }
      }

      return slots
    }),

  // Book a consultation
  book: patientProcedure
    .input(z.object({
      doctorId: z.string().uuid(),
      scheduledAt: z.string().datetime(),
      type: z.nativeEnum(ConsultationType).default(ConsultationType.VIDEO),
      chiefComplaint: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const patient = await ctx.db.patient.findUnique({
        where: { userId: ctx.session.userId },
      })
      if (!patient) throw new TRPCError({ code: 'NOT_FOUND', message: 'Perfil de paciente nao encontrado' })

      const doctor = await ctx.db.doctor.findUnique({
        where: { id: input.doctorId },
      })
      if (!doctor) throw new TRPCError({ code: 'NOT_FOUND', message: 'Medico nao encontrado' })
      if (!doctor.isAcceptingPatients) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Medico nao esta aceitando pacientes no momento' })
      }

      const consultation = await ctx.db.consultation.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          type: input.type,
          scheduledAt: new Date(input.scheduledAt),
          chiefComplaint: input.chiefComplaint,
          priceCents: doctor.consultationPriceCents,
        },
      })

      // Fire-and-forget side effects: create Daily.co room + send emails
      // Booking response is returned immediately even if these fail.
      runBookingSideEffects(consultation.id).catch((err) =>
        console.error('[booking] side effects failed:', err)
      )

      return consultation
    }),

  // Get per-user Daily.co meeting token for joining a consultation's video room
  getVideoToken: protectedProcedure
    .input(z.object({ consultationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const consultation = await ctx.db.consultation.findUnique({
        where: { id: input.consultationId },
        include: {
          patient: { include: { user: { select: { fullName: true, id: true } } } },
          doctor: { include: { user: { select: { fullName: true, id: true } } } },
        },
      })
      if (!consultation) throw new TRPCError({ code: 'NOT_FOUND' })

      // Verify caller is doctor or patient of this consultation
      const isPatient = consultation.patient.userId === ctx.session.userId
      const isDoctor = consultation.doctor.userId === ctx.session.userId
      if (!isPatient && !isDoctor) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      // Lazily create the room if it doesn't exist yet (e.g. booked before Daily key was set)
      let roomName = consultation.videoRoomId
      if (!roomName) {
        if (!process.env.DAILY_API_KEY || process.env.DAILY_API_KEY === 'daily_placeholder') {
          throw new TRPCError({
            code: 'SERVICE_UNAVAILABLE',
            message: 'Servico de video nao configurado (DAILY_API_KEY ausente)',
          })
        }
        const room = await createRoom(input.consultationId)
        roomName = room.roomName
      }

      const role = isDoctor ? 'doctor' : 'patient'
      const name = isDoctor
        ? consultation.doctor.user.fullName
        : consultation.patient.user.fullName

      const tokenResult = await generateToken(roomName, role, name, ctx.session.userId)

      return {
        token: tokenResult.token,
        roomUrl: tokenResult.roomUrl,
        expiresAt: tokenResult.expiresAt,
        role,
      }
    }),

  // Cancel a consultation
  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const consultation = await ctx.db.consultation.findUnique({
        where: { id: input.id },
        include: { patient: true, doctor: true },
      })
      if (!consultation) throw new TRPCError({ code: 'NOT_FOUND' })

      // Verify ownership
      const isPatient = consultation.patient.userId === ctx.session.userId
      const isDoctor = consultation.doctor.userId === ctx.session.userId
      if (!isPatient && !isDoctor && ctx.session.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      if (consultation.status !== ConsultationStatus.SCHEDULED) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Consulta nao pode ser cancelada neste status' })
      }

      return ctx.db.consultation.update({
        where: { id: input.id },
        data: { status: ConsultationStatus.CANCELLED },
      })
    }),

  // List consultations for patient
  listForPatient: patientProcedure
    .input(z.object({
      status: z.nativeEnum(ConsultationStatus).optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const patient = await ctx.db.patient.findUnique({
        where: { userId: ctx.session.userId },
      })
      if (!patient) throw new TRPCError({ code: 'NOT_FOUND' })

      const where = {
        patientId: patient.id,
        ...(input.status && { status: input.status }),
      }

      const [consultations, total] = await Promise.all([
        ctx.db.consultation.findMany({
          where,
          include: { doctor: { include: { user: { select: { fullName: true, avatarUrl: true } } } } },
          orderBy: { scheduledAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.db.consultation.count({ where }),
      ])

      return { consultations, total, pages: Math.ceil(total / input.limit) }
    }),

  // List consultations for doctor
  listForDoctor: doctorProcedure
    .input(z.object({
      status: z.nativeEnum(ConsultationStatus).optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const doctor = await ctx.db.doctor.findUnique({
        where: { userId: ctx.session.userId },
      })
      if (!doctor) throw new TRPCError({ code: 'NOT_FOUND' })

      const where = {
        doctorId: doctor.id,
        ...(input.status && { status: input.status }),
      }

      const [consultations, total] = await Promise.all([
        ctx.db.consultation.findMany({
          where,
          include: { patient: { include: { user: { select: { fullName: true, avatarUrl: true } } } } },
          orderBy: { scheduledAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.db.consultation.count({ where }),
      ])

      return { consultations, total, pages: Math.ceil(total / input.limit) }
    }),

  // Get consultation by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const consultation = await ctx.db.consultation.findUnique({
        where: { id: input.id },
        include: {
          patient: { include: { user: { select: { fullName: true, avatarUrl: true, email: true } } } },
          doctor: { include: { user: { select: { fullName: true, avatarUrl: true } } } },
          medicalRecords: true,
          prescriptions: true,
          chatMessages: { orderBy: { createdAt: 'asc' } },
        },
      })
      if (!consultation) throw new TRPCError({ code: 'NOT_FOUND' })
      return consultation
    }),

  // Send chat message during consultation
  sendMessage: protectedProcedure
    .input(z.object({
      consultationId: z.string().uuid(),
      content: z.string().min(1),
      messageType: z.string().default('text'),
      attachmentUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.chatMessage.create({
        data: {
          consultationId: input.consultationId,
          senderUserId: ctx.session.userId,
          content: input.content,
          messageType: input.messageType,
          attachmentUrl: input.attachmentUrl,
        },
      })
    }),
})
