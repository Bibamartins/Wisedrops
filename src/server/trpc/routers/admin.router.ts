/**
 * Admin tRPC Router
 *
 * Dashboard stats, user management, doctor verification,
 * ANVISA queue monitoring, and financial reporting.
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, adminProcedure } from '../trpc'
import {
  AccountStatus,
  AnvisaStatus,
  DoctorVerificationStatus,
  OrderStatus,
  UserRole,
  PaymentStatus,
} from '@prisma/client'
import { NotificationService } from '@/server/services/notification.service'
import { upsertContact } from '@/server/services/hubspot.service'
import { sendDoctorApprovedEmail } from '@/server/services/email.service'

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const listUsersSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(AccountStatus).optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(25),
})

const suspendUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(5, 'Informe o motivo da suspensao.').max(500),
  /** If true, reactivates a suspended user instead */
  reactivate: z.boolean().default(false),
})

const verifyDoctorSchema = z.object({
  doctorId: z.string().uuid(),
  decision: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().max(500).optional(),
})

const financialReportSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(['day', 'week', 'month']).default('month'),
})

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const adminRouter = createTRPCRouter({
  /**
   * Get high-level dashboard statistics.
   */
  getDashboardStats: adminProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Run all counts in parallel
    const [
      totalUsers,
      totalPatients,
      totalDoctors,
      newUsersThisMonth,
      activeConsultations,
      consultationsThisMonth,
      totalOrders,
      pendingOrders,
      ordersThisMonth,
      pendingAnvisa,
      approvedAnvisa,
      totalRevenueResult,
      revenueThisMonthResult,
      pendingDoctorVerifications,
      suspendedUsers,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.patient.count(),
      ctx.db.doctor.count(),
      ctx.db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      ctx.db.consultation.count({
        where: { status: { in: ['SCHEDULED', 'WAITING_ROOM', 'IN_PROGRESS'] } },
      }),
      ctx.db.consultation.count({
        where: { status: 'COMPLETED', endedAt: { gte: thirtyDaysAgo } },
      }),
      ctx.db.order.count(),
      ctx.db.order.count({
        where: { status: { in: ['PENDING_PAYMENT', 'PAID', 'PROCESSING'] } },
      }),
      ctx.db.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      ctx.db.anvisaAuthorization.count({
        where: { status: { in: ['PENDING_SUBMISSION', 'SUBMITTED', 'UNDER_ANALYSIS'] } },
      }),
      ctx.db.anvisaAuthorization.count({
        where: { status: AnvisaStatus.APPROVED },
      }),
      ctx.db.payment.aggregate({
        where: { status: PaymentStatus.SUCCEEDED },
        _sum: { amountCents: true },
      }),
      ctx.db.payment.aggregate({
        where: { status: PaymentStatus.SUCCEEDED, paidAt: { gte: thirtyDaysAgo } },
        _sum: { amountCents: true },
      }),
      ctx.db.doctor.count({
        where: { verificationStatus: DoctorVerificationStatus.PENDING },
      }),
      ctx.db.user.count({ where: { status: AccountStatus.SUSPENDED } }),
    ])

    // Recent signups trend (last 7 days)
    const recentSignups = await ctx.db.user.groupBy({
      by: ['role'],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: { id: true },
    })

    return {
      users: {
        total: totalUsers,
        patients: totalPatients,
        doctors: totalDoctors,
        newThisMonth: newUsersThisMonth,
        suspended: suspendedUsers,
        recentSignups: recentSignups.map((r) => ({
          role: r.role,
          count: r._count.id,
        })),
      },
      consultations: {
        active: activeConsultations,
        completedThisMonth: consultationsThisMonth,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        thisMonth: ordersThisMonth,
      },
      anvisa: {
        pending: pendingAnvisa,
        approved: approvedAnvisa,
      },
      financial: {
        totalRevenueCents: revenueThisMonthResult._sum.amountCents ?? 0,
        allTimeRevenueCents: totalRevenueResult._sum.amountCents ?? 0,
      },
      pendingActions: {
        doctorVerifications: pendingDoctorVerifications,
        pendingOrders,
        pendingAnvisa,
      },
    }
  }),

  /**
   * List all users with filtering and pagination.
   */
  listUsers: adminProcedure
    .input(listUsersSchema)
    .query(async ({ ctx, input }) => {
      const { role, status, search, page, limit } = input

      const where = {
        ...(role && { role }),
        ...(status && { status }),
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { cpf: { contains: search } },
          ],
        }),
      }

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            fullName: true,
            cpf: true,
            phone: true,
            role: true,
            status: true,
            avatarUrl: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            doctor: {
              select: {
                id: true,
                crm: true,
                crmState: true,
                verificationStatus: true,
                specialty: true,
              },
            },
            patient: {
              select: {
                id: true,
                onboardingCompleted: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.db.user.count({ where }),
      ])

      return {
        users,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      }
    }),

  /**
   * Suspend or reactivate a user account.
   */
  suspendUser: adminProcedure
    .input(suspendUserSchema)
    .mutation(async ({ ctx, input }) => {
      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { id: true, role: true, status: true, fullName: true },
      })

      if (!targetUser) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuario nao encontrado.' })
      }

      // Cannot suspend other admins
      if (targetUser.role === UserRole.ADMIN && !input.reactivate) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Nao e possivel suspender outro administrador.',
        })
      }

      // Cannot suspend yourself
      if (targetUser.id === ctx.session.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Voce nao pode suspender sua propria conta.',
        })
      }

      const newStatus = input.reactivate
        ? AccountStatus.ACTIVE
        : AccountStatus.SUSPENDED

      await ctx.db.user.update({
        where: { id: input.userId },
        data: { status: newStatus },
      })

      // Audit log
      await ctx.db.auditLog.create({
        data: {
          userId: ctx.session.userId,
          action: input.reactivate ? 'admin.reactivateUser' : 'admin.suspendUser',
          entityType: 'user',
          entityId: input.userId,
          metadata: {
            reason: input.reason,
            targetUserName: targetUser.fullName,
            targetUserRole: targetUser.role,
          },
        },
      })

      // Notify user
      await NotificationService.dispatch({
        userId: input.userId,
        type: 'SYSTEM_ALERT',
        title: input.reactivate ? 'Conta Reativada' : 'Conta Suspensa',
        body: input.reactivate
          ? 'Sua conta foi reativada. Voce pode acessar normalmente a plataforma.'
          : `Sua conta foi suspensa. Motivo: ${input.reason}. Entre em contato com o suporte para mais informacoes.`,
        urgent: true,
      }).catch(console.error)

      return {
        success: true,
        newStatus,
      }
    }),

  /**
   * Approve or reject a doctor's verification request.
   */
  verifyDoctor: adminProcedure
    .input(verifyDoctorSchema)
    .mutation(async ({ ctx, input }) => {
      const doctor = await ctx.db.doctor.findUnique({
        where: { id: input.doctorId },
        include: {
          user: { select: { id: true, fullName: true, status: true } },
        },
      })

      if (!doctor) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Medico nao encontrado.' })
      }

      if (doctor.verificationStatus === DoctorVerificationStatus.APPROVED) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este medico ja foi verificado e aprovado.',
        })
      }

      const isApproval = input.decision === 'APPROVED'

      if (!isApproval && !input.rejectionReason) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Informe o motivo da rejeicao.',
        })
      }

      await ctx.db.$transaction(async (tx) => {
        await tx.doctor.update({
          where: { id: input.doctorId },
          data: {
            verificationStatus: isApproval
              ? DoctorVerificationStatus.APPROVED
              : DoctorVerificationStatus.REJECTED,
          },
        })

        // Activate user account if approved
        if (isApproval && doctor.user.status === 'PENDING_VERIFICATION') {
          await tx.user.update({
            where: { id: doctor.userId },
            data: { status: AccountStatus.ACTIVE },
          })
        }
      })

      // Audit
      await ctx.db.auditLog.create({
        data: {
          userId: ctx.session.userId,
          action: `admin.verifyDoctor.${input.decision.toLowerCase()}`,
          entityType: 'doctor',
          entityId: input.doctorId,
          metadata: {
            doctorName: doctor.user.fullName,
            crm: `${doctor.crm}/${doctor.crmState}`,
            rejectionReason: input.rejectionReason,
          },
        },
      })

      // Notify doctor
      await NotificationService.dispatch({
        userId: doctor.user.id,
        type: 'SYSTEM_ALERT',
        title: isApproval
          ? 'Cadastro Aprovado!'
          : 'Verificacao de Cadastro',
        body: isApproval
          ? 'Parabens! Seu cadastro como medico foi aprovado. Voce ja pode atender pacientes pela plataforma WiseDrops.'
          : `Seu cadastro nao foi aprovado. Motivo: ${input.rejectionReason}. Voce pode reenviar seus documentos para nova analise.`,
        urgent: true,
      }).catch(console.error)

      // E-mail "conta aprovada" + sync HubSpot (status DOCTOR de LEAD → ACTIVE)
      if (isApproval) {
        const fullUser = await ctx.db.user.findUnique({
          where: { id: doctor.userId },
          select: { email: true, fullName: true },
        })
        if (fullUser) {
          await Promise.allSettled([
            sendDoctorApprovedEmail({
              doctorEmail: fullUser.email,
              doctorName: fullUser.fullName,
            }),
            upsertContact({
              email: fullUser.email,
              role: 'DOCTOR',
              status: 'ACTIVE',
            }),
          ])
        }
      }

      return { success: true, decision: input.decision }
    }),

  /**
   * Get the ANVISA authorization queue for monitoring.
   */
  getAnvisaQueue: adminProcedure
    .input(
      z.object({
        status: z.nativeEnum(AnvisaStatus).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(25),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { status, page, limit } = input

      const where = {
        ...(status && { status }),
      }

      const [authorizations, total, statusCounts] = await Promise.all([
        ctx.db.anvisaAuthorization.findMany({
          where,
          include: {
            patient: {
              include: {
                user: { select: { fullName: true, cpf: true } },
              },
            },
            prescriptions: {
              select: {
                id: true,
                prescriptionType: true,
                doctor: {
                  select: {
                    crm: true,
                    crmState: true,
                    user: { select: { fullName: true } },
                  },
                },
              },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.db.anvisaAuthorization.count({ where }),
        // Count by status for summary bar
        ctx.db.anvisaAuthorization.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
      ])

      const statusSummary = Object.fromEntries(
        statusCounts.map((s) => [s.status, s._count.id]),
      ) as Record<string, number>

      return {
        authorizations: authorizations.map((auth) => ({
          id: auth.id,
          protocol: auth.anvisaProtocol,
          status: auth.status,
          patientName: auth.patient.user.fullName,
          patientCpf: auth.patient.user.cpf,
          doctorName: auth.prescriptions[0]?.doctor.user.fullName ?? 'N/A',
          doctorCrm: auth.prescriptions[0]
            ? `${auth.prescriptions[0].doctor.crm}/${auth.prescriptions[0].doctor.crmState}`
            : 'N/A',
          prescriptionType: auth.prescriptions[0]?.prescriptionType ?? null,
          submittedAt: auth.submittedAt,
          approvedAt: auth.approvedAt,
          validUntil: auth.validUntil,
          rejectionReason: auth.rejectionReason,
          createdAt: auth.createdAt,
        })),
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        statusSummary,
      }
    }),

  /**
   * Get a financial report for a given date range.
   */
  getFinancialReport: adminProcedure
    .input(financialReportSchema)
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate)
      const endDate = new Date(input.endDate)

      if (startDate >= endDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Data de inicio deve ser anterior a data de fim.',
        })
      }

      // Payments in period
      const payments = await ctx.db.payment.findMany({
        where: {
          paidAt: { gte: startDate, lte: endDate },
          status: PaymentStatus.SUCCEEDED,
        },
        select: {
          id: true,
          purpose: true,
          method: true,
          amountCents: true,
          platformFeeCents: true,
          paidAt: true,
        },
        orderBy: { paidAt: 'asc' },
      })

      // Aggregate by purpose
      const byPurpose = new Map<string, { count: number; amountCents: number; feeCents: number }>()
      for (const p of payments) {
        const entry = byPurpose.get(p.purpose) ?? { count: 0, amountCents: 0, feeCents: 0 }
        entry.count++
        entry.amountCents += p.amountCents
        entry.feeCents += p.platformFeeCents
        byPurpose.set(p.purpose, entry)
      }

      // Aggregate by payment method
      const byMethod = new Map<string, { count: number; amountCents: number }>()
      for (const p of payments) {
        const entry = byMethod.get(p.method) ?? { count: 0, amountCents: 0 }
        entry.count++
        entry.amountCents += p.amountCents
        byMethod.set(p.method, entry)
      }

      // Time series grouped by period
      const timeSeries = new Map<string, { revenue: number; fees: number; count: number }>()
      for (const p of payments) {
        if (!p.paidAt) continue

        let key: string
        switch (input.groupBy) {
          case 'day':
            key = p.paidAt.toISOString().slice(0, 10)
            break
          case 'week': {
            const weekStart = new Date(p.paidAt)
            weekStart.setDate(weekStart.getDate() - weekStart.getDay())
            key = weekStart.toISOString().slice(0, 10)
            break
          }
          case 'month':
          default:
            key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, '0')}`
            break
        }

        const entry = timeSeries.get(key) ?? { revenue: 0, fees: 0, count: 0 }
        entry.revenue += p.amountCents
        entry.fees += p.platformFeeCents
        entry.count++
        timeSeries.set(key, entry)
      }

      // Refunds in period
      const refunds = await ctx.db.payment.aggregate({
        where: {
          refundedAt: { gte: startDate, lte: endDate },
          status: { in: [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED] },
        },
        _sum: { amountCents: true },
        _count: { id: true },
      })

      // Order stats
      const orderStats = await ctx.db.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
        _sum: { totalCents: true },
      })

      const totalRevenueCents = payments.reduce((sum, p) => sum + p.amountCents, 0)
      const totalFeesCents = payments.reduce((sum, p) => sum + p.platformFeeCents, 0)

      return {
        period: { start: startDate, end: endDate },
        summary: {
          totalTransactions: payments.length,
          totalRevenueCents,
          totalPlatformFeesCents: totalFeesCents,
          netRevenueCents: totalRevenueCents - totalFeesCents,
          refundsCents: refunds._sum.amountCents ?? 0,
          refundsCount: refunds._count.id,
        },
        byPurpose: Array.from(byPurpose.entries()).map(([purpose, data]) => ({
          purpose,
          ...data,
        })),
        byMethod: Array.from(byMethod.entries()).map(([method, data]) => ({
          method,
          ...data,
        })),
        timeSeries: Array.from(timeSeries.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([period, data]) => ({ period, ...data })),
        orders: orderStats.map((o) => ({
          status: o.status,
          count: o._count.id,
          totalCents: o._sum.totalCents ?? 0,
        })),
      }
    }),
})
