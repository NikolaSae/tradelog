//src/lib/email/send.ts

import { render } from '@react-email/render'
import { resend, EMAIL_FROM, APP_URL } from './index'
import { WelcomeEmail } from '@/emails/welcome'
import { WeeklyDigestEmail } from '@/emails/weekly-digest'
import { PaymentFailedEmail } from '@/emails/payment-failed'

export async function sendWelcomeEmail(to: string, name?: string) {
  try {
    const html = await render(WelcomeEmail({ name, appUrl: APP_URL }))
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Welcome to Tradelog 👋',
      html,
    })
  } catch (err) {
    console.error('Failed to send welcome email:', err)
  }
}

export async function sendWeeklyDigestEmail(
  to: string,
  name: string,
  stats: {
    totalTrades: number
    winRate: number
    netPnl: number
    profitFactor: number
    winningTrades: number
    losingTrades: number
    bestSymbol?: string
    worstSymbol?: string
  },
  weekLabel: string
) {
  try {
    const html = await render(WeeklyDigestEmail({ name, appUrl: APP_URL, stats, weekLabel }))
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Your week: ${stats.netPnl >= 0 ? '+' : ''}$${stats.netPnl.toFixed(2)} · ${stats.winRate}% win rate`,
      html,
    })
  } catch (err) {
    console.error('Failed to send weekly digest:', err)
  }
}

export async function sendPaymentFailedEmail(to: string, name?: string) {
  try {
    const html = await render(PaymentFailedEmail({ name, appUrl: APP_URL }))
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Action required: Payment failed',
      html,
    })
  } catch (err) {
    console.error('Failed to send payment failed email:', err)
  }
}