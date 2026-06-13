import { z } from 'zod'
import {
  createTRPCRouter,
  doctorProcedure,
  patientProcedure,
  protectedProcedure,
} from '../trpc'
import { TRPCError } from '@trpc/server'
import { PrescriptionType, PrescriptionStatus } from '@prisma/client'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const prescriptionItemSchema = z.object({
  productId: z.string().uuid().optional(),
  genericName: z.string().min(2, 'Nome do produto/medicamento obrigatório'),
  concentration: z.string().optional(),
  form: z.string().optional(),
  dosage: z.string().min(1, 'Dosagem obrigatória'),
  frequency: z.string().min(1, 'Frequência obrigatória'),
  quantity: z.string().optional(),
  duration: z.string().optional(),
  instructions: z.string().optional(),
})

const createPrescriptionSchema = z.object({
  patientId: z.string().uuid(),
  consultationId: z.string().uuid().optional(),
  prescriptionType: z.nativeEnum(PrescriptionType),
  items: z.array(prescriptionItemSchema).min(1, 'Adicione ao menos um item'),
  clinicalJustification: z.string().optional(),
  icdCodes: z.array(z.string()).default([]),
})

function calcValidUntil(type: PrescriptionType): Date {
  // Cannabis medicinal: receita simples 180 dias; A/B 30 dias.
  const days = type === PrescriptionType.SIMPLE ? 180 : 30
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const prescriptionRouter = createTRPCRouter({
  // Médico cria uma prescrição.
  create: doctorProcedure
    .input(createPrescriptionSchema)
    .mutation(async ({ ctx, input }) => {
      const doctor = await ctx.db.doctor.findUnique({
        where: { userId: ctx.session.userId },
        select: { id: true },
      })
      if (!doctor) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Médico não encontrado.' })
      }

      const patient = await ctx.db.patient.findUnique({
        where: { id: input.patientId },
        select: { id: true },
      })
      if (!patient) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Paciente não encontrado.' })
      }

      // Se uma consulta foi indicada, ela precisa ser do mesmo médico/paciente.
      if (input.consultationId) {
        const cons = await ctx.db.consultation.findUnique({
          where: { id: input.consultationId },
          select: { doctorId: true, patientId: true },
        })
        if (!cons || cons.doctorId !== doctor.id || cons.patientId !== input.patientId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Consulta inválida para esta prescrição.',
          })
        }
      }

      const validUntil = calcValidUntil(input.prescriptionType)
      const prescription = await ctx.db.prescription.create({
        data: {
          patientId: input.patientId,
          doctorId: doctor.id,
          consultationId: input.consultationId,
          prescriptionType: input.prescriptionType,
          status: PrescriptionStatus.SIGNED,
          items: input.items as object[],
          clinicalJustification: input.clinicalJustification,
          icdCodes: input.icdCodes,
          validUntil,
          signedAt: new Date(),
        },
      })
      return prescription
    }),

  // Médico lista suas prescrições.
  listForDoctor: doctorProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(50).default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const opts = input ?? { page: 1, limit: 20 }
      const doctor = await ctx.db.doctor.findUnique({
        where: { userId: ctx.session.userId },
        select: { id: true },
      })
      if (!doctor) throw new TRPCError({ code: 'NOT_FOUND' })

      const [prescriptions, total] = await Promise.all([
        ctx.db.prescription.findMany({
          where: { doctorId: doctor.id },
          include: {
            patient: { include: { user: { select: { fullName: true, email: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (opts.page - 1) * opts.limit,
          take: opts.limit,
        }),
        ctx.db.prescription.count({ where: { doctorId: doctor.id } }),
      ])
      return { prescriptions, total }
    }),

  // Paciente lista suas prescrições.
  listForPatient: patientProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(50).default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const opts = input ?? { page: 1, limit: 20 }
      const patient = await ctx.db.patient.findUnique({
        where: { userId: ctx.session.userId },
        select: { id: true },
      })
      if (!patient) throw new TRPCError({ code: 'NOT_FOUND' })

      const [prescriptions, total] = await Promise.all([
        ctx.db.prescription.findMany({
          where: { patientId: patient.id },
          include: {
            doctor: {
              include: { user: { select: { fullName: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (opts.page - 1) * opts.limit,
          take: opts.limit,
        }),
        ctx.db.prescription.count({ where: { patientId: patient.id } }),
      ])
      return { prescriptions, total }
    }),

  // Buscar prescrição por ID — paciente dela, médico autor, ou admin.
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const presc = await ctx.db.prescription.findUnique({
        where: { id: input.id },
        include: {
          patient: {
            include: { user: { select: { fullName: true, email: true, cpf: true } } },
          },
          doctor: {
            include: { user: { select: { fullName: true } } },
          },
        },
      })
      if (!presc) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      const isPatient = presc.patient.userId === ctx.session.userId
      const isDoctor = presc.doctor.userId === ctx.session.userId
      if (!isPatient && !isDoctor && ctx.session.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' })
      }
      return presc
    }),
})
