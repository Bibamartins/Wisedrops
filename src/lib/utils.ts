import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format cents to BRL currency
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

// Format CPF: 000.000.000-00
export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

// Format phone: (00) 00000-0000
export function formatPhone(phone: string): string {
  return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

// Format date to Brazilian format
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

// Format date with time
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

// Calculate adherence percentage
export function calculateAdherence(taken: number, total: number): number {
  if (total === 0) return 0
  return Math.round((taken / total) * 100)
}

// Validate CPF
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return false
  if (/^(\d)\1+$/.test(cleaned)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned.charAt(i)) * (10 - i)
  let check = 11 - (sum % 11)
  if (check === 10 || check === 11) check = 0
  if (check !== parseInt(cleaned.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned.charAt(i)) * (11 - i)
  check = 11 - (sum % 11)
  if (check === 10 || check === 11) check = 0
  return check === parseInt(cleaned.charAt(10))
}

// Condition labels in Portuguese
export const CONDITIONS = {
  'G40': 'Epilepsia',
  'F41.1': 'Ansiedade Generalizada',
  'F32': 'Depressao',
  'G43': 'Enxaqueca',
  'M79.7': 'Fibromialgia',
  'G47.0': 'Insonia',
  'R52': 'Dor Cronica',
  'F84': 'Autismo',
  'G20': 'Parkinson',
  'C80': 'Oncologia',
  'F10-F19': 'Dependencia Quimica',
  'OTHER': 'Outras Condicoes',
} as const

// Prescription type labels
export const PRESCRIPTION_TYPES = {
  TYPE_A: { label: 'Receita A (Amarela)', color: 'yellow', description: 'THC > 0.2% - Valida por 30 dias' },
  TYPE_B: { label: 'Receita B (Azul)', color: 'blue', description: 'THC < 0.2% - Valida por 60 dias' },
  SIMPLE: { label: 'Receita Simples', color: 'gray', description: 'Produtos com registro ANVISA' },
} as const

// Order status labels
export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: 'Aguardando Pagamento', color: 'yellow' },
  PAID: { label: 'Pago', color: 'green' },
  PROCESSING: { label: 'Processando', color: 'blue' },
  AWAITING_ANVISA: { label: 'Aguardando ANVISA', color: 'orange' },
  ANVISA_APPROVED: { label: 'Aprovado ANVISA', color: 'green' },
  SHIPPED: { label: 'Enviado', color: 'blue' },
  IN_TRANSIT: { label: 'Em Transito', color: 'blue' },
  OUT_FOR_DELIVERY: { label: 'Saiu para Entrega', color: 'purple' },
  DELIVERED: { label: 'Entregue', color: 'green' },
  CANCELLED: { label: 'Cancelado', color: 'red' },
  REFUNDED: { label: 'Reembolsado', color: 'gray' },
}
