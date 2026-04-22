// Shared appointments store — localStorage-backed
// Bridges patient booking ↔ doctor schedule

export type AppointmentStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed'

export type ConsultationType = 'video' | 'in_person'

export interface Appointment {
  id: string
  doctorId: string
  doctorName: string
  doctorSpecialty?: string
  patientId: string
  patientName: string
  patientCondition?: string
  consultationKind: 'Primeira Consulta' | 'Retorno'
  type: ConsultationType
  date: string // YYYY-MM-DD
  time: string // HH:MM (24h)
  chiefComplaint?: string
  status: AppointmentStatus
  createdAt: string // ISO
  videoRoomUrl?: string
}

const STORAGE_KEY = 'wisedrops_appointments'
const DEFAULT_DOCTOR_ID = 'dr-carlos-oliveira'
const DEFAULT_DOCTOR_NAME = 'Dr. Carlos Oliveira'

const SEED: Appointment[] = [
  {
    id: 'appt-seed-1',
    doctorId: DEFAULT_DOCTOR_ID,
    doctorName: DEFAULT_DOCTOR_NAME,
    doctorSpecialty: 'Neurologia',
    patientId: 'pat-maria',
    patientName: 'Maria Silva',
    patientCondition: 'Insonia',
    consultationKind: 'Retorno',
    type: 'video',
    date: '2026-04-05',
    time: '14:00',
    status: 'confirmed',
    createdAt: '2026-03-28T10:00:00.000Z',
    videoRoomUrl: 'https://demo.daily.co/wisedrops-mock',
  },
  {
    id: 'appt-seed-2',
    doctorId: DEFAULT_DOCTOR_ID,
    doctorName: DEFAULT_DOCTOR_NAME,
    doctorSpecialty: 'Neurologia',
    patientId: 'pat-joao',
    patientName: 'Joao Santos',
    patientCondition: 'Dor Cronica',
    consultationKind: 'Retorno',
    type: 'video',
    date: '2026-04-07',
    time: '10:00',
    status: 'confirmed',
    createdAt: '2026-03-28T11:00:00.000Z',
    videoRoomUrl: 'https://demo.daily.co/wisedrops-mock',
  },
]

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function getAppointments(): Appointment[] {
  if (!isBrowser()) return SEED
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED))
      return SEED
    }
    return JSON.parse(raw) as Appointment[]
  } catch {
    return SEED
  }
}

function save(list: Appointment[]): void {
  if (!isBrowser()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function getById(id: string): Appointment | undefined {
  return getAppointments().find((a) => a.id === id)
}

export function getByDoctor(doctorId: string = DEFAULT_DOCTOR_ID): Appointment[] {
  return getAppointments().filter((a) => a.doctorId === doctorId)
}

export function getByPatient(patientId: string): Appointment[] {
  return getAppointments().filter((a) => a.patientId === patientId)
}

export function getPendingForDoctor(doctorId: string = DEFAULT_DOCTOR_ID): Appointment[] {
  return getAppointments().filter(
    (a) => a.doctorId === doctorId && a.status === 'pending_confirmation'
  )
}

export interface CreateAppointmentInput {
  doctorId?: string
  doctorName?: string
  doctorSpecialty?: string
  patientId: string
  patientName: string
  patientCondition?: string
  consultationKind?: 'Primeira Consulta' | 'Retorno'
  type?: ConsultationType
  date: string
  time: string
  chiefComplaint?: string
}

export function createAppointment(input: CreateAppointmentInput): Appointment {
  const list = getAppointments()
  const appt: Appointment = {
    id: `appt-${Date.now()}`,
    doctorId: input.doctorId ?? DEFAULT_DOCTOR_ID,
    doctorName: input.doctorName ?? DEFAULT_DOCTOR_NAME,
    doctorSpecialty: input.doctorSpecialty,
    patientId: input.patientId,
    patientName: input.patientName,
    patientCondition: input.patientCondition,
    consultationKind: input.consultationKind ?? 'Primeira Consulta',
    type: input.type ?? 'video',
    date: input.date,
    time: input.time,
    chiefComplaint: input.chiefComplaint,
    status: 'pending_confirmation',
    createdAt: new Date().toISOString(),
    videoRoomUrl: 'https://demo.daily.co/wisedrops-mock',
  }
  save([appt, ...list])
  return appt
}

export function updateStatus(id: string, status: AppointmentStatus): void {
  const list = getAppointments()
  save(list.map((a) => (a.id === id ? { ...a, status } : a)))
}
