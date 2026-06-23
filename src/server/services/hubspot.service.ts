/**
 * HubSpot Service — CRM sync (LGPD-aware)
 *
 * Todo dado que sai daqui é deliberadamente generalizado:
 * - Categoria de foco do quiz (sono | dor | ansiedade | bem_estar | outros)
 *   NUNCA o nome técnico da condição (insônia crônica, fibromialgia, etc).
 * - Nível de prioridade (alta | média | baixa), NUNCA severidade detalhada.
 * - SEM CPF, SEM respostas brutas do quiz, SEM prontuário, SEM prescrição.
 *
 * Tudo é fire-and-forget: falha do HubSpot nunca bloqueia o app.
 * Se HUBSPOT_PRIVATE_APP_TOKEN não estiver setado, todas as funções
 * fazem no-op e retornam null/false.
 *
 * Custom properties + pipelines precisam ser criadas uma vez via
 * `scripts/hubspot-setup.ts` (que vai junto desta entrega).
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
  high: 'alta',
  medium: 'media',
  low: 'baixa',
}

export function mapRiskToPriority(risk: string | null | undefined): string {
  if (!risk) return 'baixa'
  return RISK_TO_PRIORITY[risk.toLowerCase()] ?? 'baixa'
}

// ---------------------------------------------------------------------------
// Pipelines + stages (definidos no scripts/hubspot-setup.ts)
// ---------------------------------------------------------------------------

const CONSULT_PIPELINE_LABEL = 'WiseDrops · Consulta'
const ORDER_PIPELINE_LABEL   = 'WiseDrops · Pedido'

const CONSULT_STAGES = {
  QUIZ_COMPLETED: 'Quiz Completado',
  SCHEDULED:      'Agendada',
  PAID:           'Paga',
  COMPLETED:      'Realizada',
  CANCELLED:      'Cancelada',
} as const

const ORDER_STAGES = {
  CREATED:    'Pedido Criado',
  PAID:       'Pago',
  PROCESSING: 'Processando',
  SHIPPED:    'Enviado',
  DELIVERED:  'Entregue',
  CANCELLED:  'Cancelado',
} as const

type ConsultStage = keyof typeof CONSULT_STAGES
type OrderStage   = keyof typeof ORDER_STAGES

// Cache em memória de pipeline + stage IDs (resetado a cada cold start)
type PipelineInfo = { id: string; stages: Record<string, string> }
const pipelineCache: Record<string, PipelineInfo> = {}

async function getPipelineByLabel(c: Client, label: string): Promise<PipelineInfo | null> {
  if (pipelineCache[label]) return pipelineCache[label]
  try {
    const list = await c.crm.pipelines.pipelinesApi.getAll('deals')
    const found = list.results.find((p: { label: string }) => p.label === label)
    if (!found) {
      console.warn(`[hubspot] pipeline "${label}" não encontrado — rode scripts/hubspot-setup.ts`)
      return null
    }
    const stages: Record<string, string> = {}
    for (const s of (found.stages ?? []) as Array<{ label: string; id: string }>) {
      stages[s.label] = s.id
    }
    pipelineCache[label] = { id: found.id, stages }
    return pipelineCache[label]
  } catch (e) {
    console.error('[hubspot] getPipelineByLabel failed:', (e as Error).message)
    return null
  }
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
    // Tenta atualizar usando email como id (idProperty = 'email')
    const res = await c.crm.contacts.basicApi.update(input.email, { properties: props } as any, 'email' as any)
    return { id: res.id }
  } catch (e: any) {
    const status = e?.code ?? e?.statusCode ?? e?.response?.status
    if (status === 404) {
      try {
        const created = await c.crm.contacts.basicApi.create({ properties: props } as any)
        return { id: created.id }
      } catch (createErr: any) {
        // Pode dar 409 (já existe race condition) — tenta atualizar de novo
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
// Consultation deal
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

export async function createConsultationDeal(input: {
  patientEmail: string
  patientName?: string
  consultationId: string
  priceCents: number
  stage?: ConsultStage
}): Promise<{ id: string } | null> {
  const c = client()
  if (!c) return null
  try {
    const pipeline = await getPipelineByLabel(c, CONSULT_PIPELINE_LABEL)
    if (!pipeline) return null
    const stageLabel = CONSULT_STAGES[input.stage ?? 'SCHEDULED']
    const stageId = pipeline.stages[stageLabel]
    if (!stageId) {
      console.warn(`[hubspot] stage "${stageLabel}" não encontrado no pipeline Consulta`)
      return null
    }

    const contact = await upsertContact({ email: input.patientEmail, role: 'PATIENT' })
    if (!contact) return null

    // Já existe deal pra essa consulta? evita duplicar.
    const existing = await findDealByCustomId(c, 'wd_consultation_id', input.consultationId)
    if (existing) return { id: existing.id }

    const deal = await c.crm.deals.basicApi.create({
      properties: {
        dealname: `Consulta — ${input.patientName ?? input.patientEmail}`,
        dealstage: stageId,
        pipeline: pipeline.id,
        amount: String((input.priceCents / 100).toFixed(2)),
        wd_consultation_id: input.consultationId,
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
  stage: ConsultStage
}): Promise<boolean> {
  const c = client()
  if (!c) return false
  try {
    const pipeline = await getPipelineByLabel(c, CONSULT_PIPELINE_LABEL)
    if (!pipeline) return false
    const stageId = pipeline.stages[CONSULT_STAGES[input.stage]]
    if (!stageId) return false

    const existing = await findDealByCustomId(c, 'wd_consultation_id', input.consultationId)
    if (!existing) {
      // Não tem deal ainda — não cria do nada aqui; deve ter sido criado em consultation.book
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

// ---------------------------------------------------------------------------
// Order deal
// ---------------------------------------------------------------------------

export async function createOrderDeal(input: {
  patientEmail: string
  patientName?: string
  orderId: string
  totalCents: number
  stage?: OrderStage
}): Promise<{ id: string } | null> {
  const c = client()
  if (!c) return null
  try {
    const pipeline = await getPipelineByLabel(c, ORDER_PIPELINE_LABEL)
    if (!pipeline) return null
    const stageLabel = ORDER_STAGES[input.stage ?? 'CREATED']
    const stageId = pipeline.stages[stageLabel]
    if (!stageId) return null

    const contact = await upsertContact({ email: input.patientEmail, role: 'PATIENT' })
    if (!contact) return null

    const existing = await findDealByCustomId(c, 'wd_order_id', input.orderId)
    if (existing) return { id: existing.id }

    const deal = await c.crm.deals.basicApi.create({
      properties: {
        dealname: `Pedido — ${input.patientName ?? input.patientEmail}`,
        dealstage: stageId,
        pipeline: pipeline.id,
        amount: String((input.totalCents / 100).toFixed(2)),
        wd_order_id: input.orderId,
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
  stage: OrderStage
}): Promise<boolean> {
  const c = client()
  if (!c) return false
  try {
    const pipeline = await getPipelineByLabel(c, ORDER_PIPELINE_LABEL)
    if (!pipeline) return false
    const stageId = pipeline.stages[ORDER_STAGES[input.stage]]
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

// Exporta constantes pra script de setup poder reutilizar nomes
export const HUBSPOT_LABELS = {
  CONSULT_PIPELINE_LABEL,
  ORDER_PIPELINE_LABEL,
  CONSULT_STAGES,
  ORDER_STAGES,
} as const
