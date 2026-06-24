/**
 * Seed só do admin — roda no build do Netlify.
 * Lê ADMIN_EMAIL / ADMIN_PASSWORD das variáveis de ambiente (NUNCA hardcode,
 * o repo é público). Idempotente: upsert. Não cria contas de demonstração.
 *
 * Multi-tenancy (PR 5): busca o tenant 'wisedrops' e vincula o admin a ele.
 * Se o tenant ainda não existir (build sem seed-tenant rodado antes), o admin
 * é criado sem tenantId e o seed-tenant.ts o vinculará na próxima execução.
 */
import { PrismaClient, UserRole, AccountStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@wisedrops.com.br').toLowerCase().trim()
  const password = process.env.ADMIN_PASSWORD

  if (!password) {
    console.log('[seed-admin] ADMIN_PASSWORD ausente — pulando criação do admin.')
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)

  // Buscar tenant default para vincular o admin
  const defaultTenant = await prisma.tenant.findUnique({
    where: { slug: 'wisedrops' },
  })

  if (!defaultTenant) {
    console.log('[seed-admin] tenant wisedrops ainda não existe — admin será criado sem tenantId. Execute seed-tenant.ts para vincular.')
  }

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      status: AccountStatus.ACTIVE,
      ...(defaultTenant ? { tenantId: defaultTenant.id } : {}),
    },
    create: {
      email,
      passwordHash,
      role: UserRole.ADMIN,
      status: AccountStatus.ACTIVE,
      fullName: 'Admin WiseDrops',
      cpf: '00000000000',
      phone: '11000000000',
      ...(defaultTenant ? { tenantId: defaultTenant.id } : {}),
    },
  })

  console.log('[seed-admin] admin pronto:', admin.email, defaultTenant ? `(tenant: ${defaultTenant.slug})` : '(sem tenant)')
}

main()
  .catch((e) => {
    console.error('[seed-admin] erro:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
