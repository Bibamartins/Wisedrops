/**
 * Prescription Service
 *
 * Handles PDF generation, digital signature placeholder (ICP-Brasil),
 * delivery to patient, and validity checking for cannabis prescriptions
 * according to Brazilian regulations:
 *   - Notificacao Receita A (amarela): THC >0.2%, valid 30 days
 *   - Notificacao Receita B (azul):    THC <0.2%, valid 60 days
 *   - Receita Simples:                 valid 6 months
 */

import { db } from '@/server/db/client'
import { PrescriptionStatus, PrescriptionType } from '@prisma/client'
import { StorageService } from './storage.service'
import { NotificationService } from './notification.service'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PrescriptionItem {
  productId?: string
  genericName: string
  concentration: string
  form: string
  dosage: string
  frequency: string
  quantity: number
  duration: string
  instructions?: string
}

interface PrescriptionPDFData {
  prescriptionId: string
  prescriptionType: PrescriptionType
  doctorName: string
  doctorCrm: string
  doctorCrmState: string
  doctorSpecialty: string[]
  patientName: string
  patientCpf: string
  patientDateOfBirth: string
  patientAddress: string
  items: PrescriptionItem[]
  clinicalJustification?: string
  icdCodes: string[]
  validUntil: Date
  signedAt?: Date
  digitalSignature?: string
}

interface DigitalSignatureResult {
  signature: string
  certificate: string
  timestamp: string
}

// ---------------------------------------------------------------------------
// Validity rules per prescription type (Brazilian regulation)
// ---------------------------------------------------------------------------

const VALIDITY_DAYS: Record<PrescriptionType, number> = {
  TYPE_A: 30,  // Notificacao Receita A - 30 dias
  TYPE_B: 60,  // Notificacao Receita B - 60 dias
  SIMPLE: 180, // Receita Simples - 6 meses
}

const PRESCRIPTION_TYPE_LABELS: Record<PrescriptionType, string> = {
  TYPE_A: 'Notificacao de Receita A (Especial - Amarela)',
  TYPE_B: 'Notificacao de Receita B (Azul)',
  SIMPLE: 'Receita Simples',
}

// ---------------------------------------------------------------------------
// PDF Generation (using pdfkit)
// ---------------------------------------------------------------------------

/**
 * Generate a prescription PDF document.
 *
 * Uses pdfkit for server-side PDF generation. The PDF follows Brazilian
 * medical prescription standards with the required legal information.
 */
export async function generatePrescriptionPDF(
  prescriptionId: string,
): Promise<Buffer> {
  // Load full prescription data
  const prescription = await db.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
    },
  })

  if (!prescription) {
    throw new Error('Receita nao encontrada.')
  }

  const items = prescription.items as PrescriptionItem[]
  const patientAddress = prescription.patient.address as Record<string, string>

  const pdfData: PrescriptionPDFData = {
    prescriptionId: prescription.id,
    prescriptionType: prescription.prescriptionType,
    doctorName: prescription.doctor.user.fullName,
    doctorCrm: prescription.doctor.crm,
    doctorCrmState: prescription.doctor.crmState,
    doctorSpecialty: prescription.doctor.specialty,
    patientName: prescription.patient.user.fullName,
    patientCpf: formatCPF(prescription.patient.user.cpf),
    patientDateOfBirth: format(prescription.patient.dateOfBirth, 'dd/MM/yyyy'),
    patientAddress: formatAddress(patientAddress),
    items,
    clinicalJustification: prescription.clinicalJustification ?? undefined,
    icdCodes: prescription.icdCodes,
    validUntil: prescription.validUntil,
    signedAt: prescription.signedAt ?? undefined,
    digitalSignature: prescription.digitalSignature ?? undefined,
  }

  return buildPDFBuffer(pdfData)
}

async function buildPDFBuffer(data: PrescriptionPDFData): Promise<Buffer> {
  // Dynamic import to keep this optional dependency lazy
  const PDFDocument = (await import('pdfkit')).default

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 60, right: 60 },
        info: {
          Title: `Receita - ${data.patientName}`,
          Author: `Dr(a). ${data.doctorName}`,
          Subject: 'Prescricao Medica - Cannabis Medicinal',
          Creator: 'WiseDrops',
        },
      })

      const chunks: Buffer[] = []
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // ----- Header -----
      const typeLabel = PRESCRIPTION_TYPE_LABELS[data.prescriptionType]
      const headerColor = data.prescriptionType === 'TYPE_A' ? '#D97706' : // amarelo
                          data.prescriptionType === 'TYPE_B' ? '#2563EB' : // azul
                          '#16a34a' // verde (simples)

      doc.rect(0, 0, doc.page.width, 4).fill(headerColor)

      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#18181b')
        .text('WiseDrops', 60, 20)

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#71717a')
        .text('Cannabis Medicinal com Acompanhamento Inteligente', 60, 42)

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(headerColor)
        .text(typeLabel.toUpperCase(), 60, 65, { align: 'center' })

      doc.moveTo(60, 85).lineTo(535, 85).stroke('#e4e4e7')

      // ----- Doctor info -----
      let y = 95
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#18181b')
        .text(`Dr(a). ${data.doctorName}`, 60, y)

      y += 15
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#52525b')
        .text(
          `CRM ${data.doctorCrm}/${data.doctorCrmState} | ${data.doctorSpecialty.join(', ')}`,
          60,
          y,
        )

      // ----- Patient info -----
      y += 30
      doc.moveTo(60, y).lineTo(535, y).stroke('#e4e4e7')
      y += 10

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#18181b')
        .text('PACIENTE', 60, y)

      y += 16
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#3f3f46')
        .text(`Nome: ${data.patientName}`, 60, y)
        .text(`CPF: ${data.patientCpf}`, 350, y)

      y += 14
      doc
        .text(`Data de Nascimento: ${data.patientDateOfBirth}`, 60, y)

      y += 14
      doc.text(`Endereco: ${data.patientAddress}`, 60, y, { width: 475 })

      // ----- Prescription items -----
      y += 30
      doc.moveTo(60, y).lineTo(535, y).stroke('#e4e4e7')
      y += 10

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#18181b')
        .text('PRESCRICAO', 60, y)

      y += 20

      data.items.forEach((item, index) => {
        if (y > 700) {
          doc.addPage()
          y = 50
        }

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#18181b')
          .text(`${index + 1}. ${item.genericName}`, 60, y)

        y += 15
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#52525b')
          .text(`Concentracao: ${item.concentration} | Forma: ${item.form}`, 80, y)

        y += 13
        doc.text(`Dosagem: ${item.dosage} | Frequencia: ${item.frequency}`, 80, y)

        y += 13
        doc.text(`Quantidade: ${item.quantity} | Duracao: ${item.duration}`, 80, y)

        if (item.instructions) {
          y += 13
          doc
            .font('Helvetica-Oblique')
            .text(`Instrucoes: ${item.instructions}`, 80, y, { width: 435 })
        }

        y += 20
      })

      // ----- Clinical justification -----
      if (data.clinicalJustification) {
        if (y > 650) {
          doc.addPage()
          y = 50
        }

        doc.moveTo(60, y).lineTo(535, y).stroke('#e4e4e7')
        y += 10

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#18181b')
          .text('JUSTIFICATIVA CLINICA', 60, y)

        y += 16
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#3f3f46')
          .text(data.clinicalJustification, 60, y, { width: 475 })

        y += doc.heightOfString(data.clinicalJustification, { width: 475 }) + 10
      }

      // ----- ICD codes -----
      if (data.icdCodes.length > 0) {
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#52525b')
          .text(`CID-10: ${data.icdCodes.join(', ')}`, 60, y)
        y += 20
      }

      // ----- Validity -----
      doc.moveTo(60, y).lineTo(535, y).stroke('#e4e4e7')
      y += 10

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#18181b')
        .text(
          `Validade: ${format(data.validUntil, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
          60,
          y,
        )

      // ----- Signature area -----
      y += 40

      if (data.signedAt && data.digitalSignature) {
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#16a34a')
          .text('Assinado digitalmente', 60, y, { align: 'center' })

        y += 12
        doc
          .fontSize(7)
          .fillColor('#71717a')
          .text(
            `Assinatura: ${data.digitalSignature.slice(0, 40)}...`,
            60,
            y,
            { align: 'center' },
          )

        y += 10
        doc.text(
          `Data: ${format(data.signedAt, "dd/MM/yyyy 'as' HH:mm")}`,
          60,
          y,
          { align: 'center' },
        )
      } else {
        doc
          .moveTo(200, y + 5)
          .lineTo(400, y + 5)
          .stroke('#a1a1aa')

        y += 10
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#71717a')
          .text('Assinatura do Medico', 60, y, { align: 'center' })
      }

      // ----- Footer -----
      y = doc.page.height - 40
      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor('#a1a1aa')
        .text(
          `Documento gerado eletronicamente por WiseDrops | ID: ${data.prescriptionId}`,
          60,
          y,
          { align: 'center' },
        )

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

// ---------------------------------------------------------------------------
// Digital Signature (ICP-Brasil placeholder)
// ---------------------------------------------------------------------------

/**
 * Sign a prescription digitally using ICP-Brasil certificate.
 *
 * In production this integrates with a signing service (e.g., BRy, Certisign,
 * or VIDAAS) that holds the doctor's A3/cloud certificate.
 *
 * The flow would be:
 * 1. Generate PDF hash (SHA-256)
 * 2. Send hash to signing service with doctor's certificate reference
 * 3. Receive PKCS#7/CAdES signature
 * 4. Embed signature into PDF (PAdES) or store separately
 */
export async function signPrescription(
  prescriptionId: string,
  doctorId: string,
): Promise<DigitalSignatureResult> {
  const prescription = await db.prescription.findUnique({
    where: { id: prescriptionId },
    include: { doctor: true },
  })

  if (!prescription) {
    throw new Error('Receita nao encontrada.')
  }

  if (prescription.doctorId !== doctorId) {
    throw new Error('Apenas o medico responsavel pode assinar a receita.')
  }

  if (prescription.status !== PrescriptionStatus.DRAFT) {
    throw new Error('Apenas receitas em rascunho podem ser assinadas.')
  }

  // TODO: In production, integrate with ICP-Brasil signing service
  // Example with BRy Signer Cloud:
  //   1. const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex')
  //   2. const signResult = await bryClient.sign({ hash, certificateId: doctor.icpCertId })
  //   3. Store the CAdES/PAdES signature

  const now = new Date()
  const signaturePlaceholder = `ICP-BR:${prescriptionId}:${doctorId}:${now.toISOString()}:SHA256:PLACEHOLDER`

  // Generate the PDF
  const pdfBuffer = await generatePrescriptionPDF(prescriptionId)

  // Upload PDF to S3
  const s3Key = await StorageService.uploadBuffer({
    prefix: 'prescriptions',
    entityId: prescriptionId,
    filename: `receita-${prescriptionId.slice(0, 8)}.pdf`,
    contentType: 'application/pdf',
    body: pdfBuffer,
  })

  // Generate presigned download URL for the PDF
  const { downloadUrl } = await StorageService.generatePresignedDownloadUrl({
    key: s3Key,
    expiresIn: 365 * 24 * 3600, // 1 year
  })

  // Update prescription record
  await db.prescription.update({
    where: { id: prescriptionId },
    data: {
      status: PrescriptionStatus.SIGNED,
      digitalSignature: signaturePlaceholder,
      signedAt: now,
      pdfUrl: downloadUrl,
    },
  })

  // Create audit log
  await db.auditLog.create({
    data: {
      userId: prescription.doctor.userId,
      action: 'prescription.sign',
      entityType: 'prescription',
      entityId: prescriptionId,
      metadata: {
        prescriptionType: prescription.prescriptionType,
        patientId: prescription.patientId,
      },
    },
  })

  return {
    signature: signaturePlaceholder,
    certificate: 'ICP-Brasil Cloud Certificate (placeholder)',
    timestamp: now.toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Send prescription to patient
// ---------------------------------------------------------------------------

/**
 * Send a signed prescription to the patient via email + in-app notification.
 */
export async function sendPrescriptionToPatient(
  prescriptionId: string,
): Promise<void> {
  const prescription = await db.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
    },
  })

  if (!prescription) {
    throw new Error('Receita nao encontrada.')
  }

  if (prescription.status === PrescriptionStatus.DRAFT) {
    throw new Error('A receita precisa estar assinada antes de ser enviada ao paciente.')
  }

  const patientUserId = prescription.patient.userId

  await NotificationService.notifyPrescriptionReady(patientUserId, {
    patientName: prescription.patient.user.fullName,
    doctorName: prescription.doctor.user.fullName,
    prescriptionId: prescription.id,
    validUntil: format(prescription.validUntil, 'dd/MM/yyyy'),
  })
}

// ---------------------------------------------------------------------------
// Validity checking
// ---------------------------------------------------------------------------

export interface PrescriptionValidityResult {
  isValid: boolean
  reason?: string
  prescriptionType: PrescriptionType
  validUntil: Date
  daysRemaining: number
  status: PrescriptionStatus
}

/**
 * Check if a prescription is still valid for dispensing.
 *
 * Validity rules:
 * - TYPE_A (Notificacao Receita A): 30 days from signing
 * - TYPE_B (Notificacao Receita B): 60 days from signing
 * - SIMPLE (Receita Simples): 180 days (6 months) from signing
 * - Must be in SIGNED or ANVISA_APPROVED status
 * - Cannot have been already dispensed (single-use for TYPE_A)
 */
export async function checkPrescriptionValidity(
  prescriptionId: string,
): Promise<PrescriptionValidityResult> {
  const prescription = await db.prescription.findUnique({
    where: { id: prescriptionId },
  })

  if (!prescription) {
    throw new Error('Receita nao encontrada.')
  }

  const now = new Date()
  const daysRemaining = Math.ceil(
    (prescription.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  )

  const baseResult = {
    prescriptionType: prescription.prescriptionType,
    validUntil: prescription.validUntil,
    daysRemaining: Math.max(0, daysRemaining),
    status: prescription.status,
  }

  // Check status
  const validStatuses: PrescriptionStatus[] = [
    PrescriptionStatus.SIGNED,
    PrescriptionStatus.ANVISA_APPROVED,
  ]

  if (!validStatuses.includes(prescription.status)) {
    const statusReasons: Partial<Record<PrescriptionStatus, string>> = {
      DRAFT: 'Receita ainda nao foi assinada.',
      SENT_TO_ANVISA: 'Aguardando aprovacao da ANVISA.',
      ANVISA_REJECTED: 'Receita rejeitada pela ANVISA.',
      DISPENSED: 'Receita ja foi dispensada.',
      EXPIRED: 'Receita expirada.',
      CANCELLED: 'Receita cancelada.',
    }

    return {
      ...baseResult,
      isValid: false,
      reason: statusReasons[prescription.status] ?? 'Status invalido.',
    }
  }

  // Check expiration
  if (now > prescription.validUntil) {
    // Auto-update status to EXPIRED
    await db.prescription.update({
      where: { id: prescriptionId },
      data: { status: PrescriptionStatus.EXPIRED },
    })

    return {
      ...baseResult,
      isValid: false,
      daysRemaining: 0,
      status: PrescriptionStatus.EXPIRED,
      reason: 'Receita expirada.',
    }
  }

  // TYPE_A is single-use - check if already dispensed via order
  if (prescription.prescriptionType === PrescriptionType.TYPE_A) {
    const existingOrder = await db.order.findFirst({
      where: {
        prescriptionId: prescription.id,
        status: {
          notIn: ['CANCELLED', 'REFUNDED'],
        },
      },
    })

    if (existingOrder) {
      return {
        ...baseResult,
        isValid: false,
        reason: 'Notificacao de Receita A ja utilizada. Solicite nova receita ao medico.',
      }
    }
  }

  return { ...baseResult, isValid: true }
}

/**
 * Calculate the valid-until date for a new prescription.
 */
export function calculateValidUntil(
  prescriptionType: PrescriptionType,
  fromDate?: Date,
): Date {
  const start = fromDate ?? new Date()
  const days = VALIDITY_DAYS[prescriptionType]
  const validUntil = new Date(start)
  validUntil.setDate(validUntil.getDate() + days)
  return validUntil
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatAddress(addr: Record<string, string>): string {
  const parts = [
    addr.street,
    addr.number,
    addr.complement,
    addr.neighborhood,
    addr.city,
    addr.state,
    addr.zipCode ? `CEP ${addr.zipCode}` : '',
  ].filter(Boolean)
  return parts.join(', ')
}

// ---------------------------------------------------------------------------
// Convenience class
// ---------------------------------------------------------------------------

export class PrescriptionService {
  static generatePrescriptionPDF = generatePrescriptionPDF
  static signPrescription = signPrescription
  static sendPrescriptionToPatient = sendPrescriptionToPatient
  static checkPrescriptionValidity = checkPrescriptionValidity
  static calculateValidUntil = calculateValidUntil
  static VALIDITY_DAYS = VALIDITY_DAYS
  static PRESCRIPTION_TYPE_LABELS = PRESCRIPTION_TYPE_LABELS
}
