'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { useBudgetStore } from '@/store/useBudgetStore'
import { signOutAction } from '@/app/actions/auth'
import type { User, UserDefault, UserDefaultCutoff } from '@/types'
import { ordinalLabel } from '@/utils/budget'
import { HiPlus, HiMinus } from 'react-icons/hi'

// ─── Delete confirmation modal ───────────────────────────────────────────────

function DeleteModal({ onConfirm, onClose, loading }: { onConfirm: () => void; onClose: () => void; loading: boolean }) {
  const [typed, setTyped] = useState('')
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-card p-6 w-full max-w-sm">
        <h3 className="text-base font-semibold text-header mb-2">Delete Account</h3>
        <p className="text-sm text-body mb-4">
          This action is <strong>permanent</strong> and cannot be undone. All your budget data will be deleted.
        </p>
        <p className="text-sm text-muted mb-2">Type <strong>DELETE</strong> to confirm:</p>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="w-full px-3 py-2 rounded-md text-sm text-header bg-surface border border-line outline-none mb-4"
          placeholder="DELETE"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            variant="danger"
            type="button"
            disabled={typed !== 'DELETE' || loading}
            loading={loading}
            onClick={onConfirm}
          >
            Delete My Account
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter()
  const { toasts, show: showToast, dismiss } = useToast()
  const clearBudget = useBudgetStore((s) => s.clearBudget)

  const [user, setUser] = useState<User | null>(null)
  const [userDefault, setUserDefault] = useState<UserDefault | null>(null)
  const [loadingPage, setLoadingPage] = useState(true)

  // Budget defaults form state
  const [defCutoffCount, setDefCutoffCount] = useState(2)
  const [defCutoffs, setDefCutoffs] = useState<UserDefaultCutoff[]>([])
  const [savingDefaults, setSavingDefaults] = useState(false)
  // Snapshot of what's persisted — used to detect unsaved changes
  const [savedDefaults, setSavedDefaults] = useState<{ cutoff_count: number; cutoffs: UserDefaultCutoff[] } | null>(null)

  // Password reset
  const [sendingReset, setSendingReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  // Sign out
  const [signingOut, setSigningOut] = useState(false)

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.replace('/auth/login'); return }
      setUser(u as unknown as User)

      const { data: ud } = await supabase
        .from('user_defaults')
        .select('*')
        .eq('user_id', u.id)
        .maybeSingle()

      if (ud) {
        setUserDefault(ud)
        setDefCutoffCount(ud.cutoff_count)
        const normalized = Array.from({ length: ud.cutoff_count }, (_, i) => {
          const existing = (ud.cutoffs as UserDefaultCutoff[]).find(
            (c) => c.cutoff_number === i + 1
          )
          return existing ?? { cutoff_number: i + 1, salary: 0, day: null }
        })
        setDefCutoffs(normalized)
        setSavedDefaults({ cutoff_count: ud.cutoff_count, cutoffs: normalized })
      } else {
        // initialize empty defaults
        const initial = [
          { cutoff_number: 1, salary: 0, day: null },
          { cutoff_number: 2, salary: 0, day: null },
        ]
        setDefCutoffs(initial)
        setSavedDefaults({ cutoff_count: 2, cutoffs: initial })
      }
      setLoadingPage(false)
    }
    load()
  }, [router])

  // Sync defCutoffs array when count changes
  useEffect(() => {
    setDefCutoffs((prev) =>
      Array.from({ length: defCutoffCount }, (_, i) => {
        return prev[i] ?? { cutoff_number: i + 1, salary: 0, day: null }
      }).map((c, i) => ({ ...c, cutoff_number: i + 1 }))
    )
  }, [defCutoffCount])

  function updateDefCutoff(index: number, field: 'salary' | 'day', value: number | null) {
    setDefCutoffs((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    )
  }

  async function saveDefaults() {
    if (!user) return
    setSavingDefaults(true)
    try {
      const supabase = createClient()
      const payload = {
        user_id: user.id,
        cutoff_count: defCutoffCount,
        cutoffs: defCutoffs,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase
        .from('user_defaults')
        .upsert(payload, { onConflict: 'user_id' })
      if (error) throw new Error(error.message)
      setSavedDefaults({ cutoff_count: defCutoffCount, cutoffs: defCutoffs })
      showToast('Budget defaults saved.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save defaults.', 'error')
    } finally {
      setSavingDefaults(false)
    }
  }

  async function sendPasswordReset() {
    if (!user) return
    setSendingReset(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw new Error(error.message)
      setResetSent(true)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send reset email.', 'error')
    } finally {
      setSendingReset(false)
    }
  }

  async function signOut() {
    setSigningOut(true)
    try {
      clearBudget()
      await signOutAction()
    } catch (err) {
      setSigningOut(false)
      showToast(err instanceof Error ? err.message : 'Failed to sign out.', 'error')
    }
  }

  async function confirmDelete() {
    setDeletingAccount(true)
    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      clearBudget()
      router.replace('/auth/signup?deleted=1')
    } catch {
      showToast('Failed to delete account. Please try again.', 'error')
      setDeletingAccount(false)
    }
  }

  if (loadingPage) {
    return (
      <div className="max-w-xl mx-auto flex flex-col gap-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg shadow-card p-6 h-28 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!user) return null

  const isEmailUser = !user.app_metadata?.provider || user.app_metadata.provider === 'email'
  const providerLabel = user.app_metadata?.provider === 'google' ? 'Google OAuth' : 'Email & Password'

  const hasChanges = savedDefaults === null ||
    savedDefaults.cutoff_count !== defCutoffCount ||
    JSON.stringify(savedDefaults.cutoffs) !== JSON.stringify(defCutoffs)

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-5 pb-8">
      <h1 className="text-3xl font-semibold text-header">Profile & Settings</h1>

      {/* Account info */}
      <div className="bg-card rounded-lg shadow-card p-6">
        <h2 className="text-base font-semibold text-header mb-4">Account Information</h2>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Email</span>
            <span className="text-body font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Provider</span>
            <span className="text-body">{providerLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Member since</span>
            <span className="text-body">
              {new Date(user.created_at).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Budget Defaults */}
      <div className="bg-card rounded-lg shadow-card p-6">
        <h2 className="text-base font-semibold text-header mb-1">Budget Defaults</h2>
        <p className="text-xs text-muted mb-5">
          These defaults auto-fill your salary and credit dates when creating a new budget.
        </p>

        {/* Cutoff count */}
        <div className="mb-5">
          <label className="text-sm font-medium text-body block mb-2">Default Cutoff Count</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDefCutoffCount((n) => Math.max(1, n - 1))}
              className="w-8 h-8 rounded-md bg-surface border border-line flex items-center justify-center text-body hover:bg-line transition-colors"
            >
              <HiMinus size={14} />
            </button>
            <span className="text-lg font-semibold text-header w-6 text-center">{defCutoffCount}</span>
            <button
              type="button"
              onClick={() => setDefCutoffCount((n) => Math.min(31, n + 1))}
              className="w-8 h-8 rounded-md bg-surface border border-line flex items-center justify-center text-body hover:bg-line transition-colors"
            >
              <HiPlus size={14} />
            </button>
          </div>
        </div>

        {/* Per-cutoff salary + day */}
        <div className="flex flex-col gap-4 mb-5">
          {defCutoffs.map((cutoff, i) => (
            <div key={i} className="p-4 bg-surface rounded-lg border border-line-light">
              <p className="text-sm font-semibold text-header mb-3">{ordinalLabel(i + 1)}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted">Default Salary (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={cutoff.salary || ''}
                    onChange={(e) => updateDefCutoff(i, 'salary', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-md text-sm text-header bg-card border border-line outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted">Credit Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="e.g. 15"
                    value={cutoff.day ?? ''}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      updateDefCutoff(i, 'day', isNaN(v) ? null : Math.min(31, Math.max(1, v)))
                    }}
                    className="w-full px-3 py-2 rounded-md text-sm text-header bg-card border border-line outline-none"
                  />
                  <span className="text-xs text-muted">Day 1–31. If it doesn&apos;t exist in the month, it&apos;ll be left blank.</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={saveDefaults} loading={savingDefaults} disabled={!hasChanges || savingDefaults}>
          Save Defaults
        </Button>
      </div>

      {/* Change password */}
      {isEmailUser && (
        <div className="bg-card rounded-lg shadow-card p-6">
          <h2 className="text-base font-semibold text-header mb-1">Change Password</h2>
          <p className="text-xs text-muted mb-4">
            We&apos;ll send a password reset link to your email address.
          </p>
          {resetSent ? (
            <p className="text-sm text-due-safe font-medium">
              A password reset link has been sent to your email.
            </p>
          ) : (
            <Button variant="secondary" onClick={sendPasswordReset} loading={sendingReset}>
              Send Password Reset Email
            </Button>
          )}
        </div>
      )}

      {/* Sign out */}
      <div className="bg-card rounded-lg shadow-card p-6">
        <h2 className="text-base font-semibold text-header mb-1">Sign Out</h2>
        <p className="text-xs text-muted mb-4">You will be redirected to the login page.</p>
        <Button variant="secondary" onClick={signOut} loading={signingOut}>
          Sign Out
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="bg-due-danger-bg border border-due-danger rounded-lg p-6">
        <h2 className="text-base font-semibold text-due-danger mb-1">Danger Zone</h2>
        <p className="text-xs text-body mb-4">
          This action is permanent and cannot be undone. All your budget data will be deleted.
        </p>
        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
          Delete My Account
        </Button>
      </div>

      {showDeleteModal && (
        <DeleteModal
          onConfirm={confirmDelete}
          onClose={() => setShowDeleteModal(false)}
          loading={deletingAccount}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
