/**
 * Seed: marketplace de médicos (PR 7)
 *
 * Gera slug pros médicos APPROVED existentes (a partir do fullName)
 * e desambígua com sufixo numérico se colidir.
 *
 * Idempotente: só atualiza médicos com slug=NULL.
 * Rode automaticamente em scripts/db-setup.sh após seed-tenant.ts.
 */

import { PrismaClient, DoctorVerificationStatus } from '@prisma/client'

const db = new PrismaClient()

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/dr\.?\s+/g, 'dr-')
    .replace(/dra\.?\s+/g, 'dra-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

async function uniqueSlug(base: string, ownerDoctorId: string): Promise<string> {
  let candidate = base
  let counter = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const found = await db.doctor.findUnique({ where: { slug: candidate } })
    if (!found || found.id === ownerDoctorId) return candidate
    counter += 1
    candidate = `${base}-${counter}`
  }
}

async function main() {
  const doctors = await db.doctor.findMany({
    where: { slug: null, verificationStatus: DoctorVerificationStatus.APPROVED },
    include: { user: { select: { fullName: true } } },
  })

  console.log(`[seed-doctor-marketplace] ${doctors.length} médicos sem slug pra processar`)

  for (const doctor of doctors) {
    const base = slugify(doctor.user.fullName) || `medico-${doctor.id.slice(0, 8)}`
    const slug = await uniqueSlug(base, doctor.id)
    await db.doctor.update({
      where: { id: doctor.id },
      data: { slug, isPublic: true },
    })
    console.log(`  ✓ ${doctor.user.fullName} → ${slug}`)
  }

  console.log('[seed-doctor-marketplace] ✅ concluído')
}

main()
  .catch((e) => {
    console.error('[seed-doctor-marketplace] erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
