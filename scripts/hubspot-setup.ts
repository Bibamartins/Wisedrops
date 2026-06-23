/**
 * One-time HubSpot setup:
 * - Cria custom properties no Contact (wd_role, wd_status, wd_quiz_*)
 * - Cria custom properties no Deal (wd_consultation_id, wd_order_id)
 * - Cria os 2 pipelines de Deal (WiseDrops · Consulta + WiseDrops · Pedido)
 *
 * Idempotente: se já existir, pula sem erro.
 *
 * Como rodar:
 *   HUBSPOT_PRIVATE_APP_TOKEN=pat-... npx tsx scripts/hubspot-setup.ts
 *
 * O token precisa dos scopes:
 *   crm.objects.contacts.read/write
 *   crm.objects.deals.read/write
 *   crm.schemas.contacts.read/write
 *   crm.schemas.deals.read/write
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
// Definições — espelham hubspot.service.ts
// ---------------------------------------------------------------------------

const CONTACT_PROPERTIES = [
  {
    name: 'wd_role',
    label: 'WiseDrops · Papel',
    groupName: 'wisedrops_info',
    type: 'enumeration',
    fieldType: 'select',
    options: [
      { label: 'Paciente', value: 'PATIENT' },
      { label: 'Médico', value: 'DOCTOR' },
      { label: 'Admin', value: 'ADMIN' },
    ],
  },
  {
    name: 'wd_status',
    label: 'WiseDrops · Status',
    groupName: 'wisedrops_info',
    type: 'enumeration',
    fieldType: 'select',
    options: [
      { label: 'Lead', value: 'LEAD' },
      { label: 'Cadastrado', value: 'REGISTERED' },
      { label: 'Ativo', value: 'ACTIVE' },
      { label: 'Churn', value: 'CHURNED' },
    ],
  },
  {
    name: 'wd_quiz_completed',
    label: 'WiseDrops · Quiz Completado',
    groupName: 'wisedrops_info',
    type: 'enumeration',
    fieldType: 'booleancheckbox',
    options: [
      { label: 'Sim', value: 'true' },
      { label: 'Não', value: 'false' },
    ],
  },
  {
    name: 'wd_quiz_focus_category',
    label: 'WiseDrops · Foco do Quiz',
    groupName: 'wisedrops_info',
    type: 'enumeration',
    fieldType: 'select',
    options: [
      { label: 'Sono', value: 'sono' },
      { label: 'Dor', value: 'dor' },
      { label: 'Ansiedade', value: 'ansiedade' },
      { label: 'Bem-estar', value: 'bem_estar' },
      { label: 'Outros', value: 'outros' },
    ],
  },
  {
    name: 'wd_quiz_priority',
    label: 'WiseDrops · Prioridade do Quiz',
    groupName: 'wisedrops_info',
    type: 'enumeration',
    fieldType: 'select',
    options: [
      { label: 'Alta', value: 'alta' },
      { label: 'Média', value: 'media' },
      { label: 'Baixa', value: 'baixa' },
    ],
  },
  {
    name: 'wd_quiz_recommendation',
    label: 'WiseDrops · Recomendação do Quiz',
    groupName: 'wisedrops_info',
    type: 'string',
    fieldType: 'text',
  },
]

const DEAL_PROPERTIES = [
  {
    name: 'wd_consultation_id',
    label: 'WiseDrops · ID Consulta',
    groupName: 'dealinformation',
    type: 'string',
    fieldType: 'text',
  },
  {
    name: 'wd_order_id',
    label: 'WiseDrops · ID Pedido',
    groupName: 'dealinformation',
    type: 'string',
    fieldType: 'text',
  },
]

const PIPELINES = [
  {
    label: 'WiseDrops · Consulta',
    stages: [
      { label: 'Quiz Completado', metadata: { probability: '0.1' } },
      { label: 'Agendada',        metadata: { probability: '0.4' } },
      { label: 'Paga',            metadata: { probability: '0.7' } },
      { label: 'Realizada',       metadata: { probability: '1.0', isClosed: 'true' } },
      { label: 'Cancelada',       metadata: { probability: '0.0', isClosed: 'true' } },
    ],
  },
  {
    label: 'WiseDrops · Pedido',
    stages: [
      { label: 'Pedido Criado', metadata: { probability: '0.2' } },
      { label: 'Pago',          metadata: { probability: '0.5' } },
      { label: 'Processando',   metadata: { probability: '0.7' } },
      { label: 'Enviado',       metadata: { probability: '0.85' } },
      { label: 'Entregue',      metadata: { probability: '1.0', isClosed: 'true' } },
      { label: 'Cancelado',     metadata: { probability: '0.0', isClosed: 'true' } },
    ],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function ensurePropertyGroup(objectType: 'contacts' | 'deals', name: string, label: string) {
  try {
    await hs.crm.properties.groupsApi.create(objectType, {
      name,
      label,
      displayOrder: -1,
    } as any)
    console.log(`  ✓ grupo "${label}" criado em ${objectType}`)
  } catch (e: any) {
    const code = e?.code ?? e?.statusCode
    if (code === 409) {
      console.log(`  · grupo "${label}" já existe em ${objectType}`)
    } else {
      console.warn(`  ! grupo "${label}":`, e?.message ?? e)
    }
  }
}

async function ensureProperty(objectType: 'contacts' | 'deals', prop: any) {
  try {
    await hs.crm.properties.coreApi.create(objectType, prop)
    console.log(`  ✓ propriedade ${objectType}.${prop.name}`)
  } catch (e: any) {
    const code = e?.code ?? e?.statusCode
    if (code === 409) {
      console.log(`  · propriedade ${objectType}.${prop.name} já existe`)
    } else {
      console.warn(`  ! ${objectType}.${prop.name}:`, e?.message ?? e?.body?.message ?? e)
    }
  }
}

async function ensurePipeline(pipeline: typeof PIPELINES[number]) {
  // Lista pipelines existentes
  const existing = await hs.crm.pipelines.pipelinesApi.getAll('deals')
  const already = existing.results.find((p: any) => p.label === pipeline.label)
  if (already) {
    console.log(`  · pipeline "${pipeline.label}" já existe (${already.id})`)
    // Confirma estágios — adiciona os que faltarem
    const existingStageLabels = new Set((already.stages ?? []).map((s: any) => s.label))
    let displayOrder = (already.stages ?? []).length
    for (const stage of pipeline.stages) {
      if (existingStageLabels.has(stage.label)) continue
      try {
        await hs.crm.pipelines.pipelineStagesApi.create('deals', already.id, {
          label: stage.label,
          metadata: stage.metadata,
          displayOrder: displayOrder++,
        } as any)
        console.log(`    ✓ adicionado estágio "${stage.label}"`)
      } catch (e: any) {
        console.warn(`    ! estágio "${stage.label}":`, e?.message ?? e)
      }
    }
    return
  }

  // Cria pipeline novo
  try {
    const created = await hs.crm.pipelines.pipelinesApi.create('deals', {
      label: pipeline.label,
      displayOrder: 0,
      stages: pipeline.stages.map((s, i) => ({
        label: s.label,
        metadata: s.metadata,
        displayOrder: i,
      })),
    } as any)
    console.log(`  ✓ pipeline "${pipeline.label}" criado (${created.id})`)
  } catch (e: any) {
    console.warn(`  ! pipeline "${pipeline.label}":`, e?.message ?? e?.body?.message ?? e)
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🔧 HubSpot setup — WiseDrops\n')

  console.log('→ Grupos de propriedade')
  await ensurePropertyGroup('contacts', 'wisedrops_info', 'WiseDrops')

  console.log('\n→ Contact custom properties')
  for (const p of CONTACT_PROPERTIES) {
    await ensureProperty('contacts', p)
  }

  console.log('\n→ Deal custom properties')
  for (const p of DEAL_PROPERTIES) {
    await ensureProperty('deals', p)
  }

  console.log('\n→ Pipelines')
  for (const pipeline of PIPELINES) {
    await ensurePipeline(pipeline)
  }

  console.log('\n✅ Setup completo. HubSpot pronto pra receber sync.\n')
}

main().catch((e) => {
  console.error('\n❌ Setup falhou:', e?.message ?? e)
  process.exit(1)
})
