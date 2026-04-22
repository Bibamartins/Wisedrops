/**
 * ANVISA RDC Business Rules Engine
 *
 * Encodes the regulatory rules for cannabis products in Brazil:
 * - RDC 327/2019: Domestic products manufactured in Brazil
 * - RDC 660/2022: Importation of cannabis products by individuals
 */

export type PrescriptionType = 'TYPE_A' | 'TYPE_B' | 'SIMPLE'
export type RDCClassification = 'RDC327' | 'RDC660'

interface Product {
  thcContent: number | null
  cbdContent: number | null
  rdcClassification: string
  anvisaRegistration: string | null
}

interface PrescriptionValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  requiredPrescriptionType: PrescriptionType
  requiresAnvisaAuthorization: boolean
  authorizationValidityDays: number
  prescriptionValidityDays: number
  maxQuantityPerAuthorization: number | null
}

/**
 * Determine required prescription type based on THC content
 * Per ANVISA regulations:
 * - THC > 0.2%: Type A (Notificacao de Receita Amarela) - stricter control
 * - THC <= 0.2%: Type B (Notificacao de Receita Azul) - standard
 * - CBD only (no THC): Simple prescription may suffice for RDC 327 products
 */
export function getRequiredPrescriptionType(product: Product): PrescriptionType {
  const thc = product.thcContent ?? 0

  if (thc > 0.2) return 'TYPE_A'
  if (thc > 0) return 'TYPE_B'

  // Pure CBD products with ANVISA registration may use simple prescription
  if (product.rdcClassification === 'RDC327' && product.anvisaRegistration) {
    return 'SIMPLE'
  }

  return 'TYPE_B'
}

/**
 * Get prescription validity period in days
 * - Type A: 30 days
 * - Type B: 60 days
 * - Simple: 180 days
 */
export function getPrescriptionValidity(type: PrescriptionType): number {
  switch (type) {
    case 'TYPE_A': return 30
    case 'TYPE_B': return 60
    case 'SIMPLE': return 180
  }
}

/**
 * Check if a product requires individual ANVISA import authorization
 * RDC 327 products: NO (already registered, sold at pharmacies)
 * RDC 660 products: YES (need individual patient authorization)
 */
export function requiresAnvisaAuthorization(product: Product): boolean {
  return product.rdcClassification === 'RDC660'
}

/**
 * Get ANVISA authorization validity in days
 * Import authorizations under RDC 660 are valid for 2 years (730 days)
 */
export function getAuthorizationValidity(rdcClassification: string): number {
  if (rdcClassification === 'RDC660') return 730 // 2 years
  return 0 // No authorization needed for RDC327
}

/**
 * Validate a prescription against a set of products
 */
export function validatePrescription(
  prescriptionType: PrescriptionType,
  products: Product[]
): PrescriptionValidation {
  const errors: string[] = []
  const warnings: string[] = []

  // Determine the most restrictive prescription type needed
  let requiredType: PrescriptionType = 'SIMPLE'
  for (const product of products) {
    const productType = getRequiredPrescriptionType(product)
    if (productType === 'TYPE_A') requiredType = 'TYPE_A'
    else if (productType === 'TYPE_B' && requiredType !== 'TYPE_A') requiredType = 'TYPE_B'
  }

  // Check if provided prescription type is sufficient
  const typeHierarchy: Record<PrescriptionType, number> = {
    'SIMPLE': 0,
    'TYPE_B': 1,
    'TYPE_A': 2,
  }

  if (typeHierarchy[prescriptionType] < typeHierarchy[requiredType]) {
    errors.push(
      `Tipo de receita insuficiente. Produto requer receita ${
        requiredType === 'TYPE_A' ? 'A (amarela)' : 'B (azul)'
      }, mas foi fornecida receita ${
        prescriptionType === 'SIMPLE' ? 'simples' : prescriptionType === 'TYPE_B' ? 'B (azul)' : 'A (amarela)'
      }.`
    )
  }

  // Check for mixed origins
  const origins = new Set(products.map((p) => p.rdcClassification))
  if (origins.size > 1) {
    warnings.push(
      'Pedido contem produtos nacionais (RDC 327) e importados (RDC 660). Serao necessarias duas vias de entrega.'
    )
  }

  // Check ANVISA authorization requirement
  const needsAuth = products.some(requiresAnvisaAuthorization)

  // Check for products without ANVISA registration (RDC 327)
  const domesticWithoutReg = products.filter(
    (p) => p.rdcClassification === 'RDC327' && !p.anvisaRegistration
  )
  if (domesticWithoutReg.length > 0) {
    errors.push('Produto nacional sem registro ANVISA nao pode ser comercializado (RDC 327).')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    requiredPrescriptionType: requiredType,
    requiresAnvisaAuthorization: needsAuth,
    authorizationValidityDays: needsAuth ? 730 : 0,
    prescriptionValidityDays: getPrescriptionValidity(requiredType),
    maxQuantityPerAuthorization: null, // ANVISA does not currently set a fixed limit
  }
}

/**
 * Check if prescription is still valid
 */
export function isPrescriptionValid(
  prescriptionType: PrescriptionType,
  signedAt: Date
): boolean {
  const validityDays = getPrescriptionValidity(prescriptionType)
  const expiresAt = new Date(signedAt.getTime() + validityDays * 24 * 60 * 60 * 1000)
  return new Date() < expiresAt
}

/**
 * Get renewal recommendation based on authorization expiry
 */
export function getRenewalRecommendation(validUntil: Date): {
  shouldRenew: boolean
  urgency: 'none' | 'low' | 'medium' | 'high'
  daysUntilExpiry: number
  message: string
} {
  const now = new Date()
  const daysUntilExpiry = Math.ceil((validUntil.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

  if (daysUntilExpiry > 60) {
    return { shouldRenew: false, urgency: 'none', daysUntilExpiry, message: '' }
  }
  if (daysUntilExpiry > 30) {
    return {
      shouldRenew: true,
      urgency: 'low',
      daysUntilExpiry,
      message: `Sua autorizacao ANVISA vence em ${daysUntilExpiry} dias. Considere renovar.`,
    }
  }
  if (daysUntilExpiry > 7) {
    return {
      shouldRenew: true,
      urgency: 'medium',
      daysUntilExpiry,
      message: `Atencao: sua autorizacao ANVISA vence em ${daysUntilExpiry} dias. Renove para nao interromper o tratamento.`,
    }
  }
  return {
    shouldRenew: true,
    urgency: 'high',
    daysUntilExpiry,
    message: `URGENTE: sua autorizacao ANVISA vence em ${daysUntilExpiry} dias! Renove imediatamente.`,
  }
}
