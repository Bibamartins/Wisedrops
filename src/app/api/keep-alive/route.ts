/**
 * Health/keep-alive endpoint — chamado 1×/dia pela função agendada do Netlify
 * para manter o Supabase Free contando como "ativo" (evita a pausa automática
 * após ~7 dias de inatividade).
 *
 * Faz um SELECT 1 mínimo (sem expor dados).
 */
import { db } from '@/server/db/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return Response.json({ ok: true, ts: new Date().toISOString() })
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : 'db error' },
      { status: 500 },
    )
  }
}
