import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { UserRole, Gender } from '@prisma/client'
import { hashPassword } from '@/server/auth/auth.config'
import { upsertContact } from '@/server/services/hubspot.service'

// Validation schemas
const registerPatientSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Senha deve ter no minimo 8 caracteres'),
  fullName: z.string().min(3, 'Nome completo obrigatorio'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF invalido'),
  phone: z.string().min(10, 'Telefone invalido'),
  dateOfBirth: z.string(),
  gender: z.nativeEnum(Gender),
})

const registerDoctorSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Senha deve ter no minimo 8 caracteres'),
  fullName: z.string().min(3, 'Nome completo obrigatorio'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF invalido'),
  phone: z.string().min(10, 'Telefone invalido'),
  crm: z.string().min(4, 'CRM obrigatorio'),
  crmState: z.string().length(2, 'UF invalido'),
  specialty: z.array(z.string()).min(1, 'Selecione ao menos uma especialidade'),
  bio: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const authRouter = createTRPCRouter({
  // Register as patient
  registerPatient: publicProcedure
    .input(registerPatientSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findFirst({
        where: { OR: [{ email: input.email }, { cpf: input.cpf }] },
      })
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: existing.email === input.email ? 'Email ja cadastrado' : 'CPF ja cadastrado',
        })
      }

      const passwordHash = await hashPassword(input.password)

      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: UserRole.PATIENT,
          fullName: input.fullName,
          cpf: input.cpf,
          phone: input.phone,
          patient: {
            create: {
              dateOfBirth: new Date(input.dateOfBirth),
              gender: input.gender,
              address: {},
              allergies: [],
              currentMedications: [],
              primaryConditions: [],
            },
          },
        },
        include: { patient: true },
      })

      // HubSpot sync (best-effort)
      const [firstName, ...rest] = input.fullName.split(' ')
      await Promise.allSettled([
        upsertContact({
          email: user.email,
          firstName,
          lastName: rest.join(' '),
          phone: input.phone,
          role: 'PATIENT',
          status: 'REGISTERED',
        }),
      ])

      return { userId: user.id, email: user.email, role: user.role }
    }),

  // Register as doctor
  registerDoctor: publicProcedure
    .input(registerDoctorSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findFirst({
        where: { OR: [{ email: input.email }, { cpf: input.cpf }] },
      })
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email ou CPF ja cadastrado',
        })
      }

      const existingCRM = await ctx.db.doctor.findFirst({
        where: { crm: input.crm, crmState: input.crmState },
      })
      if (existingCRM) {
        throw new TRPCError({ code: 'CONFLICT', message: 'CRM ja cadastrado na plataforma' })
      }

      const passwordHash = await hashPassword(input.password)

      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: UserRole.DOCTOR,
          fullName: input.fullName,
          cpf: input.cpf,
          phone: input.phone,
          doctor: {
            create: {
              crm: input.crm,
              crmState: input.crmState,
              specialty: input.specialty,
              bio: input.bio,
            },
          },
        },
        include: { doctor: true },
      })

      // HubSpot sync (best-effort) — médico em onboarding
      const [firstName, ...rest] = input.fullName.split(' ')
      await Promise.allSettled([
        upsertContact({
          email: user.email,
          firstName,
          lastName: rest.join(' '),
          phone: input.phone,
          state: input.crmState,
          role: 'DOCTOR',
          status: 'LEAD', // vira ACTIVE quando admin aprovar
        }),
      ])

      return { userId: user.id, email: user.email, role: user.role }
    }),

  // Get current user
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.userId },
      include: {
        patient: true,
        doctor: true,
      },
    })
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' })
    return user
  }),
})
