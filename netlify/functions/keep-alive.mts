/**
 * Função agendada do Netlify — chama /api/keep-alive uma vez por dia.
 * Mantém o banco (Supabase Free) ativo, evitando a pausa automática por
 * inatividade (~7 dias). Custo zero, totalmente automático.
 */
import type { Config } from '@netlify/functions'

export default async () => {
  const base = process.env.URL || 'https://wisedrops-303.netlify.app'
  try {
    const res = await fetch(`${base}/api/keep-alive`)
    const body = await res.text()
    console.log(`[keep-alive] ${res.status} ${body.slice(0, 120)}`)
    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('[keep-alive] fetch failed:', err)
    return new Response('error', { status: 500 })
  }
}

// Roda 1× por dia, às 12:00 UTC (≈ 9h BRT).
export const config: Config = {
  schedule: '0 12 * * *',
}
