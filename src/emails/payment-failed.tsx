//src/emails/payment-failed.tsx

import {
  Html, Head, Body, Container, Section,
  Text, Button, Hr, Preview,
} from '@react-email/components'

interface PaymentFailedEmailProps {
  name?: string
  appUrl?: string
}

export function PaymentFailedEmail({
  name = 'Trader',
  appUrl = 'https://tradelog.app',
}: PaymentFailedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Action required: Your Tradelog payment failed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={alertSection}>
            <Text style={alertIcon}>⚠️</Text>
            <Text style={alertTitle}>Payment Failed</Text>
            <Text style={alertText}>
              Hi {name}, we couldn't process your latest Tradelog payment.
              Your Pro features will remain active for a few days while we retry,
              but please update your payment details to avoid any interruption.
            </Text>
            <Button href={`${appUrl}/settings/subscription`} style={button}>
              Update Payment Method →
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            If you have questions, reply to this email.
            <br />
            © {new Date().getFullYear()} Tradelog
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default PaymentFailedEmail

const main = {
  backgroundColor: '#0a0a0a',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '480px',
}

const alertSection = {
  backgroundColor: '#111',
  border: '1px solid #333',
  borderRadius: '12px',
  padding: '32px',
  textAlign: 'center' as const,
}

const alertIcon = {
  fontSize: '36px',
  margin: '0 0 12px 0',
}

const alertTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#fff',
  margin: '0 0 12px 0',
}

const alertText = {
  fontSize: '14px',
  color: '#a1a1aa',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
}

const button = {
  backgroundColor: '#ef4444',
  color: '#fff',
  padding: '12px 24px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
}

const hr = { borderColor: '#222', margin: '24px 0' }

const footer = {
  fontSize: '12px',
  color: '#52525b',
  textAlign: 'center' as const,
  lineHeight: '1.6',
}