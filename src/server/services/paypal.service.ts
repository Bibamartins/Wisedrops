/**
 * Integração PayPal REST API — sem dependência externa, só fetch.
 * Suporta sandbox e live via PAYPAL_ENV.
 *
 * Variáveis de ambiente necessárias (no Netlify):
 *  - PAYPAL_CLIENT_ID
 *  - PAYPAL_CLIENT_SECRET
 *  - PAYPAL_ENV = "sandbox" | "live" (default "sandbox")
 */

const PAYPAL_BASE = (process.env.PAYPAL_ENV || 'sandbox') === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

export function paypalConfigured(): boolean {
  return !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !secret) {
    throw new Error('PayPal não configurado (faltam PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET).')
  }
  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64')
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`PayPal token error ${res.status}: ${body.slice(0, 200)}`)
  }
  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

export interface CreateOrderInput {
  amountCents: number
  description: string
  referenceId?: string
  returnUrl: string
  cancelUrl: string
  currency?: string // default BRL
}

export interface CreateOrderResult {
  orderId: string
  approveUrl: string
}

export async function createPaypalOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const token = await getAccessToken()
  const currency = input.currency ?? 'BRL'
  const value = (input.amountCents / 100).toFixed(2)
  const body = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: input.referenceId,
        description: input.description.slice(0, 127),
        amount: {
          currency_code: currency,
          value,
        },
      },
    ],
    application_context: {
      brand_name: 'WiseDrops',
      user_action: 'PAY_NOW',
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      shipping_preference: 'NO_SHIPPING',
    },
  }
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as {
    id: string
    links: Array<{ rel: string; href: string; method: string }>
  }
  if (!res.ok || !data.id) {
    throw new Error(`PayPal createOrder error: ${JSON.stringify(data).slice(0, 300)}`)
  }
  const approve = data.links.find((l) => l.rel === 'approve')?.href
  if (!approve) {
    throw new Error('PayPal não retornou link de aprovação.')
  }
  return { orderId: data.id, approveUrl: approve }
}

export interface CaptureOrderResult {
  orderId: string
  status: string
  payerEmail?: string
  amount?: string
  currency?: string
  captureId?: string
}

export async function capturePaypalOrder(orderId: string): Promise<CaptureOrderResult> {
  const token = await getAccessToken()
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  const data = (await res.json()) as {
    id?: string
    status?: string
    payer?: { email_address?: string }
    purchase_units?: Array<{
      payments?: { captures?: Array<{ id: string; amount?: { value: string; currency_code: string } }> }
    }>
    name?: string
    message?: string
  }
  if (!res.ok) {
    throw new Error(`PayPal capture error: ${data.message || JSON.stringify(data).slice(0, 200)}`)
  }
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0]
  return {
    orderId: data.id || orderId,
    status: data.status || 'UNKNOWN',
    payerEmail: data.payer?.email_address,
    amount: capture?.amount?.value,
    currency: capture?.amount?.currency_code,
    captureId: capture?.id,
  }
}

export async function getPaypalOrder(orderId: string): Promise<{ status: string }> {
  const token = await getAccessToken()
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as { status?: string }
  if (!res.ok) {
    throw new Error('PayPal getOrder error')
  }
  return { status: data.status || 'UNKNOWN' }
}
