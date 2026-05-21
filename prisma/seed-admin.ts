/**
 * Seed só do admin — roda no build do Netlify.
 * Lê ADMIN_EMAIL / ADMIN_PASSWORD das variáveis de ambiente (NUNCA hardcode,
 * o repo é público). Idempotente: upsert. Não cria contas de demonstração.
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

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      status: AccountStatus.ACTIVE,
    },
    create: {
      email,
      passwordHash,
      role: UserRole.ADMIN,
      status: AccountStatus.ACTIVE,
      fullName: 'Admin WiseDrops',
      cpf: '00000000000',
      phone: '11000000000',
    },
  })

  console.log('[seed-admin] admin pronto:', admin.email)
}

main()
  .catch((e) => {
    console.error('[seed-admin] erro:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
