'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setServerError('Something went wrong. Please try again.')
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-svh flex items-center justify-center py-6 px-4 bg-page">
        <div className="w-full max-w-sm bg-card rounded-lg shadow-card border border-line px-8 py-10 flex flex-col items-center gap-4 text-center">
          <div className="text-4xl">✉</div>
          <h2 className="text-2xl font-semibold text-header">Check your email</h2>
          <p className="text-sm text-muted">
            Password reset link sent. Check your email and follow the link to reset your password.
          </p>
          <Link href="/auth/login" className="text-xs text-accent font-medium no-underline">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh flex items-center justify-center py-6 px-4 bg-page">
      <div className="w-full max-w-sm bg-card rounded-lg shadow-card border border-line px-8 py-10 flex flex-col gap-5">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <BrandLogo width={160} />
          </div>
          <h1 className="text-2xl font-semibold text-header mb-2">Reset Password</h1>
          <p className="text-sm text-muted">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          {serverError && (
            <p className="text-xs text-due-danger bg-due-danger-bg px-3 py-2.5 rounded-sm">{serverError}</p>
          )}

          <Button type="submit" fullWidth loading={isSubmitting}>
            Send Reset Link
          </Button>
        </form>

        <p className="text-center">
          <Link href="/auth/login" className="text-xs text-accent font-medium no-underline">
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
