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

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const [oauthLoading, setOauthLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setServerError('Please confirm your email before logging in.')
      } else {
        setServerError('Invalid email or password.')
      }
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleGoogleLogin = async () => {
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

  return (
    <div className="min-h-svh flex items-center justify-center py-6 px-4 bg-page">
      <div className="w-full max-w-sm bg-card rounded-lg shadow-card border border-line px-8 py-10 flex flex-col gap-5">
        <div className="flex flex-col items-center gap-1">
          <BrandLogo width={180} />
          <p className="text-sm text-muted">Welcome back</p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={oauthLoading || isSubmitting}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-5 rounded-md border border-line bg-secondary text-body text-sm font-medium cursor-pointer transition-colors hover:bg-surface disabled:opacity-60 disabled:cursor-not-allowed"
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
          />
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex justify-end -mt-2">
            <Link href="/auth/forgot-password" className="text-xs text-accent font-medium no-underline">
              Forgot password?
            </Link>
          </div>

          {serverError && (
            <p className="text-xs text-due-danger bg-due-danger-bg px-3 py-2.5 rounded-sm">{serverError}</p>
          )}

          <Button type="submit" fullWidth loading={isSubmitting} disabled={oauthLoading}>
            Sign In
          </Button>
        </form>

        <p className="text-center text-xs text-muted">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-accent font-medium no-underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
