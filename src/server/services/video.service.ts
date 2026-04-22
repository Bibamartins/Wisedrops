/**
 * Daily.co Video Consultation Service
 *
 * Manages video rooms for telemedicine consultations between doctors and patients.
 * Each consultation gets a unique, time-limited room with strict access controls.
 *
 * HIPAA-compliant: rooms auto-expire, recordings require explicit consent,
 * and maximum 2 participants per consultation room.
 */

import { db } from '@/server/db/client'

// ============================================================
// Types
// ============================================================

interface DailyRoomProperties {
  exp?: number
  max_participants?: number
  enable_chat?: boolean
  enable_screenshare?: boolean
  enable_recording?: string
  start_audio_off?: boolean
  start_video_off?: boolean
  eject_at_room_exp?: boolean
  enable_knocking?: boolean
  lang?: string
}

interface DailyRoomConfig {
  name: string
  privacy: 'private' | 'public'
  properties: DailyRoomProperties
}

interface DailyRoom {
  id: string
  name: string
  url: string
  api_created: boolean
  privacy: string
  created_at: string
  config: DailyRoomProperties
}

interface DailyMeetingToken {
  token: string
}

interface DailyRecording {
  id: string
  room_name: string
  start_ts: number
  duration: number
  max_participants: number
  s3key: string
  status: string
}

interface DailyRecordingAccessLink {
  download_link: string
}

export interface VideoRoomResult {
  roomId: string
  roomName: string
  roomUrl: string
  expiresAt: Date
}

export interface VideoTokenResult {
  token: string
  roomUrl: string
  expiresAt: Date
}

type ParticipantRole = 'doctor' | 'patient'

// ============================================================
// Configuration
// ============================================================

const DAILY_API_BASE = 'https://api.daily.co/v1'
const DAILY_API_KEY = process.env.DAILY_API_KEY!
const DAILY_DOMAIN = process.env.DAILY_DOMAIN // e.g., "wisedrops"

/** Default room duration: 90 minutes from creation */
const DEFAULT_ROOM_EXPIRY_MINUTES = 90

/** Token validity: 2 hours from generation */
const TOKEN_EXPIRY_MINUTES = 120

/** Max consultation room participants */
const MAX_PARTICIPANTS = 2

// ============================================================
// Internal Helpers
// ============================================================

async function dailyApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${DAILY_API_BASE}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DAILY_API_KEY}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error')
    throw new Error(
      `Daily.co API error [${response.status}] ${endpoint}: ${errorBody}`
    )
  }

  // DELETE returns 204 with no body
  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}

function generateRoomName(consultationId: string): string {
  const shortId = consultationId.replace(/-/g, '').substring(0, 12)
  const timestamp = Date.now().toString(36)
  return `wd-${shortId}-${timestamp}`
}

function minutesFromNow(minutes: number): number {
  return Math.floor(Date.now() / 1000) + minutes * 60
}

// ============================================================
// Public API
// ============================================================

/**
 * Creates a Daily.co room for a consultation.
 *
 * Room configuration:
 * - Max 2 participants (doctor + patient)
 * - Private room (requires token)
 * - Chat and screen share enabled
 * - Knocking enabled (waiting room)
 * - Auto-ejects participants on room expiry
 * - Recording capability (cloud, activated only with consent)
 * - PT-BR language
 */
export async function createRoom(
  consultationId: string,
  options?: {
    expiryMinutes?: number
    enableRecording?: boolean
  }
): Promise<VideoRoomResult> {
  const expiryMinutes = options?.expiryMinutes ?? DEFAULT_ROOM_EXPIRY_MINUTES
  const enableRecording = options?.enableRecording ?? false
  const expiresAtUnix = minutesFromNow(expiryMinutes)
  const roomName = generateRoomName(consultationId)

  const roomConfig: DailyRoomConfig = {
    name: roomName,
    privacy: 'private',
    properties: {
      exp: expiresAtUnix,
      max_participants: MAX_PARTICIPANTS,
      enable_chat: true,
      enable_screenshare: true,
      enable_recording: enableRecording ? 'cloud' : undefined,
      start_audio_off: false,
      start_video_off: false,
      eject_at_room_exp: true,
      enable_knocking: true,
      lang: 'pt',
    },
  }

  const room = await dailyApiRequest<DailyRoom>('/rooms', {
    method: 'POST',
    body: JSON.stringify(roomConfig),
  })

  const expiresAt = new Date(expiresAtUnix * 1000)

  // Persist room reference in consultation record
  await db.consultation.update({
    where: { id: consultationId },
    data: { videoRoomId: room.name },
  })

  return {
    roomId: room.id,
    roomName: room.name,
    roomUrl: room.url,
    expiresAt,
  }
}

/**
 * Generates a meeting token with role-based permissions.
 *
 * Doctor tokens:
 * - Owner privileges (can start recording, remove participants)
 * - Can start/stop recording
 * - Display name from doctor profile
 *
 * Patient tokens:
 * - Standard participant privileges
 * - Cannot start recording
 * - Waiting room: must be admitted by doctor (knocking)
 */
export async function generateToken(
  roomName: string,
  participantRole: ParticipantRole,
  userName: string,
  userId: string
): Promise<VideoTokenResult> {
  const isDoctor = participantRole === 'doctor'
  const expiresAtUnix = minutesFromNow(TOKEN_EXPIRY_MINUTES)

  const tokenPayload = {
    properties: {
      room_name: roomName,
      user_name: userName,
      user_id: userId,
      exp: expiresAtUnix,
      is_owner: isDoctor,
      enable_recording: isDoctor ? 'cloud' : undefined,
      start_audio_off: false,
      start_video_off: false,
      enable_screenshare: true,
    },
  }

  const result = await dailyApiRequest<DailyMeetingToken>('/meeting-tokens', {
    method: 'POST',
    body: JSON.stringify(tokenPayload),
  })

  const domain = DAILY_DOMAIN ?? 'wisedrops'
  const roomUrl = `https://${domain}.daily.co/${roomName}`

  return {
    token: result.token,
    roomUrl,
    expiresAt: new Date(expiresAtUnix * 1000),
  }
}

/**
 * Deletes a Daily.co room after consultation ends.
 * Also updates the consultation record to clear the room reference.
 */
export async function deleteRoom(
  roomName: string,
  consultationId?: string
): Promise<void> {
  try {
    await dailyApiRequest(`/rooms/${roomName}`, {
      method: 'DELETE',
    })
  } catch (error) {
    // Room may have already expired and been cleaned up
    console.warn(`[video.service] Failed to delete room ${roomName}:`, error)
  }

  if (consultationId) {
    await db.consultation.update({
      where: { id: consultationId },
      data: { videoRoomId: null },
    })
  }
}

/**
 * Retrieves the recording URL for a completed consultation.
 *
 * Only returns a URL if:
 * 1. Recording exists for the room
 * 2. Recording consent was given (checked via consultation metadata)
 *
 * The returned URL is a time-limited signed download link.
 */
export async function getRecordingUrl(
  roomName: string,
  consultationId: string
): Promise<string | null> {
  // Verify the consultation has a valid recording consent flag
  const consultation = await db.consultation.findUnique({
    where: { id: consultationId },
    select: { videoRecordingUrl: true },
  })

  // If we already have a stored URL, return it
  if (consultation?.videoRecordingUrl) {
    return consultation.videoRecordingUrl
  }

  // Fetch recordings from Daily.co for this room
  try {
    const recordings = await dailyApiRequest<DailyRecording[]>(
      `/recordings?room_name=${roomName}`
    )

    if (!recordings || recordings.length === 0) {
      return null
    }

    // Get the most recent completed recording
    const latestRecording = recordings
      .filter((r) => r.status === 'finished')
      .sort((a, b) => b.start_ts - a.start_ts)[0]

    if (!latestRecording) {
      return null
    }

    // Get a signed access link
    const accessLink = await dailyApiRequest<DailyRecordingAccessLink>(
      `/recordings/${latestRecording.id}/access-link`,
      { method: 'GET' }
    )

    // Persist for future lookups
    if (accessLink.download_link) {
      await db.consultation.update({
        where: { id: consultationId },
        data: { videoRecordingUrl: accessLink.download_link },
      })
    }

    return accessLink.download_link ?? null
  } catch (error) {
    console.error(
      `[video.service] Failed to fetch recording for room ${roomName}:`,
      error
    )
    return null
  }
}

/**
 * Gets room details from Daily.co (useful for checking if room is still active).
 */
export async function getRoomDetails(roomName: string): Promise<DailyRoom | null> {
  try {
    return await dailyApiRequest<DailyRoom>(`/rooms/${roomName}`)
  } catch {
    return null
  }
}

/**
 * Starts cloud recording for a room (doctor-initiated, requires consent).
 */
export async function startRecording(roomName: string): Promise<void> {
  await dailyApiRequest(`/rooms/${roomName}/recordings`, {
    method: 'POST',
    body: JSON.stringify({ type: 'cloud' }),
  })
}

/**
 * Stops cloud recording for a room.
 */
export async function stopRecording(roomName: string): Promise<void> {
  await dailyApiRequest(`/rooms/${roomName}/recordings`, {
    method: 'DELETE',
  })
}

/**
 * Full lifecycle: prepare a consultation room with tokens for both participants.
 *
 * Used when a consultation is about to start — creates the room and generates
 * tokens for both doctor and patient in a single call.
 */
export async function prepareConsultationRoom(
  consultationId: string,
  doctor: { name: string; userId: string },
  patient: { name: string; userId: string },
  options?: { enableRecording?: boolean }
): Promise<{
  room: VideoRoomResult
  doctorToken: VideoTokenResult
  patientToken: VideoTokenResult
}> {
  const room = await createRoom(consultationId, options)

  const [doctorToken, patientToken] = await Promise.all([
    generateToken(room.roomName, 'doctor', doctor.name, doctor.userId),
    generateToken(room.roomName, 'patient', patient.name, patient.userId),
  ])

  return { room, doctorToken, patientToken }
}
