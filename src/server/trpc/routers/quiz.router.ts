import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, patientProcedure, doctorProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { trackQuizCompleted } from '@/server/services/hubspot.service'

export const quizRouter = createTRPCRouter({
  // Save quiz response
  submit: patientProcedure
    .input(z.object({
      answers: z.record(z.unknown()),
      recommendedSpecialties: z.array(z.string()),
      riskLevel: z.enum(['low', 'medium', 'high']),
      priorityCondition: z.string(),
      suggestedProducts: z.array(z.string()),
      consultationFocus: z.array(z.string()),
      personalizedMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const patient = await ctx.db.patient.findUnique({
        where: { userId: ctx.session.userId },
      })
      if (!patient) throw new TRPCError({ code: 'NOT_FOUND', message: 'Perfil de paciente nao encontrado' })

      const quiz = await ctx.db.patientQuiz.create({
        data: {
          patientId: patient.id,
          answers: input.answers,
          recommendedSpecialties: input.recommendedSpecialties,
          riskLevel: input.riskLevel,
          priorityCondition: input.priorityCondition,
          suggestedProducts: input.suggestedProducts,
          consultationFocus: input.consultationFocus,
          personalizedMessage: input.personalizedMessage,
        },
      })

      // Update patient's primary conditions based on quiz
      const conditions = (input.answers as Record<string, unknown>).conditions
      if (Array.isArray(conditions) && conditions.length > 0) {
        await ctx.db.patient.update({
          where: { id: patient.id },
          data: {
            primaryConditions: conditions as string[],
            onboardingCompleted: true,
          },
        })
      }

      // HubSpot sync — manda só categoria + prioridade, nunca a condição crua
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.userId },
        select: { email: true, fullName: true, phone: true },
      })
      if (user) {
        const [firstName, ...rest] = (user.fullName ?? '').split(' ')
        const recMap: Record<string, string> = {
          high: 'consultar_medico',
          medium: 'avaliacao_recomendada',
          low: 'nao_indicado',
        }
        await Promise.allSettled([
          trackQuizCompleted({
            patientEmail: user.email,
            firstName,
            lastName: rest.join(' '),
            phone: user.phone ?? undefined,
            rawPriorityCondition: input.priorityCondition,
            rawRiskLevel: input.riskLevel,
            recommendation: recMap[input.riskLevel],
          }),
        ])
      }

      return { quizId: quiz.id }
    }),

  // Get latest quiz for current patient
  getLatest: patientProcedure
    .query(async ({ ctx }) => {
      const patient = await ctx.db.patient.findUnique({
        where: { userId: ctx.session.userId },
      })
      if (!patient) throw new TRPCError({ code: 'NOT_FOUND' })

      return ctx.db.patientQuiz.findFirst({
        where: { patientId: patient.id },
        orderBy: { createdAt: 'desc' },
      })
    }),

  // Get all quizzes for a patient (doctor view)
  getForPatient: doctorProcedure
    .input(z.object({ patientId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.patientQuiz.findMany({
        where: { patientId: input.patientId },
        orderBy: { createdAt: 'desc' },
      })
    }),

  // Link quiz to consultation
  linkToConsultation: protectedProcedure
    .input(z.object({
      quizId: z.string().uuid(),
      consultationId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.patientQuiz.update({
        where: { id: input.quizId },
        data: { consultationId: input.consultationId },
      })
    }),

  // Get quiz history for patient
  getHistory: patientProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(20).default(5),
    }))
    .query(async ({ ctx, input }) => {
      const patient = await ctx.db.patient.findUnique({
        where: { userId: ctx.session.userId },
      })
      if (!patient) throw new TRPCError({ code: 'NOT_FOUND' })

      const [quizzes, total] = await Promise.all([
        ctx.db.patientQuiz.findMany({
          where: { patientId: patient.id },
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.db.patientQuiz.count({ where: { patientId: patient.id } }),
      ])

      return { quizzes, total, pages: Math.ceil(total / input.limit) }
    }),

  /**
   * Estado do onboarding do paciente (PR 8).
   * Deduz qual passo da jornada o paciente está, lendo o banco.
   * Drive da UI linear em /home — paciente novo só vê 1 CTA;
   * recorrente vê dashboard completo.
   */
  getOnboardingState: patientProcedure.query(async ({ ctx }) => {
    const patient = await ctx.db.patient.findUnique({
      where: { userId: ctx.session.userId },
      select: {
        id: true,
        primaryConditions: true,
        onboardingCompleted: true,
      },
    })
    if (!patient) {
      return {
        state: 'NEW' as const,
        context: { patientId: null },
      }
    }

    const [latestQuiz, consultations, prescriptions, orders, externalRx] = await Promise.all([
      ctx.db.patientQuiz.findFirst({
        where: { patientId: patient.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, completedAt: true, priorityCondition: true },
      }),
      ctx.db.consultation.findMany({
        where: { patientId: patient.id },
        orderBy: { scheduledAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          scheduledAt: true,
          doctor: {
            select: {
              id: true,
              slug: true,
              user: { select: { fullName: true } },
            },
          },
        },
      }),
      ctx.db.prescription.findMany({
        where: { patientId: patient.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, status: true, validUntil: true, prescriptionType: true },
      }),
      ctx.db.order.findMany({
        where: { patientId: patient.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          status: true,
          totalCents: true,
          createdAt: true,
          estimatedDelivery: true,
        },
      }),
      // PR fluxo "Já tenho receita" — última receita externa
      ctx.db.externalPrescription.findFirst({
        where: { patientId: patient.id },
        orderBy: { submittedAt: 'desc' },
        select: { id: true, status: true, submittedAt: true, rejectionReason: true, doctorName: true },
      }),
    ])

    // ---- Fluxo "Já tenho receita" tem PRIORIDADE sobre quiz ----
    // Se paciente tem receita externa em qualquer status, é caminho 2.
    if (externalRx) {
      if (externalRx.status === 'PENDING') {
        return {
          state: 'EXTERNAL_RX_PENDING' as const,
          context: {
            patientId: patient.id,
            externalRxId: externalRx.id,
            submittedAt: externalRx.submittedAt,
            doctorName: externalRx.doctorName,
          },
        }
      }
      if (externalRx.status === 'REJECTED') {
        return {
          state: 'EXTERNAL_RX_REJECTED' as const,
          context: {
            patientId: patient.id,
            externalRxId: externalRx.id,
            rejectionReason: externalRx.rejectionReason,
          },
        }
      }
      if (externalRx.status === 'APPROVED') {
        // Aprovada — verifica se já fez pedido
        const hasDelivered = orders.some((o) => o.status === 'DELIVERED')
        const inTransit = orders.find((o) =>
          ['PAID', 'PROCESSING', 'AWAITING_ANVISA', 'ANVISA_APPROVED', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status),
        )
        if (hasDelivered) {
          return { state: 'TREATMENT_ACTIVE' as const, context: { patientId: patient.id } }
        }
        if (inTransit) {
          return {
            state: 'ORDER_PLACED' as const,
            context: {
              patientId: patient.id,
              orderId: inTransit.id,
              orderStatus: inTransit.status,
              estimatedDelivery: inTransit.estimatedDelivery,
            },
          }
        }
        // Sem pedido ainda — libera catálogo
        return {
          state: 'EXTERNAL_RX_APPROVED' as const,
          context: { patientId: patient.id, externalRxId: externalRx.id },
        }
      }
    }

    // Estado derivado — começa do mais avançado
    const hasActiveTreatment = orders.some((o) => o.status === 'DELIVERED')
    const inTransitOrder = orders.find((o) =>
      ['PAID', 'PROCESSING', 'AWAITING_ANVISA', 'ANVISA_APPROVED', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status),
    )
    const usableRx = prescriptions.find(
      (p) => (p.status === 'SIGNED' || p.status === 'ANVISA_APPROVED') && p.validUntil > new Date(),
    )
    const upcomingConsultation = consultations.find(
      (c) => c.status === 'SCHEDULED' || c.status === 'WAITING_ROOM' || c.status === 'IN_PROGRESS',
    )
    const completedConsultationWithoutRx = consultations.find(
      (c) => c.status === 'COMPLETED' && !prescriptions.length,
    )

    if (hasActiveTreatment) {
      return {
        state: 'TREATMENT_ACTIVE' as const,
        context: { patientId: patient.id },
      }
    }
    if (inTransitOrder) {
      return {
        state: 'ORDER_PLACED' as const,
        context: {
          patientId: patient.id,
          orderId: inTransitOrder.id,
          orderStatus: inTransitOrder.status,
          estimatedDelivery: inTransitOrder.estimatedDelivery,
        },
      }
    }
    if (usableRx) {
      return {
        state: 'PRESCRIPTION_READY' as const,
        context: {
          patientId: patient.id,
          prescriptionId: usableRx.id,
        },
      }
    }
    if (completedConsultationWithoutRx) {
      return {
        state: 'CONSULTATION_DONE' as const,
        context: {
          patientId: patient.id,
          consultationId: completedConsultationWithoutRx.id,
        },
      }
    }
    if (upcomingConsultation) {
      return {
        state: 'CONSULTATION_BOOKED' as const,
        context: {
          patientId: patient.id,
          consultationId: upcomingConsultation.id,
          consultationStatus: upcomingConsultation.status,
          scheduledAt: upcomingConsultation.scheduledAt,
          doctorName: upcomingConsultation.doctor.user.fullName,
          doctorSlug: upcomingConsultation.doctor.slug,
        },
      }
    }
    if (latestQuiz) {
      return {
        state: 'QUIZ_DONE' as const,
        context: {
          patientId: patient.id,
          quizCompletedAt: latestQuiz.completedAt,
          priorityCondition: latestQuiz.priorityCondition,
        },
      }
    }
    return {
      state: 'NEW' as const,
      context: { patientId: patient.id },
    }
  }),
})
