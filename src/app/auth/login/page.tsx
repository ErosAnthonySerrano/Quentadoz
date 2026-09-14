'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FcGoogle } from 'react-icons/fc'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { AuthLayout } from '@/components/ui/AuthLayout'

const loginSchema = z.object({ email: z.string().email('Please enter a valid email address'), password: z.string().min(1, 'Password is required') })
type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter(); const supabase = createClient()
  const [serverError, setServerError] = useState<string | null>(null); const [oauthLoading, setOauthLoading] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })
  const onSubmit = async (data: LoginFormData) => {
    setServerError(null); const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
    if (error) { setServerError(error.message.toLowerCase().includes('email not confirmed') ? 'Please confirm your email before logging in.' : 'Invalid email or password.'); return }
    router.push('/dashboard'); router.refresh()
  }
  const handleGoogleLogin = async () => {
    setOauthLoading(true); setServerError(null)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })
    if (error) { setServerError('Something went wrong. Please try again.'); setOauthLoading(false) }
  }
  return (
    <AuthLayout eyebrow="Welcome back" title="Sign in to Quentadoz" description="Pick up where you left off and keep your month moving with intention.">
      <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <Input label="Email address" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <PasswordInput label="Password" autoComplete="current-password" placeholder="Enter your password" error={errors.password?.message} {...register('password')} />
        <div className="-mt-2 flex justify-end"><Link href="/auth/forgot-password" className="text-xs font-semibold text-accent hover:underline">Forgot password?</Link></div>
        {serverError && <p className="rounded-xl border border-due-danger bg-due-danger-bg px-4 py-3 text-sm text-due-danger">{serverError}</p>}
        <Button type="submit" fullWidth loading={isSubmitting} disabled={oauthLoading} className="rounded-xl py-3.5 shadow-lg shadow-accent/20 active:scale-[.99]">Sign In</Button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" /><span>or continue with</span><span className="h-px flex-1 bg-line" /></div>
      <button onClick={handleGoogleLogin} disabled={oauthLoading || isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-secondary px-5 py-3.5 text-sm font-semibold text-body shadow-sm transition hover:bg-surface active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60">{oauthLoading ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-body/20 border-t-body" /> : <FcGoogle size={18} />}Continue with Google</button>
      <p className="mt-6 text-center text-sm text-muted">Don&apos;t have an account? <Link href="/auth/signup" className="font-semibold text-accent hover:underline">Create an account</Link></p>
    </AuthLayout>
  )
}
