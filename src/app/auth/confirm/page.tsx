'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { createClient } from '@/lib/supabase/client'

function ConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')

    if (!code) {
      setStatus('error')
      setMessage('Invalid confirmation link. Please request a new one.')
      return
    }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setStatus('error')
        setMessage('This confirmation link has expired or is invalid. Please sign up again.')
      } else {
        setStatus('success')
        setMessage('Email confirmed! Redirecting to your dashboard...')
        setTimeout(() => router.push('/dashboard'), 1500)
      }
    })
  }, [searchParams, router])

  return (
    <div className="min-h-svh flex items-center justify-center py-6 px-4 bg-page">
      <div className="w-full max-w-sm bg-card rounded-lg shadow-card border border-line px-8 py-12 flex flex-col items-center gap-4 text-center">
        <BrandLogo width={160} />
        {status === 'loading' && (
          <>
            <div className="w-10 h-10 border-[3px] border-line border-t-accent rounded-full animate-spin" />
            <p className="text-sm text-muted">Confirming your email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-accent-light text-accent text-2xl font-semibold">✓</div>
            <h2 className="text-2xl font-semibold text-header">Email Confirmed</h2>
            <p className="text-sm text-muted">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-due-danger-bg text-due-danger text-2xl font-semibold">✕</div>
            <h2 className="text-2xl font-semibold text-header">Confirmation Failed</h2>
            <p className="text-sm text-muted">{message}</p>
            <a href="/auth/signup" className="text-xs text-accent font-medium no-underline">Back to sign up</a>
          </>
        )}
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmContent />
    </Suspense>
  )
}
