/**
 * Doctor tRPC Router
 *
 * Public search, profile management, availability, earnings,
 * and patient CRM list with adherence data.
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  doctorProcedure,
} from '../trpc'
import { DoctorVerificationStatus, TreatmentStatus } from '@prisma/client'
import { AdherenceService } from '@/server/services/adherence.service'

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const searchSchema = z.object({
  query: z.string().optional(),
  specialty: z.string().optional(),
  state: z.string().length(2).optional(),
  /** Only show doctors accepting new patients */
  acceptingOnly: z.boolean().default(true),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
})

const updateProfileSchema = z.object({
  bio: z.string().max(2000).optional(),
  specialty: z.array(z.string()).min(1).optional(),
  consultationPriceCents: z.number().int().min(0).optional(),
  isAcceptingPatients: z.boolean().optional(),
})

const setAvailabilitySchema = z.object({
  /** Replace all availability slots with these */
  slots: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato invalido. Use HH:MM.'),
      endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato invalido. Use HH:MM.'),
      slotDurationMinutes: z.number().int().min(15).max(120).default(30),
      isActive: z.boolean().default(true),
    }),
  ),
})

const getPatientsSchema = z.object({
  search: z.string().optional(),
  /** Filter patients with active treatment plans only */
  activeOnly: z.boolean().default(false),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
})

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const doctorRouter = createTRPCRouter({
  /**
   * Public search for doctors. Used by patients when looking for a specialist.
   * Only returns approved, active doctors.
   */
  search: publicProcedure
    .input(searchSchema)
    .query(async ({ ctx, input }) => {
      const { query, specialty, state, acceptingOnly, page, limit } = input

      const where = {
        verificationStatus: DoctorVerificationStatus.APPROVED,
        user: { status: 'ACTIVE' as const },
        ...(acceptingOnly && { isAcceptingPatients: true }),
        ...(state && { crmState: state }),
        ...(specialty && {
          specialty: { has: specialty },
        }),
        ...(query && {
          OR: [
            { user: { fullName: { contains: query, mode: 'insensitive' as const } } },
            { crm: { contains: query, mode: 'insensitive' as const } },
            { specialty: { has: query } },
          ],
        }),
      }

      const [doctors, total] = await Promise.all([
        ctx.db.doctor.findMany({
          where,
          include: {
            user: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: [
            { averageRating: 'desc' },
            { totalConsultations: 'desc' },
          ],
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.db.doctor.count({ where }),
      ])

      // Return only public-facing fields
      const results = doctors.map((doc) => ({
        id: doc.id,
        fullName: doc.user.fullName,
        avatarUrl: doc.user.avatarUrl,
        crm: doc.crm,
        crmState: doc.crmState,
        specialty: doc.specialty,
        bio: doc.bio,
        consultationPriceCents: doc.consultationPriceCents,
        averageRating: doc.averageRating,
        totalConsultations: doc.totalConsultations,
        isAcceptingPatients: doc.isAcceptingPatients,
      }))

      return {
        doctors: results,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      }
    }),

  /**
   * Get the authenticated doctor's own profile.
   */
  getProfile: doctorProcedure.query(async ({ ctx }) => {
    const doctor = await ctx.db.doctor.findUnique({
      where: { userId: ctx.session.userId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        availability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
      },
    })

    if (!doctor) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Perfil de medico nao encontrado.',
      })
    }

    return doctor
  }),

  /**
   * Update the authenticated doctor's profile.
   */
  updateProfile: doctorProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const doctor = await ctx.db.doctor.findUnique({
        where: { userId: ctx.session.userId },
        select: { id: true },
      })

      if (!doctor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de medico nao encontrado.',
        })
      }

      const updated = await ctx.db.doctor.update({
        where: { id: doctor.id },
        data: {
          ...(input.bio !== undefined && { bio: input.bio }),
          ...(input.specialty && { specialty: input.specialty }),
          ...(input.consultationPriceCents !== undefined && {
            consultationPriceCents: input.consultationPriceCents,
          }),
          ...(input.isAcceptingPatients !== undefined && {
            isAcceptingPatients: input.isAcceptingPatients,
          }),
        },
      })

      return updated
    }),

  /**
   * Set the doctor's weekly availability schedule.
   * Replaces all existing slots.
   */
  setAvailability: doctorProcedure
    .input(setAvailabilitySchema)
    .mutation(async ({ ctx, input }) => {
      const doctor = await ctx.db.doctor.findUnique({
        where: { userId: ctx.session.userId },
        select: { id: true },
      })

      if (!doctor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de medico nao encontrado.',
        })
      }

      // Validate time ranges
      for (const slot of input.slots) {
        if (slot.startTime >= slot.endTime) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Horario de inicio (${slot.startTime}) deve ser anterior ao horario de fim (${slot.endTime}).`,
          })
        }
      }

      // Replace all availability in a transaction
      await ctx.db.$transaction(async (tx) => {
        await tx.doctorAvailability.deleteMany({
          where: { doctorId: doctor.id },
        })

        if (input.slots.length > 0) {
          await tx.doctorAvailability.createMany({
            data: input.slots.map((slot) => ({
              doctorId: doctor.id,
              ...slot,
            })),
          })
        }
      })

      // Return new availability
      const availability = await ctx.db.doctorAvailability.findMany({
        where: { doctorId: doctor.id },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      })

      return availability
    }),

  /**
   * Get availability for a specific doctor (used by patients for scheduling).
   */
  getAvailability: protectedProcedure
    .input(z.object({ doctorId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const availability = await ctx.db.doctorAvailability.findMany({
        where: { doctorId: input.doctorId, isActive: true },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      })

      // Also get existing appointments to determine booked slots
      const now = new Date()
      const twoWeeksOut = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

      const bookedSlots = await ctx.db.consultation.findMany({
        where: {
          doctorId: input.doctorId,
          scheduledAt: { gte: now, lte: twoWeeksOut },
          status: { in: ['SCHEDULED', 'WAITING_ROOM', 'IN_PROGRESS'] },
        },
        select: { scheduledAt: true, durationMinutes: true },
      })

      return {
        availability,
        bookedSlots: bookedSlots.map((s) => ({
          start: s.scheduledAt,
          durationMinutes: s.durationMinutes ?? 30,
        })),
      }
    }),

  /**
   * Get earnings summary for the authenticated doctor.
   */
  getEarnings: doctorProcedure
    .input(
      z.object({
        period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const doctor = await ctx.db.doctor.findUnique({
        where: { userId: ctx.session.userId },
        select: { id: true },
      })

      if (!doctor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de medico nao encontrado.',
        })
      }

      const now = new Date()
      const periodStart = new Date(now)

      switch (input.period) {
        case 'week':
          periodStart.setDate(now.getDate() - 7)
          break
        case 'month':
          periodStart.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          periodStart.setMonth(now.getMonth() - 3)
          break
        case 'year':
          periodStart.setFullYear(now.getFullYear() - 1)
          break
      }

      // Completed consultations in period
      const consultations = await ctx.db.consultation.findMany({
        where: {
          doctorId: doctor.id,
          status: 'COMPLETED',
          endedAt: { gte: periodStart },
        },
        select: {
          id: true,
          priceCents: true,
          endedAt: true,
          rating: true,
          type: true,
        },
        orderBy: { endedAt: 'desc' },
      })

      const totalRevenueCents = consultations.reduce((sum, c) => sum + c.priceCents, 0)
      const platformFeeCents = Math.round(totalRevenueCents * 0.15) // 15% platform fee
      const netEarningsCents = totalRevenueCents - platformFeeCents

      const ratings = consultations.filter((c) => c.rating !== null).map((c) => c.rating!)
      const avgRating =
        ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : null

      // Group by month for chart
      const byMonth = new Map<string, { revenue: number; count: number }>()
      for (const c of consultations) {
        if (!c.endedAt) continue
        const monthKey = `${c.endedAt.getFullYear()}-${String(c.endedAt.getMonth() + 1).padStart(2, '0')}`
        const entry = byMonth.get(monthKey) ?? { revenue: 0, count: 0 }
        entry.revenue += c.priceCents
        entry.count++
        byMonth.set(monthKey, entry)
      }

      return {
        period: input.period,
        periodStart,
        periodEnd: now,
        totalConsultations: consultations.length,
        totalRevenueCents,
        platformFeeCents,
        netEarningsCents,
        averageRating: avgRating,
        byMonth: Array.from(byMonth.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, data]) => ({ month, ...data })),
      }
    }),

  /**
   * Get the doctor's patient CRM list with adherence data.
   * Shows all patients the doctor has treated, with their latest
   * treatment status and adherence metrics.
   */
  getPatients: doctorProcedure
    .input(getPatientsSchema)
    .query(async ({ ctx, input }) => {
      const doctor = await ctx.db.doctor.findUnique({
        where: { userId: ctx.session.userId },
        select: { id: true },
      })

      if (!doctor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de medico nao encontrado.',
        })
      }

      // Get distinct patients from treatment plans
      const treatmentPlanWhere = {
        doctorId: doctor.id,
        ...(input.activeOnly && { status: TreatmentStatus.ACTIVE }),
      }

      const treatmentPlans = await ctx.db.treatmentPlan.findMany({
        where: treatmentPlanWhere,
        include: {
          patient: {
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true,
                  phone: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })

      // Deduplicate patients and aggregate their data
      const patientMap = new Map<
        string,
        {
          patientId: string
          fullName: string
          email: string
          phone: string
          avatarUrl: string | null
          treatmentPlans: Array<{
            id: string
            title: string
            condition: string
            status: string
            startDate: Date
          }>
        }
      >()

      for (const plan of treatmentPlans) {
        const existing = patientMap.get(plan.patientId)
        const planSummary = {
          id: plan.id,
          title: plan.title,
          condition: plan.condition,
          status: plan.status,
          startDate: plan.startDate,
        }

        if (existing) {
          existing.treatmentPlans.push(planSummary)
        } else {
          // Apply search filter
          if (
            input.search &&
            !plan.patient.user.fullName
              .toLowerCase()
              .includes(input.search.toLowerCase()) &&
            !plan.patient.user.email
              .toLowerCase()
              .includes(input.search.toLowerCase())
          ) {
            continue
          }

          patientMap.set(plan.patientId, {
            patientId: plan.patientId,
            fullName: plan.patient.user.fullName,
            email: plan.patient.user.email,
            phone: plan.patient.user.phone,
            avatarUrl: plan.patient.user.avatarUrl,
            treatmentPlans: [planSummary],
          })
        }
      }

      const allPatients = Array.from(patientMap.values())
      const total = allPatients.length
      const paginated = allPatients.slice(
        (input.page - 1) * input.limit,
        input.page * input.limit,
      )

      // Fetch adherence data for active treatment plans
      const patientsWithAdherence = await Promise.all(
        paginated.map(async (patient) => {
          const activePlans = patient.treatmentPlans.filter(
            (p) => p.status === TreatmentStatus.ACTIVE,
          )

          let overallAdherence: number | null = null

          if (activePlans.length > 0) {
            try {
              const reports = await Promise.all(
                activePlans.map((p) =>
                  AdherenceService.getAdherenceReport(p.id).catch(() => null),
                ),
              )

              const validReports = reports.filter(
                (r): r is NonNullable<typeof r> => r !== null,
              )

              if (validReports.length > 0) {
                overallAdherence = Math.round(
                  validReports.reduce((sum, r) => sum + r.overallAdherence, 0) /
                    validReports.length,
                )
              }
            } catch {
              // Adherence calculation is best-effort
            }
          }

          // Last consultation with this doctor
          const lastConsultation = await ctx.db.consultation.findFirst({
            where: {
              doctorId: doctor.id,
              patientId: patient.patientId,
              status: 'COMPLETED',
            },
            select: { scheduledAt: true, endedAt: true },
            orderBy: { scheduledAt: 'desc' },
          })

          return {
            ...patient,
            overallAdherence,
            lastConsultationDate: lastConsultation?.endedAt ?? lastConsultation?.scheduledAt ?? null,
            activeTreatmentCount: activePlans.length,
          }
        }),
      )

      return {
        patients: patientsWithAdherence,
        total,
        pages: Math.ceil(total / input.limit),
        currentPage: input.page,
      }
    }),
})
