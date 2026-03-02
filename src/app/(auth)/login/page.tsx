//src/app/(auth)/login/page.tsx

import { AuthCard } from '@/components/auth/auth-card'
import { LoginForm } from '@/components/auth/login-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your Tradelog account"
    >
      <LoginForm />
    </AuthCard>
  )
}