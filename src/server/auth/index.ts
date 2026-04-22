/**
 * NextAuth v5 entry point
 *
 * Exports `handlers` (for the /api/auth/[...nextauth] route),
 * `auth` (for server-side session access in RSCs, API routes, tRPC context),
 * and `signIn` / `signOut` (for server actions).
 */
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
