/**
 * One-time HubSpot setup (idempotente, re-rodável):
 * - Contact custom properties: wd_role, wd_status, wd_quiz_*
 * - Deal custom properties:    wd_consultation_id, wd_order_id, wd_deal_type
 * - Atualiza o pipeline DEFAULT de deals com os estágios do WiseDrops
 *   (HubSpot Free permite só 1 pipeline → usamos o default).
 *
 * Como rodar:
 *   HUBSPOT_PRIVATE_APP_TOKEN=pat-... npx tsx scripts/hubspot-setup.ts
 *
 * Re-rodar quando subir do plano Free pro Starter? Pode — o script é
 * idempotente e os estágios já criados serão pulados.
 */

import 'dotenv/config'
import { Client } from '@hubspot/api-client'

const TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN
if (!TOKEN) {
  console.error('❌ HUBSPOT_PRIVATE_APP_TOKEN ausente. Abortando.')
  process.exit(1)
}

const hs = new Client({ accessToken: TOKEN })

// ---------------------------------------------------------------------------
// Properties — espelham hubspot.service.ts
// ---------------------------------------------------------------------------

const CONTACT_PROPERTIES = [
  {
    name: 'wd_role', label: 'WiseDrops · Papel',
    groupName: 'wisedrops_info', type: 'enumeration', fieldType: 'select',
    options: [
      { label: 'Paciente', value: 'PATIENT' },
      { label: 'Médico',   value: 'DOCTOR' },
      { label: 'Admin',    value: 'ADMIN' },
    ],
  },
  {
    name: 'wd_status', label: 'WiseDrops · Status',
    groupName: 'wisedrops_info', type: 'enumeration', fieldType: 'select',
    options: [
      { label: 'Lead',       value: 'LEAD' },
      { label: 'Cadastrado', value: 'REGISTERED' },
      { label: 'Ativo',      value: 'ACTIVE' },
      { label: 'Churn',      value: 'CHURNED' },
    ],
  },
  {
    name: 'wd_quiz_completed', label: 'WiseDrops · Quiz Completado',
    groupName: 'wisedrops_info', type: 'enumeration', fieldType: 'booleancheckbox',
    options: [
      { label: 'Sim', value: 'true' },
      { label: 'Não', value: 'false' },
    ],
  },
  {
    name: 'wd_quiz_focus_category', label: 'WiseDrops · Foco do Quiz',
    groupName: 'wisedrops_info', type: 'enumeration', fieldType: 'select',
    options: [
      { label: 'Sono',      value: 'sono' },
      { label: 'Dor',       value: 'dor' },
      { label: 'Ansiedade', value: 'ansiedade' },
      { label: 'Bem-estar', value: 'bem_estar' },
      { label: 'Outros',    value: 'outros' },
    ],
  },
  {
    name: 'wd_quiz_priority', label: 'WiseDrops · Prioridade do Quiz',
    groupName: 'wisedrops_info', type: 'enumeration', fieldType: 'select',
    options: [
      { label: 'Alta',  value: 'alta' },
      { label: 'Média', value: 'media' },
      { label: 'Baixa', value: 'baixa' },
    ],
  },
  {
    name: 'wd_quiz_recommendation', label: 'WiseDrops · Recomendação do Quiz',
    groupName: 'wisedrops_info', type: 'string', fieldType: 'text',
  },
]

const DEAL_PROPERTIES = [
  {
    name: 'wd_consultation_id', label: 'WiseDrops · ID Consulta',
    groupName: 'dealinformation', type: 'string', fieldType: 'text',
  },
  {
    name: 'wd_order_id', label: 'WiseDrops · ID Pedido',
    groupName: 'dealinformation', type: 'string', fieldType: 'text',
  },
  {
    name: 'wd_deal_type', label: 'WiseDrops · Tipo',
    groupName: 'dealinformation', type: 'enumeration', fieldType: 'select',
    options: [
      { label: 'Consulta', value: 'CONSULTATION' },
      { label: 'Pedido',   value: 'ORDER' },
    ],
  },
]

// Estágios WiseDrops adicionados ao pipeline DEFAULT.
// 9 estágios cobrem a jornada inteira (consulta + pedido).
const WD_STAGES = [
  { label: 'Quiz Completado',    metadata: { probability: '0.10' } },
  { label: 'Consulta Agendada',  metadata: { probability: '0.30' } },
  { label: 'Consulta Paga',      metadata: { probability: '0.50' } },
  { label: 'Consulta Realizada', metadata: { probability: '0.70' } },
  { label: 'Pedido Criado',      metadata: { probability: '0.75' } },
  { label: 'Pedido Pago',        metadata: { probability: '0.85' } },
  { label: 'Pedido Enviado',     metadata: { probability: '0.95' } },
  { label: 'Pedido Entregue',    metadata: { probability: '1.00', isClosed: 'true' } },
  { label: 'Cancelado',          metadata: { probability: '0.00', isClosed: 'true' } },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function ensurePropertyGroup(objectType: 'contacts' | 'deals', name: string, label: string) {
  try {
    await hs.crm.properties.groupsApi.create(objectType, {
      name, label, displayOrder: -1,
    } as any)
    console.log(`  ✓ grupo "${label}" criado em ${objectType}`)
  } catch (e: any) {
    const code = e?.code ?? e?.statusCode
    if (code === 409) console.log(`  · grupo "${label}" já existe em ${objectType}`)
    else console.warn(`  ! grupo "${label}":`, e?.message ?? e)
  }
}

async function ensureProperty(objectType: 'contacts' | 'deals', prop: any) {
  try {
    await hs.crm.properties.coreApi.create(objectType, prop)
    console.log(`  ✓ propriedade ${objectType}.${prop.name}`)
  } catch (e: any) {
    const code = e?.code ?? e?.statusCode
    if (code === 409) console.log(`  · propriedade ${objectType}.${prop.name} já existe`)
    else console.warn(`  ! ${objectType}.${prop.name}:`, e?.body?.message ?? e?.message ?? e)
  }
}

async function ensureStagesInDefaultPipeline() {
  // Lê o pipeline default e descobre quais estágios WiseDrops já existem
  const list = await hs.crm.pipelines.pipelinesApi.getAll('deals')
  const def = list.results.find((p: any) => p.id === 'default')
  if (!def) {
    console.warn('  ! pipeline "default" não encontrado — pulando estágios')
    return
  }
  const existingLabels = new Set((def.stages ?? []).map((s: any) => s.label))
  let displayOrder = (def.stages ?? []).length

  for (const stage of WD_STAGES) {
    if (existingLabels.has(stage.label)) {
      console.log(`  · estágio "${stage.label}" já existe`)
      continue
    }
    try {
      await hs.crm.pipelines.pipelineStagesApi.create('deals', 'default', {
        label: stage.label,
        metadata: stage.metadata,
        displayOrder: displayOrder++,
      } as any)
      console.log(`  ✓ estágio "${stage.label}" adicionado`)
    } catch (e: any) {
      console.warn(`  ! estágio "${stage.label}":`, e?.body?.message ?? e?.message ?? e)
    }
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🔧 HubSpot setup — WiseDrops (pipeline único / plano Free)\n')

  console.log('→ Grupos de propriedade')
  await ensurePropertyGroup('contacts', 'wisedrops_info', 'WiseDrops')

  console.log('\n→ Contact custom properties')
  for (const p of CONTACT_PROPERTIES) await ensureProperty('contacts', p)

  console.log('\n→ Deal custom properties')
  for (const p of DEAL_PROPERTIES) await ensureProperty('deals', p)

  console.log('\n→ Estágios no pipeline default')
  await ensureStagesInDefaultPipeline()

  console.log('\n✅ Setup completo. HubSpot pronto pra receber sync.\n')
}

main().catch((e) => {
  console.error('\n❌ Setup falhou:', e?.message ?? e)
  process.exit(1)
})
