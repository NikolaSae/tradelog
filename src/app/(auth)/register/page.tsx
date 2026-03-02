//src/app/(auth)/register/page.tsx

import { AuthCard } from '@/components/auth/auth-card'
import { RegisterForm } from '@/components/auth/register-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Create Account' }

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Start your trading journal today. Free forever."
    >
      <RegisterForm />
    </AuthCard>
  )
}