/**
 * AWS S3 Storage Service
 *
 * Manages file uploads/downloads with presigned URLs for:
 * - prescriptions/   (signed prescription PDFs)
 * - medical-records/ (lab results, imaging, etc.)
 * - avatars/         (user profile photos)
 * - documents/       (ANVISA docs, verification docs, etc.)
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? 'sa-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET ?? 'wisedrops-storage'

// ---------------------------------------------------------------------------
// Storage prefixes (virtual folder structure)
// ---------------------------------------------------------------------------

export const StoragePrefix = {
  PRESCRIPTIONS: 'prescriptions',
  MEDICAL_RECORDS: 'medical-records',
  AVATARS: 'avatars',
  DOCUMENTS: 'documents',
} as const

export type StoragePrefixKey = keyof typeof StoragePrefix
export type StoragePrefixValue = (typeof StoragePrefix)[StoragePrefixKey]

// ---------------------------------------------------------------------------
// Allowed MIME types per prefix
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES: Record<StoragePrefixValue, string[]> = {
  prescriptions: ['application/pdf'],
  'medical-records': [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/dicom',
  ],
  avatars: ['image/jpeg', 'image/png', 'image/webp'],
  documents: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
}

// Max file size in bytes per prefix
const MAX_FILE_SIZE: Record<StoragePrefixValue, number> = {
  prescriptions: 10 * 1024 * 1024, // 10 MB
  'medical-records': 50 * 1024 * 1024, // 50 MB
  avatars: 5 * 1024 * 1024, // 5 MB
  documents: 25 * 1024 * 1024, // 25 MB
}

// ---------------------------------------------------------------------------
// Key builder
// ---------------------------------------------------------------------------

/**
 * Build the S3 object key. Structure:
 *   <prefix>/<entityId>/<timestamp>-<sanitizedFilename>
 *
 * e.g. prescriptions/abc-123/1711900000000-receita.pdf
 */
function buildKey(
  prefix: StoragePrefixValue,
  entityId: string,
  filename: string,
): string {
  const sanitized = filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .toLowerCase()

  return `${prefix}/${entityId}/${Date.now()}-${sanitized}`
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PresignedUploadResult {
  /** The presigned PUT URL the client should upload to */
  uploadUrl: string
  /** The S3 object key (store this in the database) */
  key: string
  /** Expiry in seconds */
  expiresIn: number
}

export interface PresignedDownloadResult {
  /** The presigned GET URL for downloading */
  downloadUrl: string
  /** Expiry in seconds */
  expiresIn: number
}

/**
 * Generate a presigned URL for uploading a file.
 *
 * The client performs a PUT request to the returned URL with the file body
 * and the correct Content-Type header.
 */
export async function generatePresignedUploadUrl(params: {
  prefix: StoragePrefixValue
  entityId: string
  filename: string
  contentType: string
  /** Optional: override max file size in bytes */
  maxSizeBytes?: number
  /** URL expiry in seconds (default 900 = 15 min) */
  expiresIn?: number
}): Promise<PresignedUploadResult> {
  const { prefix, entityId, filename, contentType, expiresIn = 900 } = params

  // Validate MIME type
  const allowedTypes = ALLOWED_MIME_TYPES[prefix]
  if (!allowedTypes.includes(contentType)) {
    throw new Error(
      `Tipo de arquivo nao permitido para ${prefix}. Tipos aceitos: ${allowedTypes.join(', ')}`,
    )
  }

  const key = buildKey(prefix, entityId, filename)
  const maxSize = params.maxSizeBytes ?? MAX_FILE_SIZE[prefix]

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentLength: maxSize, // S3 will reject uploads larger than this
    ServerSideEncryption: 'AES256',
    Metadata: {
      'uploaded-by': entityId,
      'original-filename': filename,
    },
  })

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn })

  return { uploadUrl, key, expiresIn }
}

/**
 * Generate a presigned URL for downloading / viewing a file.
 */
export async function generatePresignedDownloadUrl(params: {
  key: string
  /** URL expiry in seconds (default 3600 = 1 hour) */
  expiresIn?: number
  /** Optional Content-Disposition for forcing download */
  downloadFilename?: string
}): Promise<PresignedDownloadResult> {
  const { key, expiresIn = 3600, downloadFilename } = params

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ...(downloadFilename && {
      ResponseContentDisposition: `attachment; filename="${downloadFilename}"`,
    }),
  })

  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn })

  return { downloadUrl, expiresIn }
}

/**
 * Delete a file from S3.
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)
}

/**
 * Check if a file exists in S3.
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
    await s3Client.send(command)
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Convenience class
// ---------------------------------------------------------------------------

export class StorageService {
  static generatePresignedUploadUrl = generatePresignedUploadUrl
  static generatePresignedDownloadUrl = generatePresignedDownloadUrl
  static deleteFile = deleteFile
  static fileExists = fileExists
  static StoragePrefix = StoragePrefix

  /**
   * Upload a Buffer directly to S3 (server-side uploads, e.g., generated PDFs).
   * Returns the S3 key.
   */
  static async uploadBuffer(params: {
    prefix: StoragePrefixValue
    entityId: string
    filename: string
    contentType: string
    body: Buffer
  }): Promise<string> {
    const { prefix, entityId, filename, contentType, body } = params

    const key = buildKey(prefix, entityId, filename)

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
      Metadata: {
        'uploaded-by': 'system',
        'original-filename': filename,
      },
    })

    await s3Client.send(command)
    return key
  }

  /**
   * Get the public URL for a file (only works if bucket has public read on the prefix).
   * For most WiseDrops files this should NOT be used -- use presigned URLs instead.
   */
  static getPublicUrl(key: string): string {
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION ?? 'sa-east-1'}.amazonaws.com/${key}`
  }
}
