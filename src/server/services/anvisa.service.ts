/**
 * ANVISA Integration Service
 *
 * Handles submission and tracking of ANVISA authorizations for
 * cannabis product importation (RDC 660) and domestic purchase verification (RDC 327).
 *
 * RDC 660/2022 - Import authorization (individual patient)
 * RDC 327/2019 - Domestic products with ANVISA registration
 */

import { db } from '@/server/db/client'
import { AnvisaStatus } from '@prisma/client'

interface AnvisaSubmissionPayload {
  patientCpf: string
  patientName: string
  patientAddress: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  prescriptionData: {
    doctorCrm: string
    doctorCrmState: string
    doctorName: string
    prescriptionDate: string
    prescriptionType: string
    items: Array<{
      productName: string
      concentration: string
      dosage: string
      frequency: string
      quantity: number
    }>
  }
  products: Array<{
    name: string
    manufacturer: string
    rdcClassification: string
    anvisaRegistration?: string
  }>
}

interface AnvisaStatusResponse {
  protocol: string
  status: 'UNDER_ANALYSIS' | 'APPROVED' | 'REJECTED'
  approvedAt?: string
  rejectionReason?: string
  validUntil?: string
  authorizedProducts?: Array<{
    name: string
    authorizedQuantity: number
  }>
}

export class AnvisaService {
  /**
   * Check if a product requires individual ANVISA authorization
   * RDC 327 products (domestic) do NOT require individual auth
   * RDC 660 products (imported) DO require individual auth
   */
  static requiresAuthorization(rdcClassification: string): boolean {
    return rdcClassification === 'RDC660'
  }

  /**
   * Check if patient already has a valid authorization for the products
   */
  static async checkExistingAuthorization(
    patientId: string,
    productNames: string[]
  ): Promise<{ hasValid: boolean; authorization?: { id: string; validUntil: Date | null } }> {
    const existing = await db.anvisaAuthorization.findFirst({
      where: {
        patientId,
        status: AnvisaStatus.APPROVED,
        validUntil: { gt: new Date() },
      },
      orderBy: { approvedAt: 'desc' },
    })

    if (!existing) return { hasValid: false }

    // Check if the authorized products cover the requested ones
    const authorizedProducts = (existing.authorizedProducts as Array<{ name: string }>) || []
    const authorizedNames = authorizedProducts.map((p) => p.name.toLowerCase())
    const allCovered = productNames.every((name) =>
      authorizedNames.some((an) => an.includes(name.toLowerCase()))
    )

    if (allCovered) {
      return {
        hasValid: true,
        authorization: { id: existing.id, validUntil: existing.validUntil },
      }
    }

    return { hasValid: false }
  }

  /**
   * Submit a new ANVISA authorization request
   * In production, this would integrate with ANVISA's portal
   */
  static async submitAuthorization(
    patientId: string,
    payload: AnvisaSubmissionPayload
  ): Promise<string> {
    // Create the authorization record
    const authorization = await db.anvisaAuthorization.create({
      data: {
        patientId,
        status: AnvisaStatus.PENDING_SUBMISSION,
        submissionPayload: payload as unknown as Record<string, unknown>,
      },
    })

    try {
      // TODO: In production, integrate with ANVISA Portal de Servicos
      // https://servicos.anvisa.gov.br
      //
      // The integration would:
      // 1. Authenticate with ANVISA's system (patient credentials or delegated access)
      // 2. Fill the electronic form with patient + prescription + product data
      // 3. Upload prescription PDF
      // 4. Submit and capture the protocol number
      //
      // For now, simulate submission
      const mockProtocol = `ANV-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

      await db.anvisaAuthorization.update({
        where: { id: authorization.id },
        data: {
          status: AnvisaStatus.SUBMITTED,
          anvisaProtocol: mockProtocol,
          submittedAt: new Date(),
        },
      })

      return authorization.id
    } catch (error) {
      // If submission fails, update status
      await db.anvisaAuthorization.update({
        where: { id: authorization.id },
        data: {
          status: AnvisaStatus.PENDING_SUBMISSION,
          responsePayload: { error: String(error) },
        },
      })
      throw error
    }
  }

  /**
   * Poll ANVISA for status updates on pending authorizations
   * This runs as a background job
   */
  static async pollPendingAuthorizations(): Promise<void> {
    const pending = await db.anvisaAuthorization.findMany({
      where: {
        status: { in: [AnvisaStatus.SUBMITTED, AnvisaStatus.UNDER_ANALYSIS] },
      },
      include: { patient: { include: { user: true } } },
    })

    for (const auth of pending) {
      try {
        // TODO: Query ANVISA's system for status updates
        // For now, simulate status check
        const status = await AnvisaService.checkStatusWithAnvisa(auth.anvisaProtocol!)

        if (status) {
          const updateData: Record<string, unknown> = {
            status: status.status === 'APPROVED'
              ? AnvisaStatus.APPROVED
              : status.status === 'REJECTED'
              ? AnvisaStatus.REJECTED
              : AnvisaStatus.UNDER_ANALYSIS,
            responsePayload: status,
          }

          if (status.status === 'APPROVED') {
            updateData.approvedAt = status.approvedAt ? new Date(status.approvedAt) : new Date()
            updateData.validUntil = status.validUntil ? new Date(status.validUntil) : new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000) // 2 years
            updateData.authorizedProducts = status.authorizedProducts
          }

          if (status.status === 'REJECTED') {
            updateData.rejectionReason = status.rejectionReason
          }

          await db.anvisaAuthorization.update({
            where: { id: auth.id },
            data: updateData,
          })

          // TODO: Send notification to patient
          // await NotificationService.send(auth.patient.userId, {
          //   type: 'ANVISA_STATUS_UPDATE',
          //   title: status.status === 'APPROVED' ? 'Autorizacao ANVISA Aprovada!' : 'Atualizacao ANVISA',
          //   body: `Sua autorizacao ${auth.anvisaProtocol} foi ${status.status === 'APPROVED' ? 'aprovada' : 'atualizada'}.`,
          // })
        }
      } catch (error) {
        console.error(`Error polling ANVISA for ${auth.anvisaProtocol}:`, error)
      }
    }
  }

  /**
   * Check status with ANVISA's system (placeholder for real integration)
   */
  private static async checkStatusWithAnvisa(
    protocol: string
  ): Promise<AnvisaStatusResponse | null> {
    // TODO: Real ANVISA API integration
    // This would make an HTTP request to ANVISA's portal or use
    // a headless browser to scrape the status page
    //
    // For products in ANVISA's simplified list, authorization can be
    // approved in the same day (automated process)
    //
    // For other products, manual review takes up to 20 business days

    console.log(`[ANVISA] Checking status for protocol: ${protocol}`)
    return null
  }

  /**
   * Check renewal eligibility for expiring authorizations
   */
  static async checkRenewals(): Promise<void> {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const expiringSoon = await db.anvisaAuthorization.findMany({
      where: {
        status: AnvisaStatus.APPROVED,
        validUntil: { lte: thirtyDaysFromNow, gt: new Date() },
        renewalReminderSent: false,
      },
      include: { patient: { include: { user: true } } },
    })

    for (const auth of expiringSoon) {
      // TODO: Send renewal reminder notification
      await db.anvisaAuthorization.update({
        where: { id: auth.id },
        data: { renewalReminderSent: true },
      })
    }
  }
}
