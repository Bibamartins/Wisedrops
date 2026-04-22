/**
 * Notification tRPC Router
 *
 * Manages in-app notifications and user notification preferences.
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { NotificationChannel, NotificationType } from '@prisma/client'

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const listInputSchema = z.object({
  /** Filter only unread */
  unreadOnly: z.boolean().default(false),
  /** Filter by notification type */
  type: z.nativeEnum(NotificationType).optional(),
  /** Cursor-based pagination */
  cursor: z.string().uuid().optional(),
  limit: z.number().min(1).max(50).default(20),
})

const markAsReadSchema = z.object({
  notificationId: z.string().uuid(),
})

const updatePreferencesSchema = z.object({
  notificationType: z.nativeEnum(NotificationType),
  enabledChannels: z.array(z.nativeEnum(NotificationChannel)).min(1, {
    message: 'Selecione ao menos um canal de notificacao.',
  }),
  quietHoursStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Formato invalido. Use HH:MM.')
    .nullable()
    .optional(),
  quietHoursEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Formato invalido. Use HH:MM.')
    .nullable()
    .optional(),
})

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const notificationRouter = createTRPCRouter({
  /**
   * List notifications for the authenticated user.
   * Supports cursor-based pagination and filtering by type/read status.
   */
  list: protectedProcedure
    .input(listInputSchema)
    .query(async ({ ctx, input }) => {
      const { unreadOnly, type, cursor, limit } = input

      const where = {
        userId: ctx.session.userId,
        // Only show IN_APP notifications in the notification center
        channel: NotificationChannel.IN_APP,
        ...(unreadOnly && { readAt: null }),
        ...(type && { type }),
        ...(cursor && { createdAt: { lt: (await ctx.db.notification.findUnique({ where: { id: cursor } }))?.createdAt } }),
      }

      const notifications = await ctx.db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit + 1, // fetch one extra to determine hasMore
      })

      let hasMore = false
      if (notifications.length > limit) {
        hasMore = true
        notifications.pop()
      }

      const nextCursor = hasMore
        ? notifications[notifications.length - 1]?.id
        : undefined

      // Also return total unread count for badge
      const unreadCount = await ctx.db.notification.count({
        where: {
          userId: ctx.session.userId,
          channel: NotificationChannel.IN_APP,
          readAt: null,
        },
      })

      return {
        notifications,
        nextCursor,
        hasMore,
        unreadCount,
      }
    }),

  /**
   * Mark a single notification as read.
   */
  markAsRead: protectedProcedure
    .input(markAsReadSchema)
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.findUnique({
        where: { id: input.notificationId },
        select: { id: true, userId: true, readAt: true },
      })

      if (!notification) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notificacao nao encontrada.',
        })
      }

      if (notification.userId !== ctx.session.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Voce nao tem permissao para acessar esta notificacao.',
        })
      }

      if (notification.readAt) {
        return { success: true, alreadyRead: true }
      }

      await ctx.db.notification.update({
        where: { id: input.notificationId },
        data: { readAt: new Date() },
      })

      return { success: true, alreadyRead: false }
    }),

  /**
   * Mark all in-app notifications as read for the current user.
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await ctx.db.notification.updateMany({
      where: {
        userId: ctx.session.userId,
        channel: NotificationChannel.IN_APP,
        readAt: null,
      },
      data: { readAt: new Date() },
    })

    return { markedCount: result.count }
  }),

  /**
   * Get notification preferences for the current user.
   * Returns preferences for all notification types, filling in defaults
   * for types that don't have explicit preferences.
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const existing = await ctx.db.notificationPreference.findMany({
      where: { userId: ctx.session.userId },
    })

    // Build a map of existing preferences
    const prefsMap = new Map(
      existing.map((p) => [p.notificationType, p]),
    )

    // Default channels per notification type
    const defaultChannels: Record<NotificationType, NotificationChannel[]> = {
      APPOINTMENT_REMINDER: [
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
        NotificationChannel.EMAIL,
        NotificationChannel.WHATSAPP,
      ],
      ADHERENCE_REMINDER: [
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
      ],
      PRESCRIPTION_READY: [
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
        NotificationChannel.EMAIL,
      ],
      ANVISA_STATUS_UPDATE: [
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
        NotificationChannel.EMAIL,
      ],
      ORDER_STATUS_UPDATE: [
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
        NotificationChannel.EMAIL,
      ],
      PAYMENT_CONFIRMATION: [
        NotificationChannel.IN_APP,
        NotificationChannel.EMAIL,
      ],
      TREATMENT_CHECK_IN: [
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
      ],
      DOCTOR_MESSAGE: [
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
      ],
      SYSTEM_ALERT: [
        NotificationChannel.IN_APP,
      ],
    }

    const allTypes = Object.values(NotificationType) as NotificationType[]

    const preferences = allTypes.map((type) => {
      const pref = prefsMap.get(type)
      return {
        notificationType: type,
        enabledChannels: pref?.enabledChannels ?? defaultChannels[type] ?? [NotificationChannel.IN_APP],
        quietHoursStart: pref?.quietHoursStart ?? null,
        quietHoursEnd: pref?.quietHoursEnd ?? null,
      }
    })

    return preferences
  }),

  /**
   * Update notification preference for a specific notification type.
   */
  updatePreferences: protectedProcedure
    .input(updatePreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const { notificationType, enabledChannels, quietHoursStart, quietHoursEnd } = input

      // IN_APP must always be enabled
      if (!enabledChannels.includes(NotificationChannel.IN_APP)) {
        enabledChannels.push(NotificationChannel.IN_APP)
      }

      // Validate quiet hours consistency
      if ((quietHoursStart && !quietHoursEnd) || (!quietHoursStart && quietHoursEnd)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Informe tanto o inicio quanto o fim do horario de silencio.',
        })
      }

      const preference = await ctx.db.notificationPreference.upsert({
        where: {
          userId_notificationType: {
            userId: ctx.session.userId,
            notificationType,
          },
        },
        create: {
          userId: ctx.session.userId,
          notificationType,
          enabledChannels,
          quietHoursStart: quietHoursStart ?? null,
          quietHoursEnd: quietHoursEnd ?? null,
        },
        update: {
          enabledChannels,
          quietHoursStart: quietHoursStart ?? null,
          quietHoursEnd: quietHoursEnd ?? null,
        },
      })

      return preference
    }),
})
