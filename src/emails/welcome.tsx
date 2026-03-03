//src/emails/welcome.tsx
import {
  Html, Head, Body, Container, Section,
  Text, Button, Hr, Img, Preview,
} from '@react-email/components'

interface WelcomeEmailProps {
  name?: string
  appUrl?: string
}

export function WelcomeEmail({
  name = 'Trader',
  appUrl = 'https://tradelog.app',
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Tradelog — start tracking your trades today</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Text style={logo}>T</Text>
          </Section>

          {/* Hero */}
          <Section style={heroSection}>
            <Text style={h1}>Welcome to Tradelog, {name}! 👋</Text>
            <Text style={text}>
              You're all set. Tradelog helps you track every trade, understand
              your patterns, and become a more consistent trader.
            </Text>
          </Section>

          {/* Features */}
          <Section style={featuresSection}>
            <Text style={featuresTitle}>Here's what you can do:</Text>
            {[
              { emoji: '📊', title: 'Log your trades', desc: 'Add trades manually or import from cTrader' },
              { emoji: '📈', title: 'Analyse performance', desc: 'See your best symbols, sessions, and days' },
              { emoji: '📓', title: 'Write in your journal', desc: 'Track your psychology and daily reflections' },
              { emoji: '🎯', title: 'Set goals', desc: 'Define monthly P&L or win rate targets' },
            ].map(f => (
              <Section key={f.title} style={featureRow}>
                <Text style={featureEmoji}>{f.emoji}</Text>
                <Section style={featureContent}>
                  <Text style={featureTitle}>{f.title}</Text>
                  <Text style={featureDesc}>{f.desc}</Text>
                </Section>
              </Section>
            ))}
          </Section>

          <Hr style={hr} />

          {/* CTA */}
          <Section style={ctaSection}>
            <Button href={`${appUrl}/dashboard`} style={button}>
              Go to Dashboard →
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section>
            <Text style={footer}>
              You're receiving this because you created a Tradelog account.
              <br />
              © {new Date().getFullYear()} Tradelog ·{' '}
              <a href={`${appUrl}/settings/notifications`} style={link}>
                Unsubscribe
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default WelcomeEmail

// ── Styles ────────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: '#0a0a0a',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '560px',
}

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const logo = {
  display: 'inline-block',
  width: '40px',
  height: '40px',
  backgroundColor: '#6366f1',
  borderRadius: '10px',
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#fff',
  lineHeight: '40px',
  textAlign: 'center' as const,
  margin: '0 auto',
}

const heroSection = {
  backgroundColor: '#111111',
  borderRadius: '12px',
  padding: '32px',
  marginBottom: '24px',
  border: '1px solid #222',
}

const h1 = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: '0 0 12px 0',
  lineHeight: '1.3',
}

const text = {
  fontSize: '15px',
  color: '#a1a1aa',
  lineHeight: '1.6',
  margin: '0',
}

const featuresSection = {
  backgroundColor: '#111111',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
  border: '1px solid #222',
}

const featuresTitle = {
  fontSize: '13px',
  fontWeight: '600',
  color: '#71717a',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 16px 0',
}

const featureRow = {
  display: 'flex',
  marginBottom: '12px',
}

const featureEmoji = {
  fontSize: '20px',
  margin: '0 12px 0 0',
  lineHeight: '1.4',
}

const featureContent = {
  flex: 1,
}

const featureTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#ffffff',
  margin: '0 0 2px 0',
}

const featureDesc = {
  fontSize: '13px',
  color: '#71717a',
  margin: '0',
}

const ctaSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const button = {
  backgroundColor: '#6366f1',
  color: '#ffffff',
  padding: '12px 28px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
}

const hr = {
  borderColor: '#222',
  margin: '24px 0',
}

const footer = {
  fontSize: '12px',
  color: '#52525b',
  textAlign: 'center' as const,
  lineHeight: '1.6',
}

const link = {
  color: '#6366f1',
  textDecoration: 'underline',
}