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
})
