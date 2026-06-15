/**
 * GET /api/documents/{id}
 * Devolve o conteúdo do documento (com Content-Type correto), com checagem de
 * acesso: o próprio paciente, um admin, ou um médico que atendeu esse paciente.
 */
import type { NextRequest } from 'next/server'
import { auth } from '@/server/auth'
import { db } from '@/server/db/client'
import { getStore } from '@netlify/blobs'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const doc = await db.patientDocument.findUnique({
    where: { id: ctx.params.id },
    include: { patient: { select: { id: true, userId: true } } },
  })
  if (!doc) return new Response('Not found', { status: 404 })

  const isPatient = doc.patient.userId === session.user.id
  const isAdmin = session.user.role === 'ADMIN'
  let isDoctor = false

  if (!isPatient && !isAdmin && session.user.role === 'DOCTOR') {
    const doctor = await db.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (doctor) {
      const link = await db.consultation.findFirst({
        where: { doctorId: doctor.id, patientId: doc.patient.id },
        select: { id: true },
      })
      if (link) isDoctor = true
    }
  }

  if (!isPatient && !isAdmin && !isDoctor) {
    return new Response('Forbidden', { status: 403 })
  }

  try {
    const store = getStore('patient-documents')
    const blob = await store.get(doc.storageKey, { type: 'arrayBuffer' })
    if (!blob) return new Response('File missing from storage', { status: 404 })
    return new Response(blob, {
      headers: {
        'Content-Type': doc.contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(doc.fileName)}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    console.error('[documents] Falha ao ler blob:', err)
    return new Response('Storage error', { status: 500 })
  }
}
