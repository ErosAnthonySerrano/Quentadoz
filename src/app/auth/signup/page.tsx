'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FcGoogle } from 'react-icons/fc'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { AuthLayout } from '@/components/ui/AuthLayout'

const signupSchema = z.object({ email: z.string().email('Please enter a valid email address'), password: z.string().min(8, 'Password must be at least 8 characters'), confirmPassword: z.string().min(1, 'Please confirm your password') }).refine((data) => data.password === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })
type SignupFormData = z.infer<typeof signupSchema>

function getPasswordStrength(password: string) {
  if (!password) return { label: '', color: 'var(--color-line)', width: '0%' }
  if (password.length < 8) return { label: 'Weak', color: 'var(--color-due-danger)', width: '33%' }
  const score = [/[A-Z]/.test(password), /\d/.test(password), /[^a-zA-Z0-9]/.test(password)].filter(Boolean).length
  if (score <= 1) return { label: 'Weak', color: 'var(--color-due-danger)', width: '33%' }
  if (score === 2) return { label: 'Medium', color: 'var(--color-due-warning)', width: '66%' }
  return { label: 'Strong', color: 'var(--color-due-safe)', width: '100%' }
}

export default function SignupPage() {
  const supabase = createClient(); const [serverError, setServerError] = useState<string | null>(null); const [success, setSuccess] = useState(false); const [oauthLoading, setOauthLoading] = useState(false); const [passwordValue, setPasswordValue] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) })
  const strength = getPasswordStrength(passwordValue)
  const onSubmit = async (data: SignupFormData) => { setServerError(null); const { error } = await supabase.auth.signUp({ email: data.email, password: data.password }); if (error) { setServerError(error.message.toLowerCase().includes('already registered') ? 'An account with this email already exists. Try logging in.' : 'Something went wrong. Please try again.'); return }; setSuccess(true) }
  const handleGoogleSignup = async () => { setOauthLoading(true); setServerError(null); const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } }); if (error) { setServerError('Something went wrong. Please try again.'); setOauthLoading(false) } }
  if (success) return <AuthLayout compact eyebrow="You’re almost there" title="Check your email" description="We sent a confirmation link to your email address. Click the link to activate your account."><div className="flex justify-center"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-light text-xl font-semibold text-accent">✓</div></div><p className="mt-5 text-center text-sm text-muted"><Link href="/auth/login" className="font-semibold text-accent hover:underline">Back to login</Link></p></AuthLayout>
  return <AuthLayout eyebrow="New account" title="Create your Quentadoz account" description="Set up your personal budgeting space and start making every cutoff count.">
    <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <Input label="Email address" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
      <div className="flex flex-col gap-1.5"><PasswordInput label="Password" autoComplete="new-password" placeholder="At least 8 characters" error={errors.password?.message} {...register('password', { onChange: (e) => setPasswordValue(e.target.value) })} />{passwordValue && <div className="flex flex-col gap-1"><div className="h-1 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full transition-all duration-200" style={{ width: strength.width, backgroundColor: strength.color }} /></div><span className="text-xs font-semibold" style={{ color: strength.color }}>{strength.label}</span></div>}</div>
      <PasswordInput label="Confirm password" autoComplete="new-password" placeholder="Re-enter your password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      {serverError && <p className="rounded-xl border border-due-danger bg-due-danger-bg px-4 py-3 text-sm text-due-danger">{serverError}</p>}
      <Button type="submit" fullWidth loading={isSubmitting} disabled={oauthLoading} className="rounded-xl py-3.5 shadow-lg shadow-accent/20 active:scale-[.99]">Create Account</Button>
    </form>
    <div className="my-6 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" /><span>or continue with</span><span className="h-px flex-1 bg-line" /></div>
    <button onClick={handleGoogleSignup} disabled={oauthLoading || isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-secondary px-5 py-3.5 text-sm font-semibold text-body shadow-sm transition hover:bg-surface active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60">{oauthLoading ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-body/20 border-t-body" /> : <FcGoogle size={18} />}Continue with Google</button>
    <p className="mt-6 text-center text-sm text-muted">Already have an account? <Link href="/auth/login" className="font-semibold text-accent hover:underline">Sign in</Link></p>
  </AuthLayout>
}
