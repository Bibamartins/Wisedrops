import { z } from 'zod'
import { createTRPCRouter, patientProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { getStore } from '@netlify/blobs'

export const DOCUMENT_TYPES = [
  'identity',
  'address_proof',
  'anvisa_auth',
  'medical_report',
  'exam',
  'other',
] as const

export const documentRouter = createTRPCRouter({
  // Paciente lista seus documentos.
  listForPatient: patientProcedure
    .input(z.object({}).optional().default({}))
    .query(async ({ ctx }) => {
      const patient = await ctx.db.patient.findUnique({
        where: { userId: ctx.session.userId },
        select: { id: true },
      })
      if (!patient) throw new TRPCError({ code: 'NOT_FOUND' })
      const documents = await ctx.db.patientDocument.findMany({
        where: { patientId: patient.id },
        orderBy: { uploadedAt: 'desc' },
      })
      return { documents }
    }),

  // Paciente deleta um documento próprio.
  delete: patientProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const patient = await ctx.db.patient.findUnique({
        where: { userId: ctx.session.userId },
        select: { id: true },
      })
      if (!patient) throw new TRPCError({ code: 'NOT_FOUND' })
      const doc = await ctx.db.patientDocument.findUnique({ where: { id: input.id } })
      if (!doc) throw new TRPCError({ code: 'NOT_FOUND' })
      if (doc.patientId !== patient.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' })
      }
      try {
        const store = getStore('patient-documents')
        await store.delete(doc.storageKey)
      } catch (err) {
        console.error('[documents] Falha ao remover blob:', err)
      }
      await ctx.db.patientDocument.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
