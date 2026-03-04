//src/lib/email/index.ts
import { Resend } from 'resend'
import { env } from '@/config/env'

export const resend = new Resend(env.RESEND_API_KEY)
export const EMAIL_FROM = env.EMAIL_FROM
export const APP_URL = env.NEXT_PUBLIC_APP_URL