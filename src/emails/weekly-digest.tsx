//src/emails/weekly-digest.tsx

import {
  Html, Head, Body, Container, Section,
  Text, Button, Hr, Preview, Row, Column,
} from '@react-email/components'

interface WeeklyDigestEmailProps {
  name?: string
  appUrl?: string
  stats: {
    totalTrades: number
    winRate: number
    netPnl: number
    profitFactor: number
    winningTrades: number
    losingTrades: number
    bestSymbol?: string
    worstSymbol?: string
  }
  weekLabel?: string
}

export function WeeklyDigestEmail({
  name = 'Trader',
  appUrl = 'https://tradelog.app',
  stats,
  weekLabel = 'This week',
}: WeeklyDigestEmailProps) {
  const isPositive = stats.netPnl >= 0
  const pnlColor = isPositive ? '#10b981' : '#ef4444'
  const pnlPrefix = isPositive ? '+' : ''

  return (
    <Html>
      <Head />
      <Preview>{weekLabel}: {pnlPrefix}${stats.netPnl.toFixed(2)} · {stats.winRate}% win rate</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerLabel}>WEEKLY DIGEST</Text>
            <Text style={headerTitle}>Your week in trading, {name}</Text>
            <Text style={headerSub}>{weekLabel}</Text>
          </Section>

          {/* Big P&L */}
          <Section style={pnlSection}>
            <Text style={pnlLabel}>Net P&L</Text>
            <Text style={{ ...pnlValue, color: pnlColor }}>
              {pnlPrefix}${stats.netPnl.toFixed(2)}
            </Text>
          </Section>

          {/* Stats grid */}
          <Section style={statsSection}>
            <Row>
              <Column style={statCell}>
                <Text style={statValue}>{stats.totalTrades}</Text>
                <Text style={statLabel}>Trades</Text>
              </Column>
              <Column style={statCell}>
                <Text style={{ ...statValue, color: stats.winRate >= 50 ? '#10b981' : '#ef4444' }}>
                  {stats.winRate}%
                </Text>
                <Text style={statLabel}>Win Rate</Text>
              </Column>
              <Column style={statCell}>
                <Text style={{ ...statValue, color: stats.profitFactor >= 1 ? '#10b981' : '#ef4444' }}>
                  {stats.profitFactor.toFixed(2)}
                </Text>
                <Text style={statLabel}>Profit Factor</Text>
              </Column>
              <Column style={statCell}>
                <Text style={statValue}>
                  {stats.winningTrades}W / {stats.losingTrades}L
                </Text>
                <Text style={statLabel}>W/L</Text>
              </Column>
            </Row>
          </Section>

          {/* Best/Worst symbol */}
          {(stats.bestSymbol || stats.worstSymbol) && (
            <Section style={symbolSection}>
              {stats.bestSymbol && (
                <Row style={symbolRow}>
                  <Column>
                    <Text style={symbolLabel}>🏆 Best symbol</Text>
                  </Column>
                  <Column>
                    <Text style={symbolValue}>{stats.bestSymbol}</Text>
                  </Column>
                </Row>
              )}
              {stats.worstSymbol && (
                <Row style={symbolRow}>
                  <Column>
                    <Text style={symbolLabel}>📉 Worst symbol</Text>
                  </Column>
                  <Column>
                    <Text style={{ ...symbolValue, color: '#ef4444' }}>{stats.worstSymbol}</Text>
                  </Column>
                </Row>
              )}
            </Section>
          )}

          <Hr style={hr} />

          <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
            <Button href={`${appUrl}/analytics`} style={button}>
              View Full Analytics →
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Weekly digest from Tradelog ·{' '}
            <a href={`${appUrl}/settings/notifications`} style={footerLink}>
              Unsubscribe
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default WeeklyDigestEmail

const main = {
  backgroundColor: '#0a0a0a',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '560px',
}

const header = {
  backgroundColor: '#111',
  border: '1px solid #222',
  borderRadius: '12px',
  padding: '28px',
  marginBottom: '16px',
  textAlign: 'center' as const,
}

const headerLabel = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#6366f1',
  letterSpacing: '0.1em',
  margin: '0 0 8px 0',
}

const headerTitle = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#fff',
  margin: '0 0 4px 0',
}

const headerSub = {
  fontSize: '13px',
  color: '#71717a',
  margin: '0',
}

const pnlSection = {
  backgroundColor: '#111',
  border: '1px solid #222',
  borderRadius: '12px',
  padding: '28px',
  marginBottom: '16px',
  textAlign: 'center' as const,
}

const pnlLabel = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#71717a',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 8px 0',
}

const pnlValue = {
  fontSize: '40px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '1',
}

const statsSection = {
  backgroundColor: '#111',
  border: '1px solid #222',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '16px',
}

const statCell = {
  textAlign: 'center' as const,
  padding: '8px',
}

const statValue = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#fff',
  margin: '0 0 4px 0',
}

const statLabel = {
  fontSize: '11px',
  color: '#71717a',
  margin: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
}

const symbolSection = {
  backgroundColor: '#111',
  border: '1px solid #222',
  borderRadius: '12px',
  padding: '16px 20px',
  marginBottom: '16px',
}

const symbolRow = {
  marginBottom: '8px',
}

const symbolLabel = {
  fontSize: '13px',
  color: '#a1a1aa',
  margin: '0',
}

const symbolValue = {
  fontSize: '13px',
  fontWeight: '600',
  color: '#fff',
  margin: '0',
  textAlign: 'right' as const,
}

const hr = {
  borderColor: '#222',
  margin: '24px 0',
}

const button = {
  backgroundColor: '#6366f1',
  color: '#fff',
  padding: '12px 28px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
}

const footer = {
  fontSize: '12px',
  color: '#52525b',
  textAlign: 'center' as const,
}

const footerLink = {
  color: '#6366f1',
}