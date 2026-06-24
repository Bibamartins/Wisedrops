/**
 * Marketplace tRPC Router (PR 7)
 *
 * Procedures PÚBLICAS — busca de médico não exige autenticação.
 * Decisão arquitetural (docs/arquitetura-produto.md §6.4): marketplace,
 * cada médico tem perfil público, paciente busca e escolhe.
 *
 * Não retorna PHI: só dado profissional do médico (foto, CRM, especialidade,
 * preço, disponibilidade). Nunca dado de paciente.
 */

import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { DoctorVerificationStatus, ConsultationStatus } from '@prisma/client'

const sortSchema = z.enum(['rating', 'price-low', 'price-high', 'experience']).default('rating')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HOUR = 60 * 60 * 1000

/**
 * Calcula próximos N slots disponíveis dos próximos 7 dias pra um médico.
 * Considera availability (weekly recurring) menos consultas já agendadas.
 */
async function nextAvailableSlots(
  db: import('@prisma/client').PrismaClient,
  doctorId: string,
  maxSlots = 5,
): Promise<Array<{ scheduledAt: Date }>> {
  const doctor = await db.doctor.findUnique({
    where: { id: doctorId },
    include: { availability: { where: { isActive: true } } },
  })
  if (!doctor || doctor.availability.length === 0) return []

  const now = new Date()
  const horizon = new Date(now.getTime() + 7 * 24 * HOUR)

  // Busca consultas já reservadas nos próximos 7 dias
  const booked = await db.consultation.findMany({
    where: {
      doctorId,
      scheduledAt: { gte: now, lte: horizon },
      status: { notIn: [ConsultationStatus.CANCELLED, ConsultationStatus.NO_SHOW] },
    },
    select: { scheduledAt: true },
  })
  const bookedIso = new Set(booked.map((b) => b.scheduledAt.toISOString()))

  const slots: Date[] = []
  for (let dayOffset = 0; dayOffset < 7 && slots.length < maxSlots; dayOffset++) {
    const day = new Date(now)
    day.setDate(day.getDate() + dayOffset)
    day.setHours(0, 0, 0, 0)
    const dayOfWeek = day.getDay()

    const todaysAvail = doctor.availability.filter((a) => a.dayOfWeek === dayOfWeek)
    for (const avail of todaysAvail) {
      if (slots.length >= maxSlots) break
      const [startH, startM] = avail.startTime.split(':').map(Number)
      const [endH, endM] = avail.endTime.split(':').map(Number)
      const startMins = startH * 60 + startM
      const endMins = endH * 60 + endM

      for (let m = startMins; m + avail.slotDurationMinutes <= endMins; m += avail.slotDurationMinutes) {
        if (slots.length >= maxSlots) break
        const slotDate = new Date(day)
        slotDate.setHours(Math.floor(m / 60), m % 60, 0, 0)
        if (slotDate <= now) continue
        if (bookedIso.has(slotDate.toISOString())) continue
        slots.push(slotDate)
      }
    }
  }

  return slots.map((scheduledAt) => ({ scheduledAt }))
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const marketplaceRouter = createTRPCRouter({
  /** Lista médicos públicos com filtros + ordenação + paginação. */
  listDoctors: publicProcedure
    .input(
      z.object({
        specialty: z.string().optional(),
        minPriceCents: z.number().int().optional(),
        maxPriceCents: z.number().int().optional(),
        sort: sortSchema,
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(12),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        verificationStatus: DoctorVerificationStatus.APPROVED,
        isPublic: true,
        isAcceptingPatients: true,
      }
      if (input.specialty) {
        where.specialty = { has: input.specialty }
      }
      if (input.minPriceCents !== undefined || input.maxPriceCents !== undefined) {
        const price: Record<string, number> = {}
        if (input.minPriceCents !== undefined) price.gte = input.minPriceCents
        if (input.maxPriceCents !== undefined) price.lte = input.maxPriceCents
        where.consultationPriceCents = price
      }

      const orderBy =
        input.sort === 'rating'
          ? [{ averageRating: 'desc' as const }, { totalConsultations: 'desc' as const }]
          : input.sort === 'price-low'
            ? [{ consultationPriceCents: 'asc' as const }]
            : input.sort === 'price-high'
              ? [{ consultationPriceCents: 'desc' as const }]
              : [{ yearsOfExperience: 'desc' as const }, { totalConsultations: 'desc' as const }]

      const [doctors, total] = await Promise.all([
        ctx.db.doctor.findMany({
          where,
          orderBy,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            user: { select: { fullName: true } },
          },
        }),
        ctx.db.doctor.count({ where }),
      ])

      // Para cada médico, busca o próximo slot disponível (1 só, pra mostrar no card)
      const enriched = await Promise.all(
        doctors.map(async (d) => {
          const slots = await nextAvailableSlots(ctx.db, d.id, 1)
          return {
            id: d.id,
            slug: d.slug,
            fullName: d.user.fullName,
            crm: d.crm,
            crmState: d.crmState,
            specialty: d.specialty,
            photoUrl: d.photoUrl,
            headline: d.headline,
            yearsOfExperience: d.yearsOfExperience,
            consultationPriceCents: d.consultationPriceCents,
            averageRating: d.averageRating,
            totalConsultations: d.totalConsultations,
            isAcceptingPatients: d.isAcceptingPatients,
            nextSlot: slots[0]?.scheduledAt ?? null,
          }
        }),
      )

      return {
        doctors: enriched,
        total,
        pages: Math.ceil(total / input.limit),
        currentPage: input.page,
      }
    }),

  /** Perfil completo público (por slug). */
  getDoctorBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const doctor = await ctx.db.doctor.findUnique({
        where: { slug: input.slug },
        include: {
          user: { select: { fullName: true, avatarUrl: true } },
          availability: { where: { isActive: true } },
        },
      })
      if (!doctor || !doctor.isPublic || doctor.verificationStatus !== DoctorVerificationStatus.APPROVED) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Médico não encontrado.' })
      }

      const slots = await nextAvailableSlots(ctx.db, doctor.id, 8)

      return {
        id: doctor.id,
        slug: doctor.slug,
        fullName: doctor.user.fullName,
        avatarUrl: doctor.user.avatarUrl,
        crm: doctor.crm,
        crmState: doctor.crmState,
        specialty: doctor.specialty,
        bio: doctor.bio,
        photoUrl: doctor.photoUrl,
        headline: doctor.headline,
        yearsOfExperience: doctor.yearsOfExperience,
        consultationPriceCents: doctor.consultationPriceCents,
        averageRating: doctor.averageRating,
        totalConsultations: doctor.totalConsultations,
        isAcceptingPatients: doctor.isAcceptingPatients,
        availability: doctor.availability.map((a) => ({
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          slotDurationMinutes: a.slotDurationMinutes,
        })),
        nextSlots: slots.map((s) => s.scheduledAt),
      }
    }),

  /** Lista distinct de especialidades pra popular filtros. */
  listSpecialties: publicProcedure.query(async ({ ctx }) => {
    const doctors = await ctx.db.doctor.findMany({
      where: {
        verificationStatus: DoctorVerificationStatus.APPROVED,
        isPublic: true,
      },
      select: { specialty: true },
    })
    const set = new Set<string>()
    for (const d of doctors) for (const s of d.specialty) set.add(s)
    return Array.from(set).sort()
  }),
})
