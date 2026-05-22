/**
 * Remove usuários de teste criados durante a validação do banco
 * (e-mails terminando em "-del@wisedrops.test"). Best-effort.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: '-del@wisedrops.test' } },
    select: { id: true },
  })
  const ids = users.map((u) => u.id)
  if (ids.length === 0) {
    console.log('[cleanup] nenhum usuário de teste encontrado.')
    return
  }
  await prisma.doctor.deleteMany({ where: { userId: { in: ids } } })
  await prisma.patient.deleteMany({ where: { userId: { in: ids } } })
  const res = await prisma.user.deleteMany({ where: { id: { in: ids } } })
  console.log('[cleanup] usuários de teste removidos:', res.count)
}

main()
  .catch((e) => {
    console.error('[cleanup] erro:', e)
    process.exit(0)
  })
  .finally(() => prisma.$disconnect())
