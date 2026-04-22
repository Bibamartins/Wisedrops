/**
 * BullMQ Job Queue Setup
 * Background jobs for ANVISA polling, adherence reminders, notifications
 */

import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

// Queue definitions
export const anvisaQueue = new Queue('anvisa', { connection })
export const adherenceQueue = new Queue('adherence', { connection })
export const notificationQueue = new Queue('notification', { connection })

// Job types
export interface AnvisaPollJob {
  type: 'poll_pending' | 'check_renewals'
}

export interface AdherenceReminderJob {
  type: 'generate_doses' | 'send_reminders' | 'check_missed'
  treatmentPlanId?: string
  patientId?: string
}

export interface NotificationJob {
  userId: string
  type: string
  channel: string
  title: string
  body: string
  data?: Record<string, unknown>
}

// Schedule recurring jobs
export async function setupRecurringJobs() {
  // Poll ANVISA every 30 minutes
  await anvisaQueue.add(
    'poll-pending',
    { type: 'poll_pending' },
    {
      repeat: { every: 30 * 60 * 1000 }, // 30 minutes
      removeOnComplete: true,
      removeOnFail: 100,
    }
  )

  // Check ANVISA renewals daily at 9 AM
  await anvisaQueue.add(
    'check-renewals',
    { type: 'check_renewals' },
    {
      repeat: { pattern: '0 9 * * *' }, // Daily at 9 AM
      removeOnComplete: true,
    }
  )

  // Generate adherence doses weekly
  await adherenceQueue.add(
    'generate-doses',
    { type: 'generate_doses' },
    {
      repeat: { pattern: '0 0 * * 0' }, // Every Sunday midnight
      removeOnComplete: true,
    }
  )

  // Send adherence reminders every 5 minutes
  await adherenceQueue.add(
    'send-reminders',
    { type: 'send_reminders' },
    {
      repeat: { every: 5 * 60 * 1000 }, // 5 minutes
      removeOnComplete: true,
      removeOnFail: 50,
    }
  )

  // Check for missed doses every hour
  await adherenceQueue.add(
    'check-missed',
    { type: 'check_missed' },
    {
      repeat: { every: 60 * 60 * 1000 }, // 1 hour
      removeOnComplete: true,
    }
  )

  console.log('[Queue] Recurring jobs scheduled')
}
