//src/lib/auth/index.ts

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/db'
import * as schema from '@/db/schema'

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
    requireEmailVerification: false, // true u production
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dana
    updateAge: 60 * 60 * 24,      // refresh svaki dan
  },

  user: {
    additionalFields: {
      plan: {
        type: 'string',
        defaultValue: 'FREE',
        input: false,
      },
      timezone: {
        type: 'string',
        defaultValue: 'UTC',
        input: true,
      },
      currency: {
        type: 'string',
        defaultValue: 'USD',
        input: true,
      },
    },
  },

  trustedOrigins: [process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'],
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user