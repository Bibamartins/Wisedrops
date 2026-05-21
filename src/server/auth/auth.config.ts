/**
 * NextAuth v5 Configuration
 *
 * Credentials (email + password with argon2) and Google OAuth.
 * JWT session strategy with role and userId in token/session.
 * Integrates with Prisma for user lookup.
 */

import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { db } from '@/server/db/client'
import type { UserRole } from '@prisma/client'

// bcryptjs (pure JS, works on Node + Edge runtime + Netlify bundler)
async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

// Augment the JWT / Session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: UserRole
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    role: UserRole
  }
}

export const authConfig: NextAuthConfig = {
  // Required for Netlify + any reverse proxy — tells NextAuth to trust
  // x-forwarded-host headers. Without this: "Configuration" error.
  trustHost: true,
  providers: [
    // -----------------------------------------------------------------------
    // Credentials: email + password
    // -----------------------------------------------------------------------
    Credentials({
      id: 'credentials',
      name: 'Email e Senha',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = (credentials.email as string).toLowerCase().trim()
        const password = credentials.password as string

        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            fullName: true,
            passwordHash: true,
            role: true,
            status: true,
            avatarUrl: true,
          },
        })

        if (!user) return null

        // Check account status
        if (user.status === 'SUSPENDED') {
          throw new Error('Conta suspensa. Entre em contato com o suporte.')
        }
        if (user.status === 'DEACTIVATED') {
          throw new Error('Conta desativada.')
        }

        // Verify password
        const isValid = await verifyPassword(user.passwordHash, password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          image: user.avatarUrl,
          role: user.role,
        }
      },
    }),

    // -----------------------------------------------------------------------
    // Google OAuth — enabled only if credentials are set (avoids init error)
    // -----------------------------------------------------------------------
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: 'consent',
                access_type: 'offline',
                response_type: 'code',
              },
            },
          }),
        ]
      : []),
  ],

  // -------------------------------------------------------------------------
  // Session
  // -------------------------------------------------------------------------
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // refresh token every 24h
  },

  // -------------------------------------------------------------------------
  // Custom pages
  // -------------------------------------------------------------------------
  pages: {
    signIn: '/login',
    newUser: '/register',
    error: '/login',
  },

  // -------------------------------------------------------------------------
  // Callbacks
  // -------------------------------------------------------------------------
  callbacks: {
    /**
     * signIn callback - handle Google OAuth linking with existing accounts
     */
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        const existingUser = await db.user.findUnique({
          where: { email: user.email.toLowerCase().trim() },
          select: { id: true, status: true },
        })

        if (existingUser) {
          if (existingUser.status === 'SUSPENDED' || existingUser.status === 'DEACTIVATED') {
            return false
          }
          // Link Google account with existing user (update emailVerified)
          await db.user.update({
            where: { id: existingUser.id },
            data: { emailVerified: new Date() },
          })
          return true
        }

        // New Google user - redirect to registration to complete profile (CPF, phone, etc.)
        return '/register?provider=google'
      }

      return true
    },

    /**
     * JWT callback - embed role and userId into the token
     */
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (user) {
        // For credentials provider, the user object already has role
        if ((user as Record<string, unknown>).role) {
          token.userId = user.id as string
          token.role = (user as Record<string, unknown>).role as UserRole
        } else if (account?.provider === 'google' && user.email) {
          // Google OAuth - look up user in DB
          const dbUser = await db.user.findUnique({
            where: { email: user.email.toLowerCase().trim() },
            select: { id: true, role: true },
          })
          if (dbUser) {
            token.userId = dbUser.id
            token.role = dbUser.role
          }
        }
      }

      // On session update trigger, refresh role from DB
      if (trigger === 'update' && token.userId) {
        const dbUser = await db.user.findUnique({
          where: { id: token.userId },
          select: { role: true },
        })
        if (dbUser) {
          token.role = dbUser.role
        }
      }

      return token
    },

    /**
     * Session callback - expose userId and role to the client
     */
    session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId
      }
      if (token.role) {
        session.user.role = token.role
      }
      return session
    },

    /**
     * Redirect - ensure proper redirect URLs
     */
    redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allow same-origin URLs
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------
  events: {
    async signIn({ user }) {
      if (user.id) {
        // Fire-and-forget audit log
        db.auditLog
          .create({
            data: {
              userId: user.id,
              action: 'auth.signIn',
              entityType: 'user',
              entityId: user.id,
              metadata: {},
            },
          })
          .catch(console.error)
      }
    },
  },

  // -------------------------------------------------------------------------
  // Misc
  // -------------------------------------------------------------------------
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

export default authConfig
