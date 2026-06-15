/**
 * GET /api/payments/paypal/cancel?cid=CONSULTATION_ID
 * PayPal redireciona pra cá quando o usuário cancela o pagamento.
 * A consulta fica como está (o paciente pode tentar pagar de novo depois).
 */
import type { NextRequest } from 'next/server'

const SITE = process.env.NEXTAUTH_URL || 'https://wisedrops-303.netlify.app'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const cid = url.searchParams.get('cid')
  return Response.redirect(
    `${SITE}/consultations?payment=cancelled${cid ? `&cid=${cid}` : ''}`,
    302,
  )
}
