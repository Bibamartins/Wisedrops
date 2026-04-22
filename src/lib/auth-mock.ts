// Mock Auth System - Client-side localStorage-based auth for demo purposes
// Makes the entire app functional without needing a backend database

export interface MockUser {
  id: string
  email: string
  fullName: string
  phone: string
  cpf: string
  dateOfBirth: string
  gender: string
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN'
  createdAt: string
  // Patient-specific
  conditions?: string[]
  patientFor?: string
  experience?: string
  hasCompletedQuiz?: boolean
  hasUploadedDocuments?: boolean
}

const USERS_KEY = 'wisedrops_users'
const CURRENT_USER_KEY = 'wisedrops_current_user'

function isBrowser() {
  return typeof window !== 'undefined'
}

export function getAllUsers(): Record<string, MockUser & { passwordHash: string }> {
  if (!isBrowser()) return {}
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveAllUsers(users: Record<string, MockUser & { passwordHash: string }>) {
  if (!isBrowser()) return
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// Naive hash (for demo only - never use in production)
function hashPassword(password: string): string {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i)
    hash |= 0
  }
  return `mock_${Math.abs(hash)}_${password.length}`
}

export function registerUser(data: {
  email: string
  password: string
  fullName: string
  phone: string
  cpf: string
  dateOfBirth: string
  gender: string
  conditions?: string[]
  patientFor?: string
  experience?: string
}): { success: boolean; error?: string; user?: MockUser } {
  if (!isBrowser()) return { success: false, error: 'Not in browser' }

  const users = getAllUsers()

  // Check if email already exists
  if (users[data.email.toLowerCase()]) {
    return { success: false, error: 'Email ja cadastrado. Faca login.' }
  }

  const user: MockUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    email: data.email.toLowerCase(),
    fullName: data.fullName,
    phone: data.phone,
    cpf: data.cpf,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    role: 'PATIENT',
    createdAt: new Date().toISOString(),
    conditions: data.conditions || [],
    patientFor: data.patientFor,
    experience: data.experience,
    hasCompletedQuiz: false,
    hasUploadedDocuments: false,
  }

  users[data.email.toLowerCase()] = {
    ...user,
    passwordHash: hashPassword(data.password),
  }
  saveAllUsers(users)

  // Auto-login after registration
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))

  return { success: true, user }
}

export function loginUser(email: string, password: string): { success: boolean; error?: string; user?: MockUser } {
  if (!isBrowser()) return { success: false, error: 'Not in browser' }

  const users = getAllUsers()
  const userWithHash = users[email.toLowerCase()]

  // Demo accounts always work (without registration)
  const DEMO_ACCOUNTS: Record<string, MockUser> = {
    'maria@teste.com': {
      id: 'demo_patient_001',
      email: 'maria@teste.com',
      fullName: 'Maria Silva',
      phone: '(11) 99987-6543',
      cpf: '123.456.789-00',
      dateOfBirth: '1988-05-14',
      gender: 'FEMALE',
      role: 'PATIENT',
      createdAt: new Date().toISOString(),
      conditions: ['Ansiedade', 'Insonia'],
      hasCompletedQuiz: true,
      hasUploadedDocuments: true,
    },
    'dr.carlos@wisedrops.com.br': {
      id: 'demo_doctor_001',
      email: 'dr.carlos@wisedrops.com.br',
      fullName: 'Dr. Carlos Oliveira',
      phone: '(11) 99988-7766',
      cpf: '',
      dateOfBirth: '1975-03-20',
      gender: 'MALE',
      role: 'DOCTOR',
      createdAt: new Date().toISOString(),
    },
    'admin@wisedrops.com.br': {
      id: 'demo_admin_001',
      email: 'admin@wisedrops.com.br',
      fullName: 'Admin WiseDrops',
      phone: '',
      cpf: '',
      dateOfBirth: '',
      gender: '',
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
    },
  }

  const demoUser = DEMO_ACCOUNTS[email.toLowerCase()]
  if (demoUser && password === 'senha123') {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(demoUser))
    return { success: true, user: demoUser }
  }

  if (!userWithHash) {
    return { success: false, error: 'Email nao encontrado. Cadastre-se primeiro.' }
  }

  if (userWithHash.passwordHash !== hashPassword(password)) {
    return { success: false, error: 'Senha incorreta.' }
  }

  const { passwordHash, ...user } = userWithHash
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  return { success: true, user }
}

export function getCurrentUser(): MockUser | null {
  if (!isBrowser()) return null
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function updateCurrentUser(updates: Partial<MockUser>) {
  if (!isBrowser()) return
  const user = getCurrentUser()
  if (!user) return

  const updatedUser = { ...user, ...updates }
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser))

  // Also update in users store
  const users = getAllUsers()
  if (users[user.email]) {
    users[user.email] = { ...users[user.email], ...updates }
    saveAllUsers(users)
  }
}

export function logout() {
  if (!isBrowser()) return
  localStorage.removeItem(CURRENT_USER_KEY)
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}
