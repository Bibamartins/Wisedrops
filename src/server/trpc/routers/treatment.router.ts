import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, doctorProcedure, patientProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { TreatmentStatus } from '@prisma/client'

const regimenItemSchema = z.object({
  productId: z.string().uuid().optional(),
  productName: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  route: z.string(), // oral, sublingual, topical, etc.
  timeOfDay: z.array(z.string()), // ["08:00", "20:00"]
  instructions: z.string().optional(),
})

const goalSchema = z.object({
  description: z.string(),
  targetMetric: z.string(),
  targetValue: z.string(),
  achievedAt: z.string().nullable().optional(),
})

const outcomeMetricsSchema = z.object({
  painScale: z.number().min(0).max(10).optional(),
  sleepQuality: z.number().min(0).max(10).optional(),
  sleepHours: z.number().optional(),
  anxietyLevel: z.number().min(0).max(10).optional(),
  moodScore: z.number().min(0).max(10).optional(),
  appetiteLevel: z.number().min(0).max(10).optional(),
  energyLevel: z.number().min(0).max(10).optional(),
  functionalStatus: z.number().min(0).max(10).optional(),
  overallWellbeing: z.number().min(0).max(10).optional(),
  customMetrics: z.record(z.number()).optional(),
})

export const treatmentRouter = createTRPCRouter({
  // Create treatment plan (doctor)
  createPlan: doctorProcedure
    .input(z.object({
      patientId: z.string().uuid(),
      title: z.string(),
      condition: z.string(),
      icdCode: z.string(),
      startDate: z.string(),
      expectedEndDate: z.string().optional(),
      goals: z.array(goalSchema),
      regimen: z.array(regimenItemSchema),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const doctor = await ctx.db.doctor.findUnique({ where: { userId: ctx.session.userId } })
      if (!doctor) throw new TRPCError({ code: 'NOT_FOUND' })

      return ctx.db.treatmentPlan.create({
        data: {
          patientId: input.patientId,
          doctorId: doctor.id,
          title: input.title,
          condition: input.condition,
          icdCode: input.icdCode,
          startDate: new Date(input.startDate),
          expectedEndDate: input.expectedEndDate ? new Date(input.expectedEndDate) : null,
          goals: input.goals,
          currentRegimen: input.regimen,
          regimenHistory: [],
          notes: input.notes,
        },
      })
    }),

  // Adjust regimen (doctor) - logs the change
  adjustRegimen: doctorProcedure
    .input(z.object({
      treatmentPlanId: z.string().uuid(),
      newRegimen: z.array(regimenItemSchema),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const plan = await ctx.db.treatmentPlan.findUnique({
        where: { id: input.treatmentPlanId },
      })
      if (!plan) throw new TRPCError({ code: 'NOT_FOUND' })

      const currentHistory = (plan.regimenHistory as Array<Record<string, unknown>>) || []
      const updatedHistory = [
        ...currentHistory,
        {
          date: new Date().toISOString(),
          previousRegimen: plan.currentRegimen,
          newRegimen: input.newRegimen,
          reason: input.reason,
        },
      ]

      return ctx.db.treatmentPlan.update({
        where: { id: input.treatmentPlanId },
        data: {
          currentRegimen: input.newRegimen,
          regimenHistory: updatedHistory,
        },
      })
    }),

  // Log adherence (patient)
  logAdherence: patientProcedure
    .input(z.object({
      treatmentPlanId: z.string().uuid(),
      scheduledAt: z.string().datetime(),
      taken: z.boolean(),
      skipReason: z.string().optional(),
      dosageTaken: z.string().optional(),
      sideEffects: z.array(z.string()).default([]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const patient = await ctx.db.patient.findUnique({ where: { userId: ctx.session.userId } })
      if (!patient) throw new TRPCError({ code: 'NOT_FOUND' })

      return ctx.db.adherenceLog.create({
        data: {
          patientId: patient.id,
          treatmentPlanId: input.treatmentPlanId,
          scheduledAt: new Date(input.scheduledAt),
          takenAt: input.taken ? new Date() : null,
          skipped: !input.taken,
          skipReason: input.skipReason,
          dosageTaken: input.dosageTaken,
          sideEffects: input.sideEffects,
          notes: input.notes,
        },
      })
    }),

  // Get adherence stats
  getAdherenceStats: protectedProcedure
    .input(z.object({
      treatmentPlanId: z.string().uuid(),
      period: z.enum(['week', 'month', 'quarter', 'all']).default('month'),
    }))
    .query(async ({ ctx, input }) => {
      const now = new Date()
      let startDate: Date

      switch (input.period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(0)
      }

      const logs = await ctx.db.adherenceLog.findMany({
        where: {
          treatmentPlanId: input.treatmentPlanId,
          scheduledAt: { gte: startDate },
        },
        orderBy: { scheduledAt: 'asc' },
      })

      const taken = logs.filter((l) => l.takenAt !== null).length
      const skipped = logs.filter((l) => l.skipped).length
      const missed = logs.filter((l) => !l.takenAt && !l.skipped).length
      const total = logs.length

      // Calculate streak
      let currentStreak = 0
      for (let i = logs.length - 1; i >= 0; i--) {
        if (logs[i].takenAt) currentStreak++
        else break
      }

      // Side effects frequency
      const sideEffectsCount: Record<string, number> = {}
      logs.forEach((l) => {
        l.sideEffects.forEach((se) => {
          sideEffectsCount[se] = (sideEffectsCount[se] || 0) + 1
        })
      })

      return {
        adherenceRate: total > 0 ? Math.round((taken / total) * 100) : 0,
        taken,
        skipped,
        missed,
        total,
        currentStreak,
        sideEffectsFrequency: sideEffectsCount,
        dailyLogs: logs.map((l) => ({
          date: l.scheduledAt,
          taken: !!l.takenAt,
          skipped: l.skipped,
        })),
      }
    }),

  // Record treatment outcome (patient or doctor)
  recordOutcome: protectedProcedure
    .input(z.object({
      treatmentPlanId: z.string().uuid(),
      metrics: outcomeMetricsSchema,
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.treatmentOutcome.create({
        data: {
          treatmentPlanId: input.treatmentPlanId,
          metrics: input.metrics,
          patientReported: ctx.session.role === 'PATIENT',
          notes: input.notes,
        },
      })
    }),

  // Get outcome history for charts
  getOutcomeHistory: protectedProcedure
    .input(z.object({
      treatmentPlanId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.treatmentOutcome.findMany({
        where: { treatmentPlanId: input.treatmentPlanId },
        orderBy: { recordedAt: 'asc' },
      })
    }),

  // Symptom journal
  createJournalEntry: patientProcedure
    .input(z.object({
      symptoms: outcomeMetricsSchema,
      activities: z.array(z.string()).default([]),
      triggers: z.array(z.string()).default([]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const patient = await ctx.db.patient.findUnique({ where: { userId: ctx.session.userId } })
      if (!patient) throw new TRPCError({ code: 'NOT_FOUND' })

      return ctx.db.symptomJournalEntry.create({
        data: {
          patientId: patient.id,
          symptoms: input.symptoms,
          activities: input.activities,
          triggers: input.triggers,
          notes: input.notes,
        },
      })
    }),

  // List patient's treatment plans
  listPlans: protectedProcedure
    .input(z.object({
      patientId: z.string().uuid().optional(),
      status: z.nativeEnum(TreatmentStatus).optional(),
    }))
    .query(async ({ ctx, input }) => {
      let patientId = input.patientId

      // If patient role, use own ID
      if (ctx.session.role === 'PATIENT') {
        const patient = await ctx.db.patient.findUnique({ where: { userId: ctx.session.userId } })
        if (!patient) throw new TRPCError({ code: 'NOT_FOUND' })
        patientId = patient.id
      }

      return ctx.db.treatmentPlan.findMany({
        where: {
          ...(patientId && { patientId }),
          ...(input.status && { status: input.status }),
        },
        include: {
          doctor: { include: { user: { select: { fullName: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      })
    }),
})
