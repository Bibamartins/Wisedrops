/**
 * External Prescription Router (PR-B)
 *
 * Fluxo "Já tenho receita": paciente que já tem prescrição médica
 * fora da WiseDrops envia 4 documentos (receita, RG, comprovante de
 * residência, autorização ANVISA opcional) + dados do médico
 * prescritor. Admin aprova/rejeita. Após aprovação, paciente é
 * direcionado direto pro catálogo (pula quiz + consulta + pagamento
 * de consulta).
 *
 * Documentos: o paciente já fez upload via /api/documents/upload
 * existente — esse router só recebe os IDs do PatientDocument e cria
 * o registro ExternalPrescription com os storageKeys correspondentes.
 *
 * Segurança: PHI sob art. 11 §2º II LGPD (tutela da saúde). Admin
 * acessa documentos via API existente de leitura (presigned URLs).
 */

import { z } from 'zod'
import {
  createTRPCRouter,
  patientProcedure,
  adminProcedure,
} from '../trpc'
import { TRPCError } from '@trpc/server'
import {
  ExternalPrescriptionStatus,
} from '@prisma/client'
import {
  sendPatientPrescriptionReadyEmail,
} from '@/server/services/email.service'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const submitSchema = z.object({
  prescriptionDocumentId: z.string().uuid('Receita inválida'),
  identityDocumentId: z.string().uuid('RG inválido'),
  addressProofDocumentId: z.string().uuid('Comprovante de residência inválido'),
  anvisaAuthDocumentId: z.string().uuid().optional(),
  doctorName: z.string().min(3, 'Nome do médico obrigatório').max(120),
  doctorCrm: z.string().optional(),
  doctorCrmState: z.string().length(2, 'UF inválida').optional(),
  conditionTreated: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
})

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const externalPrescriptionRouter = createTRPCRouter({
  /**
   * Paciente envia a documentação completa pra análise.
   * Os 4 docs precisam ter sido uploaded antes via /api/documents/upload.
   * Cria um ExternalPrescription com status PENDING.
   */
  submit: patientProcedure
    .input(submitSchema)
    .mutation(async ({ ctx, input }) => {
      const patient = await ctx.db.patient.findUnique({
        where: { userId: ctx.session.userId },
        select: { id: true, tenantId: true, user: { select: { fullName: true, email: true } } },
      })
      if (!patient) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Perfil de paciente não encontrado.' })
      }

      // Já tem uma análise em curso? Bloqueia duplicata.
      const existing = await ctx.db.externalPrescription.findFirst({
        where: {
          patientId: patient.id,
          status: { in: [ExternalPrescriptionStatus.PENDING, ExternalPrescriptionStatus.APPROVED] },
        },
        select: { id: true, status: true },
      })
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message:
            existing.status === ExternalPrescriptionStatus.PENDING
              ? 'Você já tem uma documentação em análise. Aguarde a aprovação.'
              : 'Sua documentação já foi aprovada. Acesse o catálogo de produtos.',
        })
      }

      // Resolve documentos do paciente (posse validada)
      const docIds = [
        input.prescriptionDocumentId,
        input.identityDocumentId,
        input.addressProofDocumentId,
        ...(input.anvisaAuthDocumentId ? [input.anvisaAuthDocumentId] : []),
      ]
      const docs = await ctx.db.patientDocument.findMany({
        where: { id: { in: docIds }, patientId: patient.id },
        select: { id: true, storageKey: true },
      })
      if (docs.length !== docIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Algum documento enviado não pertence a você ou não foi encontrado.',
        })
      }
      const keyByDocId = new Map(docs.map((d) => [d.id, d.storageKey]))

      const created = await ctx.db.externalPrescription.create({
        data: {
          patientId: patient.id,
          tenantId: patient.tenantId,
          prescriptionKey: keyByDocId.get(input.prescriptionDocumentId)!,
          identityDocKey: keyByDocId.get(input.identityDocumentId)!,
          addressProofKey: keyByDocId.get(input.addressProofDocumentId)!,
          anvisaAuthKey: input.anvisaAuthDocumentId
            ? keyByDocId.get(input.anvisaAuthDocumentId)
            : null,
          doctorName: input.doctorName,
          doctorCrm: input.doctorCrm,
          doctorCrmState: input.doctorCrmState?.toUpperCase(),
          conditionTreated: input.conditionTreated,
          notes: input.notes,
          status: ExternalPrescriptionStatus.PENDING,
        },
      })

      await ctx.db.auditLog.create({
        data: {
          userId: ctx.session.userId,
          action: 'external_prescription.submit',
          entityType: 'external_prescription',
          entityId: created.id,
          metadata: { doctorName: input.doctorName, hasAnvisaAuth: !!input.anvisaAuthDocumentId },
        },
      })

      // Sync HubSpot (best-effort) — status do funil
      try {
        const { upsertContact } = await import('@/server/services/hubspot.service')
        const [firstName, ...rest] = patient.user.fullName.split(' ')
        await upsertContact({
          email: patient.user.email,
          firstName,
          lastName: rest.join(' '),
          role: 'PATIENT',
          status: 'LEAD',
        })
      } catch (e) {
        console.log('[external-prescription.submit] hubspot sync skipped:', (e as Error).message)
      }

      return { id: created.id, status: created.status }
    }),

  /** Status atual da última receita externa do paciente. */
  getMyLatest: patientProcedure.query(async ({ ctx }) => {
    const patient = await ctx.db.patient.findUnique({
      where: { userId: ctx.session.userId },
      select: { id: true },
    })
    if (!patient) return null

    return ctx.db.externalPrescription.findFirst({
      where: { patientId: patient.id },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        rejectionReason: true,
        doctorName: true,
      },
    })
  }),

  /** Admin: lista receitas externas PENDENTES de análise. */
  listPending: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = { status: ExternalPrescriptionStatus.PENDING }
      const [items, total] = await Promise.all([
        ctx.db.externalPrescription.findMany({
          where,
          orderBy: { submittedAt: 'asc' }, // mais antigos primeiro
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            patient: {
              include: {
                user: { select: { fullName: true, email: true, phone: true } },
              },
            },
          },
        }),
        ctx.db.externalPrescription.count({ where }),
      ])
      return {
        items: items.map((rx) => ({
          id: rx.id,
          submittedAt: rx.submittedAt,
          doctorName: rx.doctorName,
          doctorCrm: rx.doctorCrm,
          doctorCrmState: rx.doctorCrmState,
          conditionTreated: rx.conditionTreated,
          patient: {
            id: rx.patient.id,
            fullName: rx.patient.user.fullName,
            email: rx.patient.user.email,
            phone: rx.patient.user.phone,
          },
        })),
        total,
        pages: Math.ceil(total / input.limit),
      }
    }),

  /** Admin: detalhes completos pra revisão (inclui keys dos 4 docs). */
  getByIdForAdmin: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rx = await ctx.db.externalPrescription.findUnique({
        where: { id: input.id },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true,
                  phone: true,
                  cpf: true,
                },
              },
            },
          },
        },
      })
      if (!rx) throw new TRPCError({ code: 'NOT_FOUND' })

      return {
        id: rx.id,
        status: rx.status,
        submittedAt: rx.submittedAt,
        reviewedAt: rx.reviewedAt,
        rejectionReason: rx.rejectionReason,
        doctorName: rx.doctorName,
        doctorCrm: rx.doctorCrm,
        doctorCrmState: rx.doctorCrmState,
        conditionTreated: rx.conditionTreated,
        notes: rx.notes,
        prescriptionKey: rx.prescriptionKey,
        identityDocKey: rx.identityDocKey,
        addressProofKey: rx.addressProofKey,
        anvisaAuthKey: rx.anvisaAuthKey,
        patient: {
          id: rx.patient.id,
          fullName: rx.patient.user.fullName,
          email: rx.patient.user.email,
          phone: rx.patient.user.phone,
          cpf: rx.patient.user.cpf,
          dateOfBirth: rx.patient.dateOfBirth,
          address: rx.patient.address,
          allergies: rx.patient.allergies,
          currentMedications: rx.patient.currentMedications,
        },
      }
    }),

  /** Admin: aprova. Libera o paciente pro catálogo + e-mail. */
  approve: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const rx = await ctx.db.externalPrescription.findUnique({
        where: { id: input.id },
        include: {
          patient: { include: { user: { select: { fullName: true, email: true } } } },
        },
      })
      if (!rx) throw new TRPCError({ code: 'NOT_FOUND' })
      if (rx.status !== ExternalPrescriptionStatus.PENDING) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Já foi ${rx.status.toLowerCase()}; ação inválida.`,
        })
      }

      const updated = await ctx.db.externalPrescription.update({
        where: { id: input.id },
        data: {
          status: ExternalPrescriptionStatus.APPROVED,
          reviewedAt: new Date(),
          reviewedById: ctx.session.userId,
          rejectionReason: null,
        },
      })

      await ctx.db.auditLog.create({
        data: {
          userId: ctx.session.userId,
          action: 'external_prescription.approve',
          entityType: 'external_prescription',
          entityId: rx.id,
        },
      })

      // E-mail pra paciente (best-effort)
      await Promise.allSettled([
        sendPatientPrescriptionReadyEmail({
          patientEmail: rx.patient.user.email,
          patientName: rx.patient.user.fullName,
          prescriptionId: rx.id,
        }),
      ])

      // HubSpot — atualiza status (best-effort)
      try {
        const { upsertContact } = await import('@/server/services/hubspot.service')
        const [firstName, ...rest] = rx.patient.user.fullName.split(' ')
        await upsertContact({
          email: rx.patient.user.email,
          firstName,
          lastName: rest.join(' '),
          role: 'PATIENT',
          status: 'ACTIVE',
        })
      } catch (e) {
        console.log('[external-prescription.approve] hubspot skipped:', (e as Error).message)
      }

      return { id: updated.id, status: updated.status }
    }),

  /** Admin: rejeita com motivo. */
  reject: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        reason: z.string().min(5, 'Motivo obrigatório (5+ caracteres)').max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const rx = await ctx.db.externalPrescription.findUnique({
        where: { id: input.id },
      })
      if (!rx) throw new TRPCError({ code: 'NOT_FOUND' })
      if (rx.status !== ExternalPrescriptionStatus.PENDING) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Já foi ${rx.status.toLowerCase()}; ação inválida.`,
        })
      }

      const updated = await ctx.db.externalPrescription.update({
        where: { id: input.id },
        data: {
          status: ExternalPrescriptionStatus.REJECTED,
          reviewedAt: new Date(),
          reviewedById: ctx.session.userId,
          rejectionReason: input.reason,
        },
      })

      await ctx.db.auditLog.create({
        data: {
          userId: ctx.session.userId,
          action: 'external_prescription.reject',
          entityType: 'external_prescription',
          entityId: rx.id,
          metadata: { reason: input.reason },
        },
      })

      return { id: updated.id, status: updated.status }
    }),
})
