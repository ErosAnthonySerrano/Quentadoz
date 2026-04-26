'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FcGoogle } from 'react-icons/fc'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'

const signupSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignupFormData = z.infer<typeof signupSchema>

function getPasswordStrength(password: string): {
  label: string
  color: string
  width: string
} {
  if (!password) return { label: '', color: 'var(--color-line)', width: '0%' }
  if (password.length < 8) return { label: 'Weak', color: 'var(--color-due-danger)', width: '33%' }

  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^a-zA-Z0-9]/.test(password)
  const score = [hasUpper, hasNumber, hasSymbol].filter(Boolean).length

  if (score <= 1) return { label: 'Weak', color: 'var(--color-due-danger)', width: '33%' }
  if (score === 2) return { label: 'Medium', color: 'var(--color-due-warning)', width: '66%' }
  return { label: 'Strong', color: 'var(--color-due-safe)', width: '100%' }
}

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const strength = getPasswordStrength(passwordValue)

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        setServerError('An account with this email already exists. Try logging in.')
      } else {
        setServerError('Something went wrong. Please try again.')
      }
      return
    }

    setSuccess(true)
  }

  const handleGoogleSignup = async () => {
    setOauthLoading(true)
    setServerError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setServerError('Something went wrong. Please try again.')
      setOauthLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-svh flex items-center justify-center py-6 px-4 bg-page">
        <div className="w-full max-w-sm bg-card rounded-lg shadow-md border border-line px-8 py-10 flex flex-col items-center gap-5 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-accent-light text-accent text-xl font-semibold shadow-sm">✓</div>
          <h2 className="text-2xl font-semibold text-header">Check your email</h2>
          <p className="text-sm text-muted">
            We sent a confirmation link to your email address. Click the link to activate your account.
          </p>
          <Link href="/auth/login" className="text-xs text-accent font-medium no-underline hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh flex items-center justify-center py-6 px-4 bg-page">
      <div className="w-full max-w-sm bg-card rounded-lg shadow-md border border-line px-8 py-10 flex flex-col gap-5">
        <div className="flex flex-col items-center gap-1">
          <BrandLogo width={180} />
          <p className="text-sm text-muted">Create your account</p>
        </div>

        <button
          onClick={handleGoogleSignup}
          disabled={oauthLoading || isSubmitting}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-5 rounded-md border border-line bg-secondary text-body text-sm font-medium cursor-pointer transition-all shadow-sm hover:bg-surface active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {oauthLoading ? (
            <span className="inline-block w-3.5 h-3.5 border-2 border-body/20 border-t-body rounded-full animate-spin" />
          ) : (
            <FcGoogle size={18} />
          )}
          Continue with Google
        </button>

        <div className="flex items-center gap-3">
          <span className="flex-1 h-px bg-line" />
          <span className="text-xs text-muted">or</span>
          <span className="flex-1 h-px bg-line" />
        </div>

        <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
            className="shadow-sm"
          />

          <div className="flex flex-col gap-1.5">
            <PasswordInput
              label="Password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password', {
                onChange: (e) => setPasswordValue(e.target.value),
              })}
              className="shadow-sm"
            />
            {passwordValue && (
              <div className="flex flex-col gap-1">
                <div className="h-1 bg-line rounded-sm overflow-hidden shadow-sm">
                  <div
                    className="h-full rounded-sm transition-all duration-200"
                    style={{ width: strength.width, backgroundColor: strength.color }}
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <PasswordInput
            label="Confirm Password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
            className="shadow-sm"
          />

          {serverError && (
            <p className="text-xs text-due-danger bg-due-danger-bg px-3 py-2.5 rounded-sm border border-due-danger shadow-sm">{serverError}</p>
          )}

          <Button type="submit" fullWidth loading={isSubmitting} disabled={oauthLoading} className="shadow-sm active:scale-95 transition-all">
            Create Account
          </Button>
        </form>

        <p className="text-center text-xs text-muted">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-accent font-medium no-underline hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
