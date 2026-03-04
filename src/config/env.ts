//src/config/env.ts
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    // App
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    // Database
    DATABASE_URL: z.string().url(),

    // Auth
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    // Whitelist originа razdvojena zarezom: "https://app.com,https://staging.com"
    TRUSTED_ORIGINS_RAW: z.string().default('http://localhost:3000'),

    // Stripe
    STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
    STRIPE_PRO_MONTHLY_PRICE_ID: z.string().startsWith('price_'),
    STRIPE_PRO_YEARLY_PRICE_ID: z.string().startsWith('price_'),
    STRIPE_ELITE_MONTHLY_PRICE_ID: z.string().startsWith('price_'),
    STRIPE_ELITE_YEARLY_PRICE_ID: z.string().startsWith('price_'),

    // Email
    RESEND_API_KEY: z.string().startsWith('re_'),
    EMAIL_FROM: z.string().email(),

    // Admin
    ADMIN_EMAIL: z.string().email(),

    // Cron
    CRON_SECRET: z.string().min(32),
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_APP_NAME: z.string().default('Tradelog'),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  },

  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    TRUSTED_ORIGINS_RAW: process.env.TRUSTED_ORIGINS_RAW,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRO_MONTHLY_PRICE_ID: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    STRIPE_PRO_YEARLY_PRICE_ID: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    STRIPE_ELITE_MONTHLY_PRICE_ID: process.env.STRIPE_ELITE_MONTHLY_PRICE_ID,
    STRIPE_ELITE_YEARLY_PRICE_ID: process.env.STRIPE_ELITE_YEARLY_PRICE_ID,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    CRON_SECRET: process.env.CRON_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
})

// Parsiraj TRUSTED_ORIGINS iz comma-separated stringa
export const TRUSTED_ORIGINS = env.TRUSTED_ORIGINS_RAW
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)