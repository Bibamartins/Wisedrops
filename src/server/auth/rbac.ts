/**
 * Role-Based Access Control (RBAC)
 *
 * Defines granular permissions per role and provides helpers for
 * checking access in tRPC procedures and middleware.
 */

import { TRPCError } from '@trpc/server'
import type { UserRole } from '@prisma/client'

// ---------------------------------------------------------------------------
// Permission definitions
// ---------------------------------------------------------------------------

/**
 * Each permission corresponds to a specific action in the system.
 * Naming convention: <domain>:<action>
 */
export const Permission = {
  // Patient
  'patient:viewOwnProfile': true,
  'patient:updateOwnProfile': true,
  'patient:viewOwnRecords': true,
  'patient:viewOwnPrescriptions': true,
  'patient:createOrder': true,
  'patient:viewOwnOrders': true,
  'patient:cancelOwnOrder': true,
  'patient:logAdherence': true,
  'patient:viewOwnAdherence': true,
  'patient:writeSymptomJournal': true,
  'patient:viewOwnConsultations': true,
  'patient:scheduleConsultation': true,
  'patient:rateConsultation': true,

  // Doctor
  'doctor:viewOwnProfile': true,
  'doctor:updateOwnProfile': true,
  'doctor:viewPatientRecords': true,
  'doctor:createMedicalRecord': true,
  'doctor:createPrescription': true,
  'doctor:signPrescription': true,
  'doctor:viewOwnConsultations': true,
  'doctor:manageAvailability': true,
  'doctor:viewOwnEarnings': true,
  'doctor:viewPatientList': true,
  'doctor:viewAdherenceReports': true,
  'doctor:createTreatmentPlan': true,
  'doctor:updateTreatmentPlan': true,
  'doctor:searchPatients': true,

  // Admin
  'admin:viewDashboard': true,
  'admin:listUsers': true,
  'admin:suspendUser': true,
  'admin:verifyDoctor': true,
  'admin:manageProducts': true,
  'admin:viewAnvisaQueue': true,
  'admin:viewFinancialReport': true,
  'admin:manageOrders': true,
  'admin:updateOrderStatus': true,
  'admin:viewAllConsultations': true,
  'admin:systemSettings': true,

  // Pharmacy Manager
  'pharmacy:viewOrders': true,
  'pharmacy:updateOrderStatus': true,
  'pharmacy:manageStock': true,
  'pharmacy:viewProducts': true,
  'pharmacy:dispensePrescription': true,
  'pharmacy:viewAnvisaAuthorizations': true,

  // Notification (all roles)
  'notification:viewOwn': true,
  'notification:updatePreferences': true,
} as const

export type PermissionKey = keyof typeof Permission

// ---------------------------------------------------------------------------
// Role -> Permission mapping
// ---------------------------------------------------------------------------

const ROLE_PERMISSIONS: Record<UserRole, Set<PermissionKey>> = {
  PATIENT: new Set<PermissionKey>([
    'patient:viewOwnProfile',
    'patient:updateOwnProfile',
    'patient:viewOwnRecords',
    'patient:viewOwnPrescriptions',
    'patient:createOrder',
    'patient:viewOwnOrders',
    'patient:cancelOwnOrder',
    'patient:logAdherence',
    'patient:viewOwnAdherence',
    'patient:writeSymptomJournal',
    'patient:viewOwnConsultations',
    'patient:scheduleConsultation',
    'patient:rateConsultation',
    'notification:viewOwn',
    'notification:updatePreferences',
  ]),

  DOCTOR: new Set<PermissionKey>([
    'doctor:viewOwnProfile',
    'doctor:updateOwnProfile',
    'doctor:viewPatientRecords',
    'doctor:createMedicalRecord',
    'doctor:createPrescription',
    'doctor:signPrescription',
    'doctor:viewOwnConsultations',
    'doctor:manageAvailability',
    'doctor:viewOwnEarnings',
    'doctor:viewPatientList',
    'doctor:viewAdherenceReports',
    'doctor:createTreatmentPlan',
    'doctor:updateTreatmentPlan',
    'doctor:searchPatients',
    'notification:viewOwn',
    'notification:updatePreferences',
  ]),

  ADMIN: new Set<PermissionKey>([
    // Admin inherits everything
    ...Object.keys(Permission) as PermissionKey[],
  ]),

  PHARMACY_MANAGER: new Set<PermissionKey>([
    'pharmacy:viewOrders',
    'pharmacy:updateOrderStatus',
    'pharmacy:manageStock',
    'pharmacy:viewProducts',
    'pharmacy:dispensePrescription',
    'pharmacy:viewAnvisaAuthorizations',
    'notification:viewOwn',
    'notification:updatePreferences',
  ]),
}

// ---------------------------------------------------------------------------
// Permission checking
// ---------------------------------------------------------------------------

/**
 * Check if a role has a specific permission.
 */
export function checkPermission(role: UserRole, permission: PermissionKey): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  if (!permissions) return false
  return permissions.has(permission)
}

/**
 * Check if a role has ALL of the specified permissions.
 */
export function checkAllPermissions(role: UserRole, permissions: PermissionKey[]): boolean {
  return permissions.every((p) => checkPermission(role, p))
}

/**
 * Check if a role has ANY of the specified permissions.
 */
export function checkAnyPermission(role: UserRole, permissions: PermissionKey[]): boolean {
  return permissions.some((p) => checkPermission(role, p))
}

/**
 * Get all permissions for a role.
 */
export function getPermissionsForRole(role: UserRole): PermissionKey[] {
  return Array.from(ROLE_PERMISSIONS[role] ?? [])
}

// ---------------------------------------------------------------------------
// tRPC middleware helper
// ---------------------------------------------------------------------------

import { TRPCContext } from '@/server/trpc/trpc'

/**
 * Creates a tRPC middleware that enforces the specified permission(s).
 *
 * Usage in a router:
 * ```ts
 * import { requirePermission } from '@/server/auth/rbac'
 *
 * const myProcedure = protectedProcedure
 *   .use(requirePermission('doctor:createPrescription'))
 *   .mutation(...)
 * ```
 */
export function requirePermission(...permissions: PermissionKey[]) {
  return async (opts: {
    ctx: TRPCContext & { session: NonNullable<TRPCContext['session']> }
    next: (opts: { ctx: TRPCContext & { session: NonNullable<TRPCContext['session']> } }) => Promise<unknown>
  }) => {
    const { ctx, next } = opts
    const role = ctx.session.role

    const hasPermission = permissions.every((p) => checkPermission(role, p))

    if (!hasPermission) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Voce nao tem permissao para realizar esta acao.',
      })
    }

    return next({ ctx })
  }
}

/**
 * Creates a tRPC middleware that allows access if the user has ANY of the
 * specified permissions (OR logic).
 */
export function requireAnyPermission(...permissions: PermissionKey[]) {
  return async (opts: {
    ctx: TRPCContext & { session: NonNullable<TRPCContext['session']> }
    next: (opts: { ctx: TRPCContext & { session: NonNullable<TRPCContext['session']> } }) => Promise<unknown>
  }) => {
    const { ctx, next } = opts
    const role = ctx.session.role

    const hasAny = permissions.some((p) => checkPermission(role, p))

    if (!hasAny) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Voce nao tem permissao para realizar esta acao.',
      })
    }

    return next({ ctx })
  }
}

/**
 * Assert permission outside of tRPC context (e.g., in service methods).
 * Throws TRPCError if permission check fails.
 */
export function assertPermission(role: UserRole, permission: PermissionKey): void {
  if (!checkPermission(role, permission)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Voce nao tem permissao para realizar esta acao.',
    })
  }
}
