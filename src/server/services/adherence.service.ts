/**
 * Adherence Service
 *
 * Core differentiator vs Blis: longitudinal treatment tracking
 * with real-time adherence monitoring and intelligent alerts.
 */

import { db } from '@/server/db/client'
import { TreatmentStatus } from '@prisma/client'

interface RegimenItem {
  productId?: string
  productName: string
  dosage: string
  frequency: string
  route: string
  timeOfDay: string[]
  instructions?: string
}

interface AdherenceReport {
  treatmentPlanId: string
  patientId: string
  period: { start: Date; end: Date }
  overallAdherence: number
  totalScheduled: number
  totalTaken: number
  totalSkipped: number
  totalMissed: number
  currentStreak: number
  longestStreak: number
  byProduct: Array<{
    productName: string
    adherence: number
    taken: number
    total: number
  }>
  byTimeOfDay: Array<{
    time: string
    adherence: number
    taken: number
    total: number
  }>
  sideEffectsSummary: Record<string, number>
  weeklyTrend: Array<{
    week: string
    adherence: number
  }>
}

export class AdherenceService {
  /**
   * Generate scheduled doses for a treatment plan
   * Creates adherence log entries for upcoming doses based on the regimen
   */
  static async generateScheduledDoses(
    treatmentPlanId: string,
    daysAhead: number = 7
  ): Promise<number> {
    const plan = await db.treatmentPlan.findUnique({
      where: { id: treatmentPlanId },
    })

    if (!plan || plan.status !== TreatmentStatus.ACTIVE) return 0

    const regimen = plan.currentRegimen as RegimenItem[]
    const now = new Date()
    let createdCount = 0

    for (let day = 0; day < daysAhead; day++) {
      const date = new Date(now)
      date.setDate(date.getDate() + day)
      const dateStr = date.toISOString().split('T')[0]

      for (const item of regimen) {
        for (const time of item.timeOfDay) {
          const scheduledAt = new Date(`${dateStr}T${time}:00`)

          // Skip if already in the past (except today)
          if (scheduledAt < now && day > 0) continue

          // Check if already exists
          const existing = await db.adherenceLog.findFirst({
            where: {
              treatmentPlanId,
              scheduledAt,
            },
          })

          if (!existing) {
            await db.adherenceLog.create({
              data: {
                patientId: plan.patientId,
                treatmentPlanId,
                scheduledAt,
              },
            })
            createdCount++
          }
        }
      }
    }

    return createdCount
  }

  /**
   * Get comprehensive adherence report for a treatment plan
   */
  static async getAdherenceReport(
    treatmentPlanId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AdherenceReport> {
    const plan = await db.treatmentPlan.findUnique({
      where: { id: treatmentPlanId },
    })

    if (!plan) throw new Error('Treatment plan not found')

    const start = startDate || plan.startDate
    const end = endDate || new Date()

    const logs = await db.adherenceLog.findMany({
      where: {
        treatmentPlanId,
        scheduledAt: { gte: start, lte: end },
      },
      orderBy: { scheduledAt: 'asc' },
    })

    const totalTaken = logs.filter((l) => l.takenAt !== null).length
    const totalSkipped = logs.filter((l) => l.skipped).length
    const totalMissed = logs.filter(
      (l) => !l.takenAt && !l.skipped && l.scheduledAt < new Date()
    ).length
    const totalScheduled = logs.length

    // Calculate streaks
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    for (const log of logs) {
      if (log.takenAt) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else if (log.scheduledAt < new Date()) {
        tempStreak = 0
      }
    }

    // Current streak (from the end)
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].takenAt) currentStreak++
      else if (logs[i].scheduledAt < new Date()) break
    }

    // Side effects frequency
    const sideEffectsSummary: Record<string, number> = {}
    logs.forEach((l) => {
      l.sideEffects.forEach((se) => {
        sideEffectsSummary[se] = (sideEffectsSummary[se] || 0) + 1
      })
    })

    // Weekly trend
    const weeklyTrend = AdherenceService.calculateWeeklyTrend(logs)

    // By time of day analysis
    const timeOfDayMap = new Map<string, { taken: number; total: number }>()
    logs.forEach((l) => {
      const time = l.scheduledAt.toTimeString().slice(0, 5)
      const entry = timeOfDayMap.get(time) || { taken: 0, total: 0 }
      entry.total++
      if (l.takenAt) entry.taken++
      timeOfDayMap.set(time, entry)
    })

    return {
      treatmentPlanId,
      patientId: plan.patientId,
      period: { start, end },
      overallAdherence: totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0,
      totalScheduled,
      totalTaken,
      totalSkipped,
      totalMissed,
      currentStreak,
      longestStreak,
      byProduct: [], // TODO: Break down by product when multiple products in regimen
      byTimeOfDay: Array.from(timeOfDayMap.entries()).map(([time, data]) => ({
        time,
        adherence: Math.round((data.taken / data.total) * 100),
        taken: data.taken,
        total: data.total,
      })),
      sideEffectsSummary,
      weeklyTrend,
    }
  }

  /**
   * Get patients with low adherence for doctor alerts
   */
  static async getLowAdherenceAlerts(
    doctorId: string,
    threshold: number = 70
  ): Promise<
    Array<{
      patientId: string
      patientName: string
      treatmentPlanId: string
      condition: string
      adherence: number
      lastDoseTaken: Date | null
    }>
  > {
    const plans = await db.treatmentPlan.findMany({
      where: {
        doctorId,
        status: TreatmentStatus.ACTIVE,
      },
      include: {
        patient: { include: { user: { select: { fullName: true } } } },
      },
    })

    const alerts: Array<{
      patientId: string
      patientName: string
      treatmentPlanId: string
      condition: string
      adherence: number
      lastDoseTaken: Date | null
    }> = []

    for (const plan of plans) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const logs = await db.adherenceLog.findMany({
        where: {
          treatmentPlanId: plan.id,
          scheduledAt: { gte: sevenDaysAgo },
        },
      })

      const taken = logs.filter((l) => l.takenAt).length
      const total = logs.filter((l) => l.scheduledAt < new Date()).length
      const adherence = total > 0 ? Math.round((taken / total) * 100) : 100

      if (adherence < threshold) {
        const lastTaken = await db.adherenceLog.findFirst({
          where: { treatmentPlanId: plan.id, takenAt: { not: null } },
          orderBy: { takenAt: 'desc' },
        })

        alerts.push({
          patientId: plan.patientId,
          patientName: plan.patient.user.fullName,
          treatmentPlanId: plan.id,
          condition: plan.condition,
          adherence,
          lastDoseTaken: lastTaken?.takenAt || null,
        })
      }
    }

    return alerts.sort((a, b) => a.adherence - b.adherence)
  }

  /**
   * Calculate weekly adherence trend
   */
  private static calculateWeeklyTrend(
    logs: Array<{ scheduledAt: Date; takenAt: Date | null }>
  ): Array<{ week: string; adherence: number }> {
    const weekMap = new Map<string, { taken: number; total: number }>()

    logs.forEach((log) => {
      if (log.scheduledAt > new Date()) return // Skip future doses

      const weekStart = new Date(log.scheduledAt)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]

      const entry = weekMap.get(weekKey) || { taken: 0, total: 0 }
      entry.total++
      if (log.takenAt) entry.taken++
      weekMap.set(weekKey, entry)
    })

    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({
        week,
        adherence: Math.round((data.taken / data.total) * 100),
      }))
  }
}
