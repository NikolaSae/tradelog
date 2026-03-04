//src/lib/auth/index.ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { env } from '@/config/env'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    // FIX: true u produkciji
    requireEmailVerification: env.NODE_ENV === 'production',
    // Rate limit na password reset
    resetPasswordTokenExpiresIn: 60 * 60, // 1h
  },

  // Rate limiting za auth endpoint-e
  rateLimit: {
    window: 60,        // sekundi
    max: 10,           // max 10 pokušaja u 60s
    storage: 'memory', // ili 'database' za multi-instance
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  user: {
    additionalFields: {
      plan: { type: 'string', defaultValue: 'FREE', input: false },
      timezone: { type: 'string', defaultValue: 'UTC', input: true },
      currency: { type: 'string', defaultValue: 'USD', input: true },
      role: { type: 'string', defaultValue: 'user', input: false },
      emailVerificationSentAt: { type: 'date', input: false },
    },
  },

  // FIX: trustedOrigins iz env-a, ne hardkodovano
  trustedOrigins: env.TRUSTED_ORIGINS_RAW.split(',').map(o => o.trim()).filter(Boolean),
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user