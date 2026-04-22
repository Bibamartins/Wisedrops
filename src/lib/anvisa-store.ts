// Shared ANVISA request store — localStorage-backed
// Prototype only (no backend). Seeded with mock data on first read.

export type AnvisaStatus = 'pending' | 'approved' | 'rejected' | 'under_review'

export interface AnvisaRequest {
  id: string
  protocol: string
  patient: string
  doctor: string
  product: string
  submittedAt: string // DD/MM/YYYY
  daysWaiting: number
  status: AnvisaStatus
  // New fields for doctor → admin flow
  source?: 'seeded' | 'doctor' // distinguishes mocks from real submissions
  prescriptionId?: string
  patientDocsUploaded?: boolean
  icd10?: string
  justification?: string
  [key: string]: unknown
}

const STORAGE_KEY = 'wisedrops_anvisa_requests'

const SEED: AnvisaRequest[] = [
  { id: '1', protocol: '#78250', patient: 'Maria Silva', doctor: 'Dr. Carlos Oliveira', product: 'THC:CBD 1:1 500mg', submittedAt: '25/03/2026', daysWaiting: 6, status: 'pending', source: 'seeded' },
  { id: '2', protocol: '#78249', patient: 'Joao Santos', doctor: 'Dra. Ana Beatriz Costa', product: 'THC Oral 10mg/ml', submittedAt: '24/03/2026', daysWaiting: 7, status: 'pending', source: 'seeded' },
  { id: '3', protocol: '#78248', patient: 'Roberto Lima', doctor: 'Dr. Paulo Henrique Dias', product: 'THC:CBD 1:1 500mg', submittedAt: '23/03/2026', daysWaiting: 8, status: 'under_review', source: 'seeded' },
  { id: '4', protocol: '#78247', patient: 'Carla Mendes', doctor: 'Dr. Carlos Oliveira', product: 'THC Oral 10mg/ml', submittedAt: '22/03/2026', daysWaiting: 9, status: 'under_review', source: 'seeded' },
  { id: '5', protocol: '#78246', patient: 'Fernando Souza', doctor: 'Dra. Juliana Martins', product: 'THC:CBD 1:1 500mg', submittedAt: '21/03/2026', daysWaiting: 10, status: 'pending', source: 'seeded' },
  { id: '6', protocol: '#78245', patient: 'Sandra Oliveira', doctor: 'Dr. Carlos Oliveira', product: 'THC Oral 10mg/ml', submittedAt: '20/03/2026', daysWaiting: 11, status: 'pending', source: 'seeded' },
  { id: '7', protocol: '#78244', patient: 'Lucia Ferreira', doctor: 'Dra. Ana Beatriz Costa', product: 'THC:CBD 1:1 500mg', submittedAt: '18/03/2026', daysWaiting: 13, status: 'pending', source: 'seeded' },
  { id: '8', protocol: '#78243', patient: 'Paulo Dias', doctor: 'Dr. Paulo Henrique Dias', product: 'THC Oral 10mg/ml', submittedAt: '15/03/2026', daysWaiting: 16, status: 'rejected', source: 'seeded' },
  { id: '9', protocol: '#78240', patient: 'Ana Paula Reis', doctor: 'Dra. Juliana Martins', product: 'THC:CBD 1:1 500mg', submittedAt: '14/03/2026', daysWaiting: 17, status: 'rejected', source: 'seeded' },
  { id: '10', protocol: '#78234', patient: 'Marcos Pereira', doctor: 'Dr. Carlos Oliveira', product: 'THC Oral 10mg/ml', submittedAt: '10/03/2026', daysWaiting: 0, status: 'approved', source: 'seeded' },
  { id: '11', protocol: '#78230', patient: 'Tereza Santos', doctor: 'Dra. Ana Beatriz Costa', product: 'THC:CBD 1:1 500mg', submittedAt: '08/03/2026', daysWaiting: 0, status: 'approved', source: 'seeded' },
  { id: '12', protocol: '#78225', patient: 'Ricardo Alves', doctor: 'Dr. Paulo Henrique Dias', product: 'THC Oral 10mg/ml', submittedAt: '05/03/2026', daysWaiting: 0, status: 'approved', source: 'seeded' },
]

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function getRequests(): AnvisaRequest[] {
  if (!isBrowser()) return SEED
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED))
      return SEED
    }
    return JSON.parse(raw) as AnvisaRequest[]
  } catch {
    return SEED
  }
}

function saveRequests(list: AnvisaRequest[]): void {
  if (!isBrowser()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export interface NewRequestInput {
  patient: string
  doctor: string
  product: string
  prescriptionId?: string
  patientDocsUploaded?: boolean
  icd10?: string
  justification?: string
}

export function addRequest(input: NewRequestInput): AnvisaRequest {
  const list = getRequests()
  const nextNum = 78250 + list.filter((r) => r.source === 'doctor').length + 1
  const today = new Date()
  const newRequest: AnvisaRequest = {
    patient: input.patient,
    doctor: input.doctor,
    product: input.product,
    prescriptionId: input.prescriptionId,
    patientDocsUploaded: input.patientDocsUploaded ?? false,
    icd10: input.icd10,
    justification: input.justification,
    id: `dr-${Date.now()}`,
    protocol: `#${nextNum}`,
    submittedAt: today.toLocaleDateString('pt-BR'),
    daysWaiting: 0,
    status: 'pending',
    source: 'doctor',
  }
  saveRequests([newRequest, ...list])
  return newRequest
}

export function updateRequest(id: string, patch: Partial<AnvisaRequest>): void {
  const list = getRequests()
  const next = list.map((r) => (r.id === id ? { ...r, ...patch } : r))
  saveRequests(next)
}

export function markDocsUploaded(patientName: string): void {
  const list = getRequests()
  const next = list.map((r) =>
    r.patient === patientName && r.source === 'doctor' && !r.patientDocsUploaded
      ? { ...r, patientDocsUploaded: true }
      : r
  )
  saveRequests(next)
}
