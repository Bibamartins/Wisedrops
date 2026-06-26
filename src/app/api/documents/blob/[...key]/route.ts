/**
 * GET /api/documents/blob/{storageKey}
 *
 * Serve um blob direto pelo storageKey (não pelo ID do PatientDocument).
 * Usado pelo admin pra visualizar documentos da ExternalPrescription
 * sem precisar resolver o documentId.
 *
 * Acesso: APENAS ADMIN. Documentos sob art. 11 §2º II LGPD (tutela
 * por profissional de saúde + responsável legal pela plataforma).
 */
import type { NextRequest } from 'next/server'
import { auth } from '@/server/auth'
import { getStore } from '@netlify/blobs'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: { key: string[] } }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return new Response('Forbidden', { status: 403 })
  }

  const storageKey = ctx.params.key.join('/')
  if (!storageKey) return new Response('Bad Request', { status: 400 })

  try {
    const store = getStore('patient-documents')
    const meta = await store.getMetadata(storageKey)
    if (!meta) return new Response('Not found', { status: 404 })

    const blob = await store.get(storageKey, { type: 'arrayBuffer' })
    if (!blob) return new Response('Not found', { status: 404 })

    const contentType = (meta.metadata?.contentType as string | undefined) ?? 'application/octet-stream'
    const originalName = (meta.metadata?.originalName as string | undefined) ?? 'document'

    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${originalName}"`,
        'Cache-Control': 'private, max-age=60',
      },
    })
  } catch (err) {
    console.error('[documents/blob] erro ao servir:', err)
    return new Response('Internal Error', { status: 500 })
  }
}
