import { TRPCError, initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { db } from '@/server/db/client'
import type { UserRole } from '@prisma/client'
import { auth } from '@/server/auth'

// Context type
export type TRPCContext = {
  db: typeof db
  session: {
    userId: string
    role: UserRole
    email: string
  } | null
  /**
   * Multi-tenancy (PR 5):
   * tenantId é injetado automaticamente pelo createTRPCContext a partir do
   * User.tenantId na sessão. Hoje retorna sempre o tenant 'wisedrops' como
   * fallback (stub single-tenant). Quando houver múltiplos tenants, substituir
   * a lógica de resolução aqui — o contrato do ctx permanece o mesmo.
   */
  tenantId: string | null
}

// Cache in-process do ID do tenant default para evitar query a cada request
let _defaultTenantId: string | null | undefined = undefined

async function resolveDefaultTenantId(): Promise<string | null> {
  if (_defaultTenantId !== undefined) return _defaultTenantId
  const tenant = await db.tenant.findUnique({ where: { slug: 'wisedrops' }, select: { id: true } })
  _defaultTenantId = tenant?.id ?? null
  return _defaultTenantId
}

// Create context for each request — reads NextAuth session
export const createTRPCContext = async (_opts: {
  headers: Headers
}): Promise<TRPCContext> => {
  const nextAuthSession = await auth()

  const session = nextAuthSession?.user?.id
    ? {
        userId: nextAuthSession.user.id,
        role: nextAuthSession.user.role,
        email: nextAuthSession.user.email ?? '',
      }
    : null

  // Resolver tenantId: usa o do User na sessão quando disponível,
  // caso contrário cai no tenant default 'wisedrops' (stub single-tenant).
  // Futuro multi-tenant: ler do header X-Tenant-Slug ou subdomínio.
  let tenantId: string | null = null
  if (session?.userId) {
    const userWithTenant = await db.user.findUnique({
      where: { id: session.userId },
      select: { tenantId: true },
    })
    tenantId = userWithTenant?.tenantId ?? null
  }
  if (!tenantId) {
    tenantId = await resolveDefaultTenantId()
  }

  return {
    db,
    session,
    tenantId,
  }
}

// Initialize tRPC
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

// Base router and procedure helpers
export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

// Auth middleware - requires valid session
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Voce precisa estar logado' })
  }
  return next({
    ctx: {
      session: ctx.session,
    },
  })
})

export const protectedProcedure = t.procedure.use(enforceAuth)

// Role-based middleware
const enforceRole = (allowedRoles: UserRole[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.session?.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    if (!allowedRoles.includes(ctx.session.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Voce nao tem permissao para acessar este recurso',
      })
    }
    return next({ ctx: { session: ctx.session } })
  })

export const doctorProcedure = t.procedure.use(enforceAuth).use(enforceRole(['DOCTOR', 'ADMIN']))
export const adminProcedure = t.procedure.use(enforceAuth).use(enforceRole(['ADMIN']))
export const patientProcedure = t.procedure.use(enforceAuth).use(enforceRole(['PATIENT']))

// Audit log middleware
export const auditedProcedure = (action: string) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const result = await next()
    // Fire-and-forget audit log
    db.auditLog
      .create({
        data: {
          userId: ctx.session.userId,
          action,
          entityType: action.split('.')[0] ?? 'unknown',
          metadata: {},
        },
      })
      .catch(console.error)
    return result
  })
