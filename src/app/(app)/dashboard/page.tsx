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
import { HiOutlineHandRaised } from 'react-icons/hi2'

type LoadState = 'loading' | 'empty' | 'loaded' | 'error'

export default function DashboardPage() {
  const supabase = React.useMemo(() => createClient(), [])
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
  }, [supabase])

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
        <div className="flex flex-col gap-6 pb-16 xl:pb-0 xl:h-full xl:min-h-0 xl:overflow-hidden">
          <div className="flex flex-col gap-6 xl:grid xl:grid-cols-3 xl:grid-rows-[auto_minmax(0,1fr)] xl:items-stretch xl:gap-5 xl:flex-1 xl:min-h-0">
          <section className="dashboard-card p-5 sm:p-6 md:p-8 xl:col-span-1 xl:h-full">
            <div className="flex flex-col gap-5 sm:gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-semibold text-header flex items-center gap-2 min-w-0">
                  <span>{monthName} {year}</span>
                  <HiOutlineHandRaised size={24} className="text-accent" />
                </h1>
                <p className="text-title text-xl sm:text-2xl mt-1">Welcome back!</p>
              </div>

            </div>

            {dueSoonCount > 0 && !bannerDismissed && (
              <div className="mt-5">
                <DueSoonBanner
                  count={dueSoonCount}
                  onDismiss={() => setBannerDismissed(true)}
                />
              </div>
            )}
          </section>

          <div className="xl:col-span-1 xl:min-h-0 xl:h-full">
            <CutoffSalaryWidget cutoffs={cutoffs} />
          </div>
          <div className="xl:col-span-1 xl:min-h-0 xl:h-full">
            <TotalSummaryWidget cutoffs={cutoffs} items={items} />
          </div>

          <div className="xl:col-span-2 xl:min-h-0">
            <ExpensesTableWidget
              cutoffs={cutoffs}
              items={items}
              updatingIds={updatingIds}
              onChangeStatus={handleChangeStatus}
              budgetMonthId={budgetMonth.id}
            />
          </div>

          <div className="xl:col-span-1 xl:min-h-0">
            <MonthlySummaryWidget cutoffs={cutoffs} items={items} />
          </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  )
}
