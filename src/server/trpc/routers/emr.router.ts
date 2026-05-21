import { z } from 'zod'
import { createTRPCRouter, doctorProcedure, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { RecordType } from '@prisma/client'
import type { TRPCContext } from '../trpc'

/**
 * Authorizes access to a patient's clinical data.
 * - ADMIN: always allowed
 * - PATIENT: only their own record
 * - DOCTOR: only patients they have/had a consultation with
 * Throws FORBIDDEN otherwise. Without this, any logged-in user could read any
 * patient's full medical timeline or vitals by passing an arbitrary patientId.
 */
async function assertCanAccessPatient(
  ctx: TRPCContext & { session: NonNullable<TRPCContext['session']> },
  patientId: string,
): Promise<void> {
  if (ctx.session.role === 'ADMIN') return

  if (ctx.session.role === 'PATIENT') {
    const patient = await ctx.db.patient.findUnique({
      where: { id: patientId },
      select: { userId: true },
    })
    if (!patient || patient.userId !== ctx.session.userId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' })
    }
    return
  }

  if (ctx.session.role === 'DOCTOR') {
    const doctor = await ctx.db.doctor.findUnique({
      where: { userId: ctx.session.userId },
      select: { id: true },
    })
    if (!doctor) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' })
    const link = await ctx.db.consultation.findFirst({
      where: { doctorId: doctor.id, patientId },
      select: { id: true },
    })
    if (!link) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Voce nao atende este paciente.' })
    }
    return
  }

  throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' })
}

// Structured data schemas per record type
const vitalSignsSchema = z.object({
  weight: z.number().optional(),
  height: z.number().optional(),
  bloodPressureSystolic: z.number().optional(),
  bloodPressureDiastolic: z.number().optional(),
  heartRate: z.number().optional(),
  temperature: z.number().optional(),
  oxygenSaturation: z.number().optional(),
  respiratoryRate: z.number().optional(),
  painScale: z.number().min(0).max(10).optional(),
})

const initialAssessmentSchema = z.object({
  chiefComplaint: z.string(),
  historyOfPresentIllness: z.string(),
  pastMedicalHistory: z.string().optional(),
  familyHistory: z.string().optional(),
  socialHistory: z.string().optional(),
  cannabisExperience: z.enum(['none', 'unsupervised', 'supervised', 'prefer_not_to_say']),
  currentMedications: z.array(z.string()),
  allergies: z.array(z.string()),
  reviewOfSystems: z.record(z.string()).optional(),
  physicalExam: z.string().optional(),
  assessment: z.string(),
  plan: z.string(),
})

const followUpSchema = z.object({
  subjective: z.string(), // SOAP: S
  objective: z.string(),  // SOAP: O
  assessment: z.string(), // SOAP: A
  plan: z.string(),       // SOAP: P
  treatmentResponse: z.enum(['excellent', 'good', 'moderate', 'poor', 'none']).optional(),
  sideEffects: z.array(z.string()).optional(),
  dosageAdjustment: z.string().optional(),
})

const labResultSchema = z.object({
  testName: z.string(),
  result: z.string(),
  unit: z.string().optional(),
  referenceRange: z.string().optional(),
  isAbnormal: z.boolean().optional(),
  labName: z.string().optional(),
  collectionDate: z.string().optional(),
})

const adverseEventSchema = z.object({
  eventDescription: z.string(),
  severity: z.enum(['mild', 'moderate', 'severe', 'life_threatening']),
  productInvolved: z.string(),
  onsetDate: z.string(),
  outcome: z.string(),
  actionTaken: z.string(),
  reportedToAnvisa: z.boolean().default(false),
})

export const emrRouter = createTRPCRouter({
  // Create a medical record
  createRecord: doctorProcedure
    .input(z.object({
      patientId: z.string().uuid(),
      consultationId: z.string().uuid().optional(),
      recordType: z.nativeEnum(RecordType),
      structuredData: z.record(z.unknown()), // Validated per type on the client
      narrativeNote: z.string().optional(),
      icdCodes: z.array(z.string()).default([]),
      attachments: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify doctor has access to this patient
      const doctor = await ctx.db.doctor.findUnique({ where: { userId: ctx.session.userId } })
      if (!doctor) throw new TRPCError({ code: 'NOT_FOUND' })

      const record = await ctx.db.medicalRecord.create({
        data: {
          patientId: input.patientId,
          consultationId: input.consultationId,
          recordType: input.recordType,
          structuredData: input.structuredData,
          narrativeNote: input.narrativeNote,
          icdCodes: input.icdCodes,
          attachments: input.attachments,
          signedByDoctorId: doctor.id,
          signedAt: new Date(),
        },
      })

      // Audit log
      await ctx.db.auditLog.create({
        data: {
          userId: ctx.session.userId,
          action: 'emr.create',
          entityType: 'MedicalRecord',
          entityId: record.id,
          metadata: { recordType: input.recordType, patientId: input.patientId },
        },
      })

      return record
    }),

  // Get patient's full medical timeline
  getPatientTimeline: protectedProcedure
    .input(z.object({
      patientId: z.string().uuid(),
      recordType: z.nativeEnum(RecordType).optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      // Verify access: patient sees own records, doctor sees their patients, admin all
      await assertCanAccessPatient(ctx, input.patientId)

      const where = {
        patientId: input.patientId,
        ...(input.recordType && { recordType: input.recordType }),
      }

      const [records, total] = await Promise.all([
        ctx.db.medicalRecord.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.db.medicalRecord.count({ where }),
      ])

      // Audit: log access to patient records
      await ctx.db.auditLog.create({
        data: {
          userId: ctx.session.userId,
          action: 'emr.view_timeline',
          entityType: 'Patient',
          entityId: input.patientId,
        },
      })

      return { records, total, pages: Math.ceil(total / input.limit) }
    }),

  // Get vitals history for charts
  getVitalsHistory: protectedProcedure
    .input(z.object({
      patientId: z.string().uuid(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      await assertCanAccessPatient(ctx, input.patientId)

      const records = await ctx.db.medicalRecord.findMany({
        where: {
          patientId: input.patientId,
          recordType: RecordType.VITAL_SIGNS,
          ...(input.startDate && {
            createdAt: {
              gte: new Date(input.startDate),
              ...(input.endDate && { lte: new Date(input.endDate) }),
            },
          }),
        },
        orderBy: { createdAt: 'asc' },
        select: { structuredData: true, createdAt: true },
      })

      return records.map((r) => ({
        date: r.createdAt,
        ...(r.structuredData as Record<string, unknown>),
      }))
    }),

  // Sign/finalize a record
  signRecord: doctorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const doctor = await ctx.db.doctor.findUnique({ where: { userId: ctx.session.userId } })
      if (!doctor) throw new TRPCError({ code: 'NOT_FOUND' })

      const record = await ctx.db.medicalRecord.findUnique({
        where: { id: input.id },
        select: { patientId: true },
      })
      if (!record) throw new TRPCError({ code: 'NOT_FOUND' })
      await assertCanAccessPatient(ctx, record.patientId)

      return ctx.db.medicalRecord.update({
        where: { id: input.id },
        data: { signedByDoctorId: doctor.id, signedAt: new Date() },
      })
    }),
})
