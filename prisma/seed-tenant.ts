/**
 * seed-tenant.ts — Cria o Tenant default 'wisedrops' e vincula todos os
 * registros existentes (User, Doctor, Patient, Product) a ele.
 *
 * Idempotente: pode rodar N vezes sem duplicar dados.
 * Executar após cada db push/migrate no ambiente local ou no Netlify build.
 *
 * Uso:
 *   npx tsx prisma/seed-tenant.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('[seed-tenant] iniciando...')

  // 1. Criar (ou resgatar) o tenant default
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'wisedrops' },
    update: {
      name: 'WiseDrops',
      active: true,
      brandJson: {
        primaryColor: '#2D6A4F',
        secondaryColor: '#95D5B2',
        logoUrl: '/brand/logo-wisedrops.svg',
        displayName: 'WiseDrops',
        domain: 'wisedrops.com.br',
      },
    },
    create: {
      slug: 'wisedrops',
      name: 'WiseDrops',
      active: true,
      brandJson: {
        primaryColor: '#2D6A4F',
        secondaryColor: '#95D5B2',
        logoUrl: '/brand/logo-wisedrops.svg',
        displayName: 'WiseDrops',
        domain: 'wisedrops.com.br',
      },
    },
  })

  console.log(`[seed-tenant] tenant '${tenant.slug}' pronto (id: ${tenant.id})`)

  // 2. Vincular Users sem tenantId
  const usersUpdated = await prisma.user.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  })
  console.log(`[seed-tenant] Users vinculados: ${usersUpdated.count}`)

  // 3. Vincular Doctors sem tenantId
  const doctorsUpdated = await prisma.doctor.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  })
  console.log(`[seed-tenant] Doctors vinculados: ${doctorsUpdated.count}`)

  // 4. Vincular Patients sem tenantId
  const patientsUpdated = await prisma.patient.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  })
  console.log(`[seed-tenant] Patients vinculados: ${patientsUpdated.count}`)

  // 5. Vincular Products sem tenantId
  const productsUpdated = await prisma.product.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  })
  console.log(`[seed-tenant] Products vinculados: ${productsUpdated.count}`)

  console.log('[seed-tenant] concluido.')
}

main()
  .catch((e) => {
    console.error('[seed-tenant] erro:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
