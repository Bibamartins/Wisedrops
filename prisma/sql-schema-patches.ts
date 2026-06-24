/**
 * Patches SQL idempotentes que aplicam direto no banco de produção
 * sem depender do `prisma db push` (que falha silenciosamente em alguns
 * casos quando o schema diff envolve coluna nova + index único nullable).
 *
 * Cobre: PR 5 (multi-tenant) + PR 7 (marketplace).
 *
 * Usa CREATE/ADD/CREATE INDEX IF NOT EXISTS — pode rodar várias vezes
 * sem efeito colateral. Plugado em scripts/db-setup.sh ANTES do db push.
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const PATCHES = [
  // ---- PR 5: Multi-tenant ----
  `CREATE TABLE IF NOT EXISTS "tenants" (
    "id"        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug"      varchar UNIQUE NOT NULL,
    "name"      varchar NOT NULL,
    "brand"     jsonb,
    "createdAt" timestamp(3) DEFAULT now(),
    "updatedAt" timestamp(3) DEFAULT now()
  )`,
  `ALTER TABLE "users"    ADD COLUMN IF NOT EXISTS "tenantId" uuid`,
  `ALTER TABLE "doctors"  ADD COLUMN IF NOT EXISTS "tenantId" uuid`,
  `ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "tenantId" uuid`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "tenantId" uuid`,

  `CREATE INDEX IF NOT EXISTS "users_tenantId_idx"    ON "users"("tenantId")`,
  `CREATE INDEX IF NOT EXISTS "doctors_tenantId_idx"  ON "doctors"("tenantId")`,
  `CREATE INDEX IF NOT EXISTS "patients_tenantId_idx" ON "patients"("tenantId")`,
  `CREATE INDEX IF NOT EXISTS "products_tenantId_idx" ON "products"("tenantId")`,

  // ---- PR 7: Marketplace de médicos ----
  `ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "slug"               varchar`,
  `ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "photoUrl"           varchar`,
  `ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "headline"           varchar(120)`,
  `ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "yearsOfExperience"  integer`,
  `ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "isPublic"           boolean DEFAULT true NOT NULL`,

  // Garante o default em registros que possam ter sido criados com isPublic NULL antes
  // (defensivo — não deveria acontecer, mas garante)
  `UPDATE "doctors" SET "isPublic" = true WHERE "isPublic" IS NULL`,

  // Unique index parcial em slug (nullable mas único quando setado)
  `CREATE UNIQUE INDEX IF NOT EXISTS "doctors_slug_key" ON "doctors"("slug") WHERE "slug" IS NOT NULL`,
]

async function main() {
  console.log(`[sql-schema-patches] aplicando ${PATCHES.length} patches…`)
  let ok = 0
  let fail = 0
  for (const sql of PATCHES) {
    try {
      await db.$executeRawUnsafe(sql)
      ok++
    } catch (err) {
      fail++
      console.error('[sql-schema-patches] FALHA em:', sql.slice(0, 80), '\n  ->', err)
    }
  }
  console.log(`[sql-schema-patches] ✅ ok=${ok} | fail=${fail}`)
}

main()
  .catch((e) => {
    console.error('[sql-schema-patches] erro geral:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
