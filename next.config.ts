import type { NextConfig } from 'next'

// Čitamo direktno jer next.config se izvršava prije env validacije
const trustedOrigins = (process.env.TRUSTED_ORIGINS_RAW ?? 'http://localhost:3000')
  .split(',')
  .map((o: string) => o.trim())
  .filter(Boolean)
  // next.config treba samo host, bez protokola
  .map((o: string) => o.replace(/^https?:\/\//, ''))

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      allowedOrigins: trustedOrigins,
      bodySizeLimit: '10mb',
    },
  },
}

export default nextConfig