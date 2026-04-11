'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BudgetForm } from '@/components/forms/BudgetForm'
import type { BudgetMonth, Cutoff, BudgetItem } from '@/types'

type LoadState = 'loading' | 'loaded' | 'not_found' | 'error'

interface ExistingData {
  budgetMonth: BudgetMonth
  cutoffs: Cutoff[]
  items: BudgetItem[]
}

export default function EditBudgetPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [data, setData] = useState<ExistingData | null>(null)

  useEffect(() => {
    if (!id) return

    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/auth/login')
        return
      }

      const { data: bm, error: bmError } = await supabase
        .from('budget_months')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (bmError || !bm) {
        setLoadState(bm === null ? 'not_found' : 'error')
        return
      }

      const [{ data: cuts }, { data: itms }] = await Promise.all([
        supabase.from('cutoffs').select('*').eq('budget_month_id', id).order('cutoff_number'),
        supabase.from('budget_items').select('*').eq('budget_month_id', id).order('created_at'),
      ])

      setData({
        budgetMonth: bm,
        cutoffs: cuts ?? [],
        items: itms ?? [],
      })
      setLoadState('loaded')
    }

    load().catch(() => setLoadState('error'))
  }, [id, router])

  if (loadState === 'loading') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-lg shadow-card p-5 h-40 animate-pulse" />
      </div>
    )
  }

  if (loadState === 'not_found') {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-header font-semibold text-xl mb-2">Budget not found</p>
        <p className="text-muted text-sm">This budget doesn&apos;t exist or you don&apos;t have access.</p>
      </div>
    )
  }

  if (loadState === 'error' || !data) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-due-danger font-semibold text-xl mb-2">Failed to load budget</p>
        <p className="text-muted text-sm">Please try again later.</p>
      </div>
    )
  }

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  return (
    <div className="max-w-4xl mx-auto pb-8">
      <h1 className="text-3xl font-semibold text-header mb-1">Edit Budget</h1>
      <p className="text-sm text-muted mb-8">
        {MONTHS[data.budgetMonth.month - 1]} {data.budgetMonth.year}
      </p>
      <BudgetForm mode="edit" existingData={data} />
    </div>
  )
}
