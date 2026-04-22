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

  return {
    db,
    session,
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
