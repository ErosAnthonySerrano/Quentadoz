'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BudgetMonth, Cutoff, BudgetItem } from '@/types'
import { getDueStatus } from '@/utils/budget'
import { EmptyState } from '@/components/widgets/EmptyState'
import { DueSoonBanner } from '@/components/widgets/DueSoonBanner'
import { CutoffSalaryWidget } from '@/components/widgets/CutoffSalaryWidget'
import { TotalSummaryWidget } from '@/components/widgets/TotalSummaryWidget'
import { ExpensesTableWidget } from '@/components/widgets/ExpensesTableWidget'
import { MonthlySummaryWidget } from '@/components/widgets/MonthlySummaryWidget'
import { DashboardSkeleton } from '@/components/widgets/DashboardSkeleton'
import { ToastContainer, useToast } from '@/components/ui/Toast'

type LoadState = 'loading' | 'empty' | 'loaded' | 'error'

export default function DashboardPage() {
  const supabase = createClient()
  const { toasts, show: showToast, dismiss } = useToast()

  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [budgetMonth, setBudgetMonth] = useState<BudgetMonth | null>(null)
  const [cutoffs, setCutoffs] = useState<Cutoff[]>([])
  const [items, setItems] = useState<BudgetItem[]>([])
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [bannerDismissed, setBannerDismissed] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()

      const { data: bm, error: bmError } = await supabase
        .from('budget_months')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month)
        .eq('year', year)
        .maybeSingle()

      if (bmError) {
        setLoadState('error')
        return
      }

      if (!bm) {
        setLoadState('empty')
        return
      }

      const [{ data: cutoffsData, error: cutoffsError }, { data: itemsData, error: itemsError }] =
        await Promise.all([
          supabase.from('cutoffs').select('*').eq('budget_month_id', bm.id).order('cutoff_number'),
          supabase.from('budget_items').select('*').eq('budget_month_id', bm.id).order('created_at'),
        ])

      if (cutoffsError || itemsError) {
        setLoadState('error')
        return
      }

      setBudgetMonth(bm)
      setCutoffs(cutoffsData ?? [])
      setItems(itemsData ?? [])
      setLoadState('loaded')
    }

    load()
  }, [])

  const handleChangeStatus = useCallback(
    async (item: BudgetItem) => {
      const newStatus = item.status === 'paid' ? 'unpaid' : 'paid'

      // Optimistic update
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
      )
      setUpdatingIds((prev) => new Set(prev).add(item.id))

      const { error } = await supabase
        .from('budget_items')
        .update({ status: newStatus })
        .eq('id', item.id)

      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })

      if (error) {
        // Revert
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: item.status } : i))
        )
        showToast('Failed to update status. Please try again.', 'error')
      } else {
        showToast(`Marked as ${newStatus}.`, 'success')
      }
    },
    [supabase, showToast]
  )

  const dueSoonCount = items.filter(
    (i) => i.status === 'unpaid' && getDueStatus(i.due_date) === 'danger'
  ).length

  const now = new Date()
  const monthName = now.toLocaleString('en-US', { month: 'long' })
  const year = now.getFullYear()

  return (
    <>
      {loadState === 'loading' && <DashboardSkeleton />}

      {loadState === 'error' && (
        <p className="text-sm text-due-danger text-center py-12">
          Something went wrong loading your dashboard. Please refresh the page.
        </p>
      )}

      {loadState === 'empty' && <EmptyState />}

      {loadState === 'loaded' && budgetMonth && (
        <div className="flex flex-col gap-6 pb-8">
          <h1 className="text-3xl font-semibold text-header">
            {monthName} {year}
          </h1>

          {dueSoonCount > 0 && !bannerDismissed && (
            <DueSoonBanner
              count={dueSoonCount}
              onDismiss={() => setBannerDismissed(true)}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CutoffSalaryWidget cutoffs={cutoffs} />
            <TotalSummaryWidget cutoffs={cutoffs} items={items} />
          </div>

          <ExpensesTableWidget
            items={items}
            updatingIds={updatingIds}
            onChangeStatus={handleChangeStatus}
            budgetMonthId={budgetMonth.id}
          />

          <MonthlySummaryWidget cutoffs={cutoffs} items={items} />
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  )
}
