/**
 * HubSpot Service — CRM sync (LGPD-aware, pipeline único)
 *
 * Estratégia: HubSpot Free permite só 1 pipeline de Deal — usamos o
 * pipeline `default` da conta, com estágios do WiseDrops adicionados
 * via `scripts/hubspot-setup.ts`. Cada Deal carrega `wd_deal_type` =
 * CONSULTATION | ORDER, então no kanban dá pra filtrar por tipo.
 *
 * LGPD: tudo que sai daqui é deliberadamente generalizado.
 *  - Categoria de foco do quiz (sono | dor | ansiedade | bem_estar | outros)
 *    NUNCA o nome técnico da condição (insônia crônica, fibromialgia, etc).
 *  - Nível de prioridade (alta | média | baixa), NUNCA severidade detalhada.
 *  - SEM CPF, SEM respostas brutas do quiz, SEM prontuário, SEM prescrição.
 *
 * Fire-and-forget: falha do HubSpot nunca bloqueia o app. Sem token,
 * todas as funções fazem no-op e retornam null/false.
 */

import { Client } from '@hubspot/api-client'

const TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN

let _client: Client | null = null
function client(): Client | null {
  if (!TOKEN) return null
  if (!_client) _client = new Client({ accessToken: TOKEN })
  return _client
}

export function hubspotConfigured(): boolean {
  return !!TOKEN
}

// ---------------------------------------------------------------------------
// LGPD: mapeamento de condição crua → categoria ampla
// ---------------------------------------------------------------------------

const FOCUS_KEYWORDS: Record<string, string[]> = {
  sono:       ['insonia', 'sono', 'apneia', 'dormir'],
  dor:        ['dor', 'fibromialgia', 'neuropatia', 'enxaqueca', 'cefaleia', 'cronica'],
  ansiedade:  ['ansiedade', 'panico', 'estresse', 'tept', 'depressao'],
  bem_estar:  ['bem_estar', 'qualidade_vida', 'longevidade', 'wellness'],
}

export function mapToFocusCategory(condition: string | null | undefined): string {
  if (!condition) return 'outros'
  const c = condition.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  for (const [cat, words] of Object.entries(FOCUS_KEYWORDS)) {
    if (words.some((w) => c.includes(w))) return cat
  }
  return 'outros'
}

const RISK_TO_PRIORITY: Record<string, string> = {
  high: 'alta', medium: 'media', low: 'baixa',
}

export function mapRiskToPriority(risk: string | null | undefined): string {
  if (!risk) return 'baixa'
  return RISK_TO_PRIORITY[risk.toLowerCase()] ?? 'baixa'
}

// ---------------------------------------------------------------------------
// Pipeline único + estágios
// ---------------------------------------------------------------------------

const PIPELINE_ID = 'default' // único pipeline disponível no Free

// Estágios WiseDrops (criados em scripts/hubspot-setup.ts). Servem
// AMBOS Consulta e Pedido — `wd_deal_type` separa visualmente.
const STAGE_LABELS = {
  QUIZ_COMPLETED:       'Quiz Completado',
  CONSULT_SCHEDULED:    'Consulta Agendada',
  CONSULT_PAID:         'Consulta Paga',
  CONSULT_COMPLETED:    'Consulta Realizada',
  ORDER_CREATED:        'Pedido Criado',
  ORDER_PAID:           'Pedido Pago',
  ORDER_SHIPPED:        'Pedido Enviado',
  ORDER_DELIVERED:      'Pedido Entregue',
  CANCELLED:            'Cancelado',
} as const

type StageKey = keyof typeof STAGE_LABELS

// Cache em memória de stage label → stage ID (resetado a cada cold start)
let stageIdCache: Record<string, string> | null = null

async function getStageIds(c: Client): Promise<Record<string, string>> {
  if (stageIdCache) return stageIdCache
  try {
    const list = await c.crm.pipelines.pipelinesApi.getAll('deals')
    const def = list.results.find((p: any) => p.id === PIPELINE_ID)
    if (!def) {
      console.warn('[hubspot] pipeline default não encontrado')
      return {}
    }
    const ids: Record<string, string> = {}
    for (const s of (def.stages ?? []) as Array<{ label: string; id: string }>) {
      ids[s.label] = s.id
    }
    stageIdCache = ids
    return ids
  } catch (e) {
    console.error('[hubspot] getStageIds failed:', (e as Error).message)
    return {}
  }
}

async function resolveStageId(c: Client, key: StageKey): Promise<string | null> {
  const ids = await getStageIds(c)
  const label = STAGE_LABELS[key]
  const id = ids[label]
  if (!id) {
    console.warn(`[hubspot] estágio "${label}" não encontrado — rode 'npm run hubspot:setup'`)
    return null
  }
  return id
}

// ---------------------------------------------------------------------------
// Contact upsert
// ---------------------------------------------------------------------------

export type UpsertContactInput = {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  city?: string
  state?: string
  role?: 'PATIENT' | 'DOCTOR' | 'ADMIN'
  status?: 'LEAD' | 'REGISTERED' | 'ACTIVE' | 'CHURNED'
  quizCompleted?: boolean
  quizFocusCategory?: string
  quizPriority?: 'alta' | 'media' | 'baixa'
  quizRecommendation?: string
  utmSource?: string
  utmMedium?: string
}

export async function upsertContact(input: UpsertContactInput): Promise<{ id: string } | null> {
  const c = client()
  if (!c) return null

  const props: Record<string, string> = { email: input.email }
  if (input.firstName) props.firstname = input.firstName
  if (input.lastName)  props.lastname  = input.lastName
  if (input.phone)     props.phone     = input.phone
  if (input.city)      props.city      = input.city
  if (input.state)     props.state     = input.state
  if (input.role)      props.wd_role   = input.role
  if (input.status)    props.wd_status = input.status
  if (input.quizCompleted !== undefined) props.wd_quiz_completed = input.quizCompleted ? 'true' : 'false'
  if (input.quizFocusCategory) props.wd_quiz_focus_category = input.quizFocusCategory
  if (input.quizPriority)      props.wd_quiz_priority       = input.quizPriority
  if (input.quizRecommendation) props.wd_quiz_recommendation = input.quizRecommendation
  if (input.utmSource) props.hs_analytics_source = input.utmSource
  if (input.utmMedium) props.hs_analytics_source_data_1 = input.utmMedium

  try {
    const res = await c.crm.contacts.basicApi.update(input.email, { properties: props } as any, 'email' as any)
    return { id: res.id }
  } catch (e: any) {
    const status = e?.code ?? e?.statusCode ?? e?.response?.status
    if (status === 404) {
      try {
        const created = await c.crm.contacts.basicApi.create({ properties: props } as any)
        return { id: created.id }
      } catch (createErr: any) {
        const cstatus = createErr?.code ?? createErr?.statusCode
        if (cstatus === 409) {
          try {
            const retry = await c.crm.contacts.basicApi.update(input.email, { properties: props } as any, 'email' as any)
            return { id: retry.id }
          } catch {
            console.error('[hubspot] upsertContact retry failed')
            return null
          }
        }
        console.error('[hubspot] create contact failed:', createErr?.message ?? createErr)
        return null
      }
    }
    console.error('[hubspot] upsert contact failed:', e?.message ?? e)
    return null
  }
}

// ---------------------------------------------------------------------------
// Quiz tracking — apenas atualiza propriedades do contato
// ---------------------------------------------------------------------------

export async function trackQuizCompleted(input: {
  patientEmail: string
  firstName?: string
  lastName?: string
  phone?: string
  rawPriorityCondition?: string
  rawRiskLevel?: string
  recommendation?: string
  utmSource?: string
}): Promise<void> {
  if (!hubspotConfigured()) return
  const focusCategory = mapToFocusCategory(input.rawPriorityCondition)
  const priority = mapRiskToPriority(input.rawRiskLevel) as 'alta' | 'media' | 'baixa'
  await upsertContact({
    email: input.patientEmail,
    firstName: input.firstName,
    lastName:  input.lastName,
    phone:     input.phone,
    role:      'PATIENT',
    status:    'LEAD',
    quizCompleted: true,
    quizFocusCategory: focusCategory,
    quizPriority: priority,
    quizRecommendation: input.recommendation,
    utmSource: input.utmSource,
  })
}

// ---------------------------------------------------------------------------
// Deals — Consulta + Pedido no MESMO pipeline
// ---------------------------------------------------------------------------

async function findDealByCustomId(c: Client, propertyName: string, value: string) {
  try {
    const search = await c.crm.deals.searchApi.doSearch({
      filterGroups: [{ filters: [{ propertyName, operator: 'EQ' as any, value } as any] }],
      properties: ['dealname', 'dealstage', propertyName],
      limit: 1,
    } as any)
    return search.results[0] ?? null
  } catch (e) {
    console.error('[hubspot] findDealByCustomId failed:', (e as Error).message)
    return null
  }
}

// ----- Consulta -----

type ConsultStageKey = 'SCHEDULED' | 'PAID' | 'COMPLETED' | 'CANCELLED'

const CONSULT_STAGE_MAP: Record<ConsultStageKey, StageKey> = {
  SCHEDULED:  'CONSULT_SCHEDULED',
  PAID:       'CONSULT_PAID',
  COMPLETED:  'CONSULT_COMPLETED',
  CANCELLED:  'CANCELLED',
}

export async function createConsultationDeal(input: {
  patientEmail: string
  patientName?: string
  consultationId: string
  priceCents: number
  stage?: ConsultStageKey
}): Promise<{ id: string } | null> {
  const c = client()
  if (!c) return null
  try {
    const stageId = await resolveStageId(c, CONSULT_STAGE_MAP[input.stage ?? 'SCHEDULED'])
    if (!stageId) return null

    const contact = await upsertContact({ email: input.patientEmail, role: 'PATIENT' })
    if (!contact) return null

    const existing = await findDealByCustomId(c, 'wd_consultation_id', input.consultationId)
    if (existing) return { id: existing.id }

    const deal = await c.crm.deals.basicApi.create({
      properties: {
        dealname:    `Consulta — ${input.patientName ?? input.patientEmail}`,
        dealstage:   stageId,
        pipeline:    PIPELINE_ID,
        amount:      String((input.priceCents / 100).toFixed(2)),
        wd_consultation_id: input.consultationId,
        wd_deal_type: 'CONSULTATION',
      },
      associations: [{
        to: { id: contact.id },
        types: [{ associationCategory: 'HUBSPOT_DEFINED' as any, associationTypeId: 3 }],
      }] as any,
    } as any)
    return { id: deal.id }
  } catch (e: any) {
    console.error('[hubspot] createConsultationDeal failed:', e?.message ?? e)
    return null
  }
}

export async function moveConsultationDealStage(input: {
  patientEmail: string
  consultationId: string
  stage: ConsultStageKey
}): Promise<boolean> {
  const c = client()
  if (!c) return false
  try {
    const stageId = await resolveStageId(c, CONSULT_STAGE_MAP[input.stage])
    if (!stageId) return false

    const existing = await findDealByCustomId(c, 'wd_consultation_id', input.consultationId)
    if (!existing) {
      console.warn(`[hubspot] deal não encontrado pra consultation ${input.consultationId}`)
      return false
    }

    await c.crm.deals.basicApi.update(existing.id, {
      properties: { dealstage: stageId },
    } as any)
    return true
  } catch (e: any) {
    console.error('[hubspot] moveConsultationDealStage failed:', e?.message ?? e)
    return false
  }
}

// ----- Pedido -----

type OrderStageKey = 'CREATED' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

const ORDER_STAGE_MAP: Record<OrderStageKey, StageKey> = {
  CREATED:     'ORDER_CREATED',
  PAID:        'ORDER_PAID',
  PROCESSING:  'ORDER_PAID', // sem estágio dedicado — fica em "Pago" até enviar
  SHIPPED:     'ORDER_SHIPPED',
  DELIVERED:   'ORDER_DELIVERED',
  CANCELLED:   'CANCELLED',
}

export async function createOrderDeal(input: {
  patientEmail: string
  patientName?: string
  orderId: string
  totalCents: number
  stage?: OrderStageKey
}): Promise<{ id: string } | null> {
  const c = client()
  if (!c) return null
  try {
    const stageId = await resolveStageId(c, ORDER_STAGE_MAP[input.stage ?? 'CREATED'])
    if (!stageId) return null

    const contact = await upsertContact({ email: input.patientEmail, role: 'PATIENT' })
    if (!contact) return null

    const existing = await findDealByCustomId(c, 'wd_order_id', input.orderId)
    if (existing) return { id: existing.id }

    const deal = await c.crm.deals.basicApi.create({
      properties: {
        dealname:    `Pedido — ${input.patientName ?? input.patientEmail}`,
        dealstage:   stageId,
        pipeline:    PIPELINE_ID,
        amount:      String((input.totalCents / 100).toFixed(2)),
        wd_order_id: input.orderId,
        wd_deal_type: 'ORDER',
      },
      associations: [{
        to: { id: contact.id },
        types: [{ associationCategory: 'HUBSPOT_DEFINED' as any, associationTypeId: 3 }],
      }] as any,
    } as any)
    return { id: deal.id }
  } catch (e: any) {
    console.error('[hubspot] createOrderDeal failed:', e?.message ?? e)
    return null
  }
}

export async function moveOrderDealStage(input: {
  patientEmail: string
  orderId: string
  stage: OrderStageKey
}): Promise<boolean> {
  const c = client()
  if (!c) return false
  try {
    const stageId = await resolveStageId(c, ORDER_STAGE_MAP[input.stage])
    if (!stageId) return false

    const existing = await findDealByCustomId(c, 'wd_order_id', input.orderId)
    if (!existing) {
      console.warn(`[hubspot] deal não encontrado pra order ${input.orderId}`)
      return false
    }

    await c.crm.deals.basicApi.update(existing.id, {
      properties: { dealstage: stageId },
    } as any)
    return true
  } catch (e: any) {
    console.error('[hubspot] moveOrderDealStage failed:', e?.message ?? e)
    return false
  }
}

// Exporta constantes pra script de setup poder reutilizar
export const HUBSPOT_LABELS = {
  PIPELINE_ID,
  STAGE_LABELS,
} as const
