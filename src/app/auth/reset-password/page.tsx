'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

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

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const [passwordValue, setPasswordValue] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const strength = getPasswordStrength(passwordValue)

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const { error } = await supabase.auth.updateUser({ password: data.password })

    if (error) {
      setServerError('Something went wrong. Please try again.')
      return
    }

    router.push('/auth/login?reset=success')
  }

  return (
    <div className="min-h-svh flex items-center justify-center py-6 px-4 bg-page">
      <div className="w-full max-w-sm bg-card rounded-lg shadow-md border border-line px-8 py-10 flex flex-col gap-5">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <BrandLogo width={160} />
          </div>
          <h1 className="text-2xl font-semibold text-header mb-2">Set New Password</h1>
          <p className="text-sm text-muted">Enter your new password below.</p>
        </div>

        <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <PasswordInput
              label="New Password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password', {
                onChange: (e) => setPasswordValue(e.target.value),
              })}
              className="shadow-md"
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
            label="Confirm New Password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
            className="shadow-md"
          />

          {serverError && (
            <p className="text-xs text-due-danger bg-due-danger-bg px-3 py-2.5 rounded-sm border border-due-danger shadow-md">{serverError}</p>
          )}

          <Button type="submit" fullWidth loading={isSubmitting} className="shadow-md active:scale-95 transition-all">
            Update Password
          </Button>
        </form>
      </div>
    </div>
  )
}
