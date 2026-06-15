/**
 * POST /api/documents/upload
 * Body: multipart/form-data { file, type }
 * Salva o arquivo no Netlify Blobs (privado por padrão) e cria o registro
 * em PatientDocument. Só paciente autenticado pode enviar.
 */
import type { NextRequest } from 'next/server'
import crypto from 'crypto'
import { auth } from '@/server/auth'
import { db } from '@/server/db/client'
import { getStore } from '@netlify/blobs'
import { DOCUMENT_TYPES } from '@/server/trpc/routers/document.router'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
])
const ALLOWED_DOC_TYPES = new Set<string>(DOCUMENT_TYPES)

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const patient = await db.patient.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!patient) {
    return Response.json({ error: 'Perfil de paciente não encontrado' }, { status: 404 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return Response.json({ error: 'Corpo inválido (esperado multipart/form-data)' }, { status: 400 })
  }

  const file = form.get('file')
  const type = form.get('type')

  if (!(file instanceof File)) {
    return Response.json({ error: 'Arquivo ausente' }, { status: 400 })
  }
  if (typeof type !== 'string' || !ALLOWED_DOC_TYPES.has(type)) {
    return Response.json({ error: 'Tipo de documento inválido' }, { status: 400 })
  }
  if (file.size === 0) {
    return Response.json({ error: 'Arquivo vazio' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: 'Arquivo maior que 10 MB' }, { status: 400 })
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return Response.json(
      { error: 'Formato não permitido. Use JPG, PNG, WEBP ou PDF.' },
      { status: 400 },
    )
  }

  const docId = crypto.randomUUID()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
  const storageKey = `${patient.id}/${docId}/${safeName}`

  try {
    const arrayBuffer = await file.arrayBuffer()
    const store = getStore('patient-documents')
    await store.set(storageKey, new Uint8Array(arrayBuffer), {
      metadata: { contentType: file.type, originalName: file.name },
    })
  } catch (err) {
    console.error('[documents] Falha ao salvar blob:', err)
    return Response.json({ error: 'Falha ao salvar o arquivo' }, { status: 500 })
  }

  const doc = await db.patientDocument.create({
    data: {
      id: docId,
      patientId: patient.id,
      type,
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      storageKey,
    },
  })

  return Response.json({ ok: true, document: doc })
}
