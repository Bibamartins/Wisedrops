'use client'

/**
 * useAuth — client-side hook that mirrors the shape of the old auth-mock API
 * but uses NextAuth under the hood. Pages that previously called getCurrentUser()
 * should migrate to `const { user } = useAuth()`.
 */
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'PHARMACY_MANAGER'
  avatarUrl?: string | null
}

export function useAuth() {
  const session = useSession()
  const router = useRouter()

  const isLoading = session.status === 'loading'
  const isAuthenticated = session.status === 'authenticated'

  const user: AuthUser | null =
    isAuthenticated && session.data?.user?.id
      ? {
          id: session.data.user.id,
          email: session.data.user.email ?? '',
          fullName: session.data.user.name ?? '',
          role: session.data.user.role,
          avatarUrl: session.data.user.image,
        }
      : null

  async function login(email: string, password: string) {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    if (result?.error) {
      return { success: false, error: 'Email ou senha invalidos' }
    }
    return { success: true }
  }

  async function logout() {
    await signOut({ redirect: false })
    router.push('/')
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
  }
}

/**
 * useMe — returns the full user record from the database via tRPC (patient/doctor includes)
 * Use this when you need more than what's in the session (e.g. patient.conditions, doctor.crm).
 */
export function useMe() {
  const { isAuthenticated } = useAuth()
  const query = trpc.auth.me.useQuery(undefined, {
    enabled: isAuthenticated,
  })
  return query
}
