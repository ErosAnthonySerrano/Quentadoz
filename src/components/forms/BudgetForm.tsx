'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { CutoffSection } from './CutoffSection'
import { DivideModal } from './DivideModal'
import { formSchema, emptyCutoff, emptyItem } from './budgetFormSchema'
import type { FormValues, ItemFormValue } from './budgetFormSchema'
import { ordinalLabel, formatCurrency, formatDate } from '@/utils/budget'
import type { BudgetMonth, Cutoff, BudgetItem, UserDefaultCutoff } from '@/types'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface ExistingData {
  budgetMonth: BudgetMonth
  cutoffs: Cutoff[]
  items: BudgetItem[]
}

interface BudgetFormProps {
  mode: 'new' | 'edit'
  existingData?: ExistingData
  reuseId?: string
}

type DivideTarget = { cutoffIndex: number; itemIndex: number }

// ─── helpers ────────────────────────────────────────────────────────────────

function buildDefaultValues(
  mode: 'new' | 'edit',
  cutoffCount: number,
  now: Date,
  existing?: ExistingData
): FormValues {
  if (mode === 'edit' && existing) {
    const { budgetMonth, cutoffs: existingCutoffs, items } = existing
    return {
      month: budgetMonth.month,
      year: budgetMonth.year,
      cutoffs: existingCutoffs
        .sort((a, b) => a.cutoff_number - b.cutoff_number)
        .map((c) => {
          const cutoffItems = items
            .filter((i) => i.cutoff_id === c.id)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

          // Collect unique custom column names from all items
          const customColSet = new Set<string>()
          cutoffItems.forEach((item) => {
            Object.keys(item.custom_fields ?? {}).forEach((k) => customColSet.add(k))
          })
          const customColumns = Array.from(customColSet)

          return {
            id: c.id,
            cutoff_number: c.cutoff_number,
            salary: c.salary,
            date: c.date,
            customColumns,
            items: cutoffItems.length > 0
              ? cutoffItems.map((item) => ({
                  id: item.id,
                  name: item.name,
                  amount: item.amount,
                  due_date: item.due_date ?? '',
                  custom_fields: item.custom_fields ?? {},
                }))
              : [emptyItem()],
          }
        }),
    }
  }

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    cutoffs: Array.from({ length: cutoffCount }, (_, i) => emptyCutoff(i + 1)),
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function BudgetForm({ mode, existingData, reuseId }: BudgetFormProps) {
  const router = useRouter()
  const { toasts, show: showToast, dismiss } = useToast()

  const now = new Date()

  // Step 1 state
  const initialCutoffCount = existingData ? existingData.budgetMonth.cutoff_count : 2
  const [step, setStep] = useState<1 | 2 | 3>(mode === 'edit' ? 2 : 1)
  const [cutoffCount, setCutoffCount] = useState(initialCutoffCount)
  const [customCount, setCustomCount] = useState('')
  const [loadingPrev, setLoadingPrev] = useState(false)
  const [prevBudget, setPrevBudget] = useState<ExistingData | null>(null)
  const [currBudget, setCurrBudget] = useState<ExistingData | null>(null)
  const [prevChecked, setPrevChecked] = useState(false)
  const [prevExpanded, setPrevExpanded] = useState(false)
  const [currExpanded, setCurrExpanded] = useState(false)
  const [userDefaults, setUserDefaults] = useState<UserDefaultCutoff[] | null>(null)
  const [reuseLoading, setReuseLoading] = useState(!!reuseId)

  // Divide modal state
  const [divideTarget, setDivideTarget] = useState<DivideTarget | null>(null)

  // React Hook Form
  const {
    control,
    register,
    watch,
    setValue,
    getValues,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: buildDefaultValues(mode, initialCutoffCount, now, existingData),
    mode: 'onBlur',
  })

  const { fields: cutoffFields, append: appendCutoff, remove: removeCutoff } = useFieldArray({
    control,
    name: 'cutoffs',
  })

  // Watch month/year at the top so useEffect can access them
  const currentMonth = watch('month')
  const currentYear = watch('year')

  // Load and auto-apply a specific budget for reuse (from ?reuse= query param)
  useEffect(() => {
    if (!reuseId || mode !== 'new') return
    async function loadReuse() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: bm } = await supabase
          .from('budget_months')
          .select('*')
          .eq('id', reuseId)
          .eq('user_id', user.id)
          .maybeSingle()
        if (!bm) {
          showToast('Budget not found.', 'error')
          return
        }
        const [{ data: cuts }, { data: itms }] = await Promise.all([
          supabase.from('cutoffs').select('*').eq('budget_month_id', bm.id).order('cutoff_number'),
          supabase.from('budget_items').select('*').eq('budget_month_id', bm.id),
        ])
        if (!cuts || !itms) return
        const sourceData: ExistingData = { budgetMonth: bm, cutoffs: cuts, items: itms }
        setCutoffCount(cuts.length)
        goToStep2(cuts.length, sourceData)
      } finally {
        setReuseLoading(false)
      }
    }
    loadReuse()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reuseId])

  // Load user defaults once on mount (new mode only)
  useEffect(() => {
    if (mode !== 'new') return
    async function loadDefaults() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('user_defaults')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) {
        setUserDefaults(data.cutoffs as UserDefaultCutoff[])
        // Only auto-apply count from defaults if user hasn't changed it already
        setCutoffCount(data.cutoff_count)
      }
    }
    loadDefaults()
  }, [mode])

  // Remap all date fields when the budget month changes
  const prevMonthYearRef = useRef<{ month: number; year: number } | null>(null)
  useEffect(() => {
    if (step !== 2) return
    if (!prevMonthYearRef.current) {
      prevMonthYearRef.current = { month: currentMonth, year: currentYear }
      return
    }
    if (
      prevMonthYearRef.current.month === currentMonth &&
      prevMonthYearRef.current.year === currentYear
    ) return

    prevMonthYearRef.current = { month: currentMonth, year: currentYear }

    const values = getValues()
    values.cutoffs.forEach((cutoff, ci) => {
      if (cutoff.date) {
        setValue(
          `cutoffs.${ci}.date`,
          remapDate(cutoff.date, currentMonth, currentYear),
          { shouldDirty: true }
        )
      }
      cutoff.items.forEach((item, ii) => {
        if (item.due_date) {
          setValue(
            `cutoffs.${ci}.items.${ii}.due_date`,
            remapDate(item.due_date, currentMonth, currentYear),
            { shouldDirty: true }
          )
        }
      })
    })
  }, [currentMonth, currentYear, step])

  // ── Step 1: check for previous month budget ────────────────────────────

  const checkPreviousBudget = useCallback(async () => {
    if (prevChecked) return
    setPrevChecked(true)
    setLoadingPrev(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth()
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
      const currMonth = now.getMonth() + 1
      const currYear = now.getFullYear()

      const [prevResult, currResult] = await Promise.all([
        supabase
          .from('budget_months')
          .select('*')
          .eq('user_id', user.id)
          .eq('month', prevMonth)
          .eq('year', prevYear)
          .maybeSingle(),
        supabase
          .from('budget_months')
          .select('*')
          .eq('user_id', user.id)
          .eq('month', currMonth)
          .eq('year', currYear)
          .maybeSingle(),
      ])

      async function loadBudgetData(bm: { id: string } | null) {
        if (!bm) return null
        const [{ data: cuts }, { data: itms }] = await Promise.all([
          supabase.from('cutoffs').select('*').eq('budget_month_id', bm.id).order('cutoff_number'),
          supabase.from('budget_items').select('*').eq('budget_month_id', bm.id),
        ])
        if (!cuts || !itms) return null
        return { budgetMonth: bm, cutoffs: cuts, items: itms } as ExistingData
      }

      const [prev, curr] = await Promise.all([
        loadBudgetData(prevResult.data),
        loadBudgetData(currResult.data),
      ])

      if (prev) setPrevBudget(prev)
      if (curr) setCurrBudget(curr)
    } finally {
      setLoadingPrev(false)
    }
  }, [prevChecked, now])

  // ── Step 1 → Step 2: initialize form ───────────────────────────────────

  /**
   * Given a source date string (YYYY-MM-DD) and a target month/year,
   * returns a YYYY-MM-DD string using the same day but in the target month.
   * If the day doesn't exist in the target month (e.g. Feb 30), returns ''.
   */
  function remapDate(sourceDate: string | null, targetMonth: number, targetYear: number): string {
    if (!sourceDate) return ''
    const day = parseInt(sourceDate.split('-')[2], 10)
    if (!day) return ''
    const lastDay = new Date(targetYear, targetMonth, 0).getDate() // last day of target month
    if (day > lastDay) return '' // day doesn't exist in target month — leave blank
    return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function goToStep2(count: number, fromPrev?: ExistingData) {
    const newCutoffCount = count
    const targetMonth = now.getMonth() + 1
    const targetYear = now.getFullYear()

    if (fromPrev) {
      // pre-fill from source budget: remap dates to target month, reset status → unpaid
      const cutoffs = fromPrev.cutoffs
        .sort((a, b) => a.cutoff_number - b.cutoff_number)
        .slice(0, newCutoffCount)
        .map((c, i) => {
          const cutoffItems = fromPrev.items
            .filter((item) => item.cutoff_id === c.id)
            .map((item) => ({
              name: item.name,
              amount: item.amount,
              due_date: remapDate(item.due_date, targetMonth, targetYear),
              custom_fields: item.custom_fields ?? {},
            }))

          const customColSet = new Set<string>()
          fromPrev.items
            .filter((item) => item.cutoff_id === c.id)
            .forEach((item) => Object.keys(item.custom_fields ?? {}).forEach((k) => customColSet.add(k)))

          return emptyCutoff(i + 1, Array.from(customColSet))
            ? {
                cutoff_number: i + 1,
                salary: c.salary,
                date: remapDate(c.date, targetMonth, targetYear),
                customColumns: Array.from(customColSet),
                items: cutoffItems.length > 0 ? cutoffItems : [emptyItem()],
              }
            : emptyCutoff(i + 1)
        })

      // pad if count > prev cutoffs
      while (cutoffs.length < newCutoffCount) {
        cutoffs.push(emptyCutoff(cutoffs.length + 1))
      }

      reset({
        month: targetMonth,
        year: targetYear,
        cutoffs,
      })
    } else if (mode === 'new') {
      // Apply user defaults if available: pre-fill salary + credit date from day
      const cutoffs = Array.from({ length: newCutoffCount }, (_, i) => {
        const def = userDefaults?.find((d) => d.cutoff_number === i + 1)
        if (!def) return emptyCutoff(i + 1)
        const date = def.day
          ? remapDate(
              `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(def.day).padStart(2, '0')}`,
              targetMonth,
              targetYear
            )
          : ''
        return {
          ...emptyCutoff(i + 1),
          salary: def.salary ?? 0,
          date,
        }
      })
      reset({
        month: targetMonth,
        year: targetYear,
        cutoffs,
      })
    }

    setStep(2)
  }

  // ── Divide item ─────────────────────────────────────────────────────────

  function openDivide(cutoffIndex: number, itemIndex: number) {
    setDivideTarget({ cutoffIndex, itemIndex })
  }

  function confirmDivide(selectedIndices: number[], perAmount: number) {
    if (!divideTarget) return
    const { cutoffIndex, itemIndex } = divideTarget
    const sourceItem = getValues(`cutoffs.${cutoffIndex}.items.${itemIndex}`)

    selectedIndices.forEach((idx) => {
      if (idx === cutoffIndex) {
        // update the source item's amount
        setValue(`cutoffs.${cutoffIndex}.items.${itemIndex}.amount`, perAmount, { shouldDirty: true })
      } else {
        const targetItems = getValues(`cutoffs.${idx}.items`)
        const targetCustomCols = getValues(`cutoffs.${idx}.customColumns`) ?? []

        const targetCustomFields: Record<string, string> = {}
        targetCustomCols.forEach((col) => {
          targetCustomFields[col] = sourceItem.custom_fields?.[col] ?? ''
        })

        const newItem: ItemFormValue = {
          name: sourceItem.name,
          amount: perAmount,
          due_date: sourceItem.due_date,
          custom_fields: targetCustomFields,
        }

        // If the target cutoff has exactly one blank item, replace it instead of appending
        const isOnlyBlankItem =
          targetItems.length === 1 &&
          !targetItems[0].name &&
          (Number(targetItems[0].amount) === 0 || !targetItems[0].amount)

        if (isOnlyBlankItem) {
          setValue(`cutoffs.${idx}.items`, [newItem], { shouldDirty: true })
        } else {
          setValue(`cutoffs.${idx}.items`, [...targetItems, newItem], { shouldDirty: true })
        }
      }
    })

    setDivideTarget(null)
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  const onSubmit = async (values: FormValues) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      showToast('You must be logged in.', 'error')
      return
    }

    try {
      if (mode === 'new') {
        // Check for duplicate budget month
        const { data: existing } = await supabase
          .from('budget_months')
          .select('id')
          .eq('user_id', user.id)
          .eq('month', values.month)
          .eq('year', values.year)
          .maybeSingle()

        if (existing) {
          showToast(`A budget for ${MONTHS[values.month - 1]} ${values.year} already exists. Please edit it instead.`, 'error')
          return
        }

        // Insert budget_months
        const { data: bm, error: bmError } = await supabase
          .from('budget_months')
          .insert({
            user_id: user.id,
            month: values.month,
            year: values.year,
            cutoff_count: values.cutoffs.length,
          })
          .select()
          .single()

        if (bmError || !bm) throw new Error(bmError?.message ?? 'Failed to create budget month')

        // Insert cutoffs + items
        for (const cutoff of values.cutoffs) {
          const { data: cut, error: cutError } = await supabase
            .from('cutoffs')
            .insert({
              budget_month_id: bm.id,
              cutoff_number: cutoff.cutoff_number,
              salary: cutoff.salary,
              date: cutoff.date,
            })
            .select()
            .single()

          if (cutError || !cut) throw new Error(cutError?.message ?? 'Failed to create cutoff')

          const itemRows = cutoff.items.map((item) => ({
            user_id: user.id,
            budget_month_id: bm.id,
            cutoff_id: cut.id,
            name: item.name,
            amount: item.amount,
            due_date: item.due_date || null,
            status: 'unpaid' as const,
            custom_fields: item.custom_fields ?? {},
          }))

          const { error: itemError } = await supabase.from('budget_items').insert(itemRows)
          if (itemError) throw new Error(itemError.message)
        }
      } else {
        // Edit mode
        if (!existingData) return
        const bmId = existingData.budgetMonth.id

        // Update budget_months
        const { error: bmError } = await supabase
          .from('budget_months')
          .update({ cutoff_count: values.cutoffs.length })
          .eq('id', bmId)

        if (bmError) throw new Error(bmError.message)

        // IDs of cutoffs in original data
        const originalCutoffIds = new Set(existingData.cutoffs.map((c) => c.id))
        const keptCutoffIds = new Set(values.cutoffs.filter((c) => c.id).map((c) => c.id!))

        // Delete removed cutoffs (cascade deletes their items)
        const toDeleteCutoffs = [...originalCutoffIds].filter((id) => !keptCutoffIds.has(id))
        if (toDeleteCutoffs.length > 0) {
          const { error } = await supabase.from('cutoffs').delete().in('id', toDeleteCutoffs)
          if (error) throw new Error(error.message)
        }

        for (const cutoff of values.cutoffs) {
          let cutoffId: string

          if (cutoff.id) {
            // Update existing cutoff
            const { error } = await supabase
              .from('cutoffs')
              .update({ cutoff_number: cutoff.cutoff_number, salary: cutoff.salary, date: cutoff.date })
              .eq('id', cutoff.id)
            if (error) throw new Error(error.message)
            cutoffId = cutoff.id
          } else {
            // Insert new cutoff
            const { data: cut, error } = await supabase
              .from('cutoffs')
              .insert({
                budget_month_id: bmId,
                cutoff_number: cutoff.cutoff_number,
                salary: cutoff.salary,
                date: cutoff.date,
              })
              .select()
              .single()
            if (error || !cut) throw new Error(error?.message ?? 'Failed to create cutoff')
            cutoffId = cut.id
          }

          // Handle items for this cutoff
          const originalItemIds = new Set(
            existingData.items.filter((i) => i.cutoff_id === (cutoff.id ?? '')).map((i) => i.id)
          )
          const keptItemIds = new Set(cutoff.items.filter((i) => i.id).map((i) => i.id!))

          // Delete removed items
          const toDeleteItems = [...originalItemIds].filter((id) => !keptItemIds.has(id))
          if (toDeleteItems.length > 0) {
            const { error } = await supabase.from('budget_items').delete().in('id', toDeleteItems)
            if (error) throw new Error(error.message)
          }

          for (const item of cutoff.items) {
            if (item.id) {
              // Update existing item (preserve status)
              const { error } = await supabase
                .from('budget_items')
                .update({
                  name: item.name,
                  amount: item.amount,
                  due_date: item.due_date || null,
                  custom_fields: item.custom_fields ?? {},
                })
                .eq('id', item.id)
              if (error) throw new Error(error.message)
            } else {
              // Insert new item
              const { error } = await supabase.from('budget_items').insert({
                user_id: user.id,
                budget_month_id: bmId,
                cutoff_id: cutoffId,
                name: item.name,
                amount: item.amount,
                due_date: item.due_date || null,
                status: 'unpaid',
                custom_fields: item.custom_fields ?? {},
              })
              if (error) throw new Error(error.message)
            }
          }
        }
      }

      router.push('/dashboard')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      showToast(msg, 'error')
    }
  }

  // ─── Loading state while reuse budget is being fetched ──────────────────

  if (reuseLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-lg shadow-card p-8 flex flex-col items-center gap-3">
          <span className="inline-block w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-sm text-muted">Loading budget to reuse…</p>
        </div>
      </div>
    )
  }

  // ─── Render: Step 1 ─────────────────────────────────────────────────────

  if (step === 1) {
    const quickCounts = [1, 2, 3, 4]
    const parsedCustom = customCount ? parseInt(customCount, 10) : NaN
    const effectiveCount = customCount ? (isNaN(parsedCustom) ? 0 : parsedCustom) : cutoffCount
    const overLimit = effectiveCount > 31

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-lg shadow-card p-8">
          <h2 className="text-xl font-semibold text-header mb-1">
            How many salary cutoffs do you have this month?
          </h2>
          <p className="text-sm text-muted mb-6">Select the number of times you receive salary per month.</p>

          <div className="flex gap-3 mb-4 flex-wrap">
            {quickCounts.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => { setCutoffCount(n); setCustomCount('') }}
                className={[
                  'w-14 h-14 rounded-lg text-lg font-semibold border transition-colors',
                  cutoffCount === n && !customCount
                    ? 'bg-accent text-white border-accent'
                    : 'bg-surface text-body border-line hover:border-accent',
                ].join(' ')}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm text-muted">More than 4?</span>
            <input
              type="number"
              min={5}
              max={31}
              value={customCount}
              onChange={(e) => {
                setCustomCount(e.target.value)
                const val = parseInt(e.target.value, 10)
                if (!isNaN(val) && val >= 5 && val <= 31) setCutoffCount(val)
              }}
              placeholder="5+"
              className={[
                'w-20 px-3 py-2 rounded-md text-sm text-header bg-surface border outline-none',
                overLimit ? 'border-due-danger' : 'border-line',
              ].join(' ')}
            />
          </div>
          {overLimit && (
            <p className="text-xs text-due-danger mb-4 -mt-4">
              Maximum allowed cutoffs is 31.
            </p>
          )}

          {/* Reuse budgets */}
          {mode === 'new' && (
            <div className="flex flex-col gap-3 mb-6">
              {/* Previous month */}
              <div
                className="border border-line-light rounded-lg p-4 bg-surface cursor-pointer"
                onClick={async () => { setPrevExpanded(true); await checkPreviousBudget() }}
              >
                <p className="text-sm font-medium text-body mb-1">Reuse last month&apos;s budget</p>
                {prevExpanded && loadingPrev ? (
                  <p className="text-xs text-muted">Checking…</p>
                ) : prevExpanded && prevChecked && !prevBudget ? (
                  <p className="text-xs text-muted">No previous budget found.</p>
                ) : prevExpanded && prevBudget ? (
                  <div>
                    <p className="text-xs text-muted mb-2">
                      Found: {MONTHS[prevBudget.budgetMonth.month - 1]} {prevBudget.budgetMonth.year} —{' '}
                      {prevBudget.cutoffs.length} cutoffs, {prevBudget.items.length} items
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        const count = prevBudget.cutoffs.length
                        setCutoffCount(count)
                        goToStep2(count, prevBudget)
                      }}
                    >
                      Fill from last month
                    </Button>
                  </div>
                ) : !prevExpanded ? (
                  <p className="text-xs text-muted">Click to check for a previous budget.</p>
                ) : null}
              </div>

              {/* Current month */}
              <div
                className="border border-line-light rounded-lg p-4 bg-surface cursor-pointer"
                onClick={async () => { setCurrExpanded(true); await checkPreviousBudget() }}
              >
                <p className="text-sm font-medium text-body mb-1">Reuse this month&apos;s current budget</p>
                {currExpanded && loadingPrev ? (
                  <p className="text-xs text-muted">Checking…</p>
                ) : currExpanded && prevChecked && !currBudget ? (
                  <p className="text-xs text-muted">No budget found for this month.</p>
                ) : currExpanded && currBudget ? (
                  <div>
                    <p className="text-xs text-muted mb-2">
                      Found: {MONTHS[currBudget.budgetMonth.month - 1]} {currBudget.budgetMonth.year} —{' '}
                      {currBudget.cutoffs.length} cutoffs, {currBudget.items.length} items
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        const count = currBudget.cutoffs.length
                        setCutoffCount(count)
                        goToStep2(count, currBudget)
                      }}
                    >
                      Fill from this month
                    </Button>
                  </div>
                ) : !currExpanded ? (
                  <p className="text-xs text-muted">Click to check for a current budget.</p>
                ) : null}
              </div>
            </div>
          )}

          <Button
            type="button"
            fullWidth
            disabled={!effectiveCount || effectiveCount < 1 || overLimit}
            onClick={() => goToStep2(effectiveCount)}
          >
            Next → Enter Budget Items
          </Button>
        </div>

        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </div>
    )
  }

  // ─── Render: Step 2 ─────────────────────────────────────────────────────

  const watchValues = watch()

  if (step === 2) {
    return (
      <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(() => setStep(3))} noValidate>
        {/* Month/Year selector */}
        <div className="bg-card rounded-lg shadow-card p-5 mb-5">
          <h2 className="text-xl font-semibold text-header mb-4">Budget Month</h2>
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-body">Month</label>
              <select
                value={currentMonth}
                onChange={(e) => setValue('month', parseInt(e.target.value, 10))}
                disabled={mode === 'edit'}
                className="w-full px-3 py-3 rounded-md text-sm text-header bg-surface outline-none transition-colors border border-line disabled:opacity-60"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-body">Year</label>
              <input
                type="number"
                value={currentYear}
                onChange={(e) => setValue('year', parseInt(e.target.value, 10))}
                disabled={mode === 'edit'}
                className="w-full px-3 py-3 rounded-md text-sm text-header bg-surface outline-none transition-colors border border-line disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Cutoff sections */}
        {cutoffFields.map((field, i) => {
          const otherSalaries = cutoffFields
            .map((_, idx) => ({
              label: ordinalLabel(idx + 1),
              salary: Number(watch(`cutoffs.${idx}.salary`)) || 0,
            }))
            .filter((_, idx) => idx !== i && (Number(watch(`cutoffs.${idx}.salary`)) || 0) > 0)

          return (
            <CutoffSection
              key={field.id}
              cutoffIndex={i}
              control={control}
              register={register}
              errors={errors}
              watch={watch}
              setValue={setValue}
              totalCutoffs={cutoffFields.length}
              onDivideItem={openDivide}
              month={currentMonth}
              year={currentYear}
              otherSalaries={otherSalaries}
            />
          )
        })}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          {mode === 'new' && (
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              ← Back
            </Button>
          )}
          <div className="ml-auto">
            <Button type="submit">
              Review →
            </Button>
          </div>
        </div>

        {/* Divide modal */}
        {divideTarget && (
          <DivideModal
            totalCutoffs={cutoffFields.length}
            sourceCutoffIndex={divideTarget.cutoffIndex}
            itemName={watch(`cutoffs.${divideTarget.cutoffIndex}.items.${divideTarget.itemIndex}.name`) || 'Unnamed'}
            itemAmount={Number(watch(`cutoffs.${divideTarget.cutoffIndex}.items.${divideTarget.itemIndex}.amount`)) || 0}
            onConfirm={confirmDivide}
            onClose={() => setDivideTarget(null)}
          />
        )}

        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </form>
      </div>
    )
  }

  // ─── Render: Step 3 (Review) ─────────────────────────────────────────────

  const formValues = getValues()
  const totalSalary = formValues.cutoffs.reduce((sum, c) => sum + Number(c.salary), 0)
  const totalExpenses = formValues.cutoffs.reduce(
    (sum, c) => sum + c.items.reduce((s, i) => s + Number(i.amount), 0), 0
  )
  const totalSavings = totalSalary - totalExpenses

  return (
    <div className="max-w-4xl mx-auto">
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="bg-card rounded-lg shadow-card p-5 mb-5">
        <h2 className="text-xl font-semibold text-header mb-1">Review Budget</h2>
        <p className="text-sm text-muted">
          {MONTHS[formValues.month - 1]} {formValues.year}
        </p>
      </div>

      {formValues.cutoffs.map((cutoff, i) => {
        const cutoffExpenses = cutoff.items.reduce((sum, item) => sum + Number(item.amount), 0)
        const remaining = Number(cutoff.salary) - cutoffExpenses
        return (
          <div key={i} className="bg-card rounded-lg shadow-card p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-header">{ordinalLabel(i + 1)}</h3>
              <div className="text-sm text-muted">
                Salary: <span className="font-medium text-body">{formatCurrency(Number(cutoff.salary))}</span>
                {cutoff.date && <span className="ml-2">· {formatDate(cutoff.date)}</span>}
              </div>
            </div>
            <table className="w-full text-sm mb-3">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left py-1.5 text-xs font-medium text-muted">Name</th>
                  <th className="text-left py-1.5 text-xs font-medium text-muted">Amount</th>
                  <th className="text-left py-1.5 text-xs font-medium text-muted">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {cutoff.items.map((item, j) => (
                  <tr key={j} className="border-b border-line-light last:border-0">
                    <td className="py-1.5 pr-4 text-body">{item.name}</td>
                    <td className="py-1.5 pr-4 text-body">{formatCurrency(Number(item.amount))}</td>
                    <td className="py-1.5 text-muted">{item.due_date ? formatDate(item.due_date) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between text-sm pt-2 border-t border-line-light">
              <span className="text-muted">Total Expenses</span>
              <span className="font-medium text-body">{formatCurrency(cutoffExpenses)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted">Remaining</span>
              <span className={['font-medium', remaining < 0 ? 'text-due-danger' : 'text-due-safe'].join(' ')}>
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>
        )
      })}

      {/* Monthly summary */}
      <div className="bg-card rounded-lg shadow-card p-5 mb-6">
        <h3 className="text-base font-semibold text-header mb-3">Monthly Summary</h3>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Total Salary</span>
            <span className="font-medium text-body">{formatCurrency(totalSalary)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Total Expenses</span>
            <span className="font-medium text-body">{formatCurrency(totalExpenses)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-line-light">
            <span className="text-muted font-medium">Total Savings</span>
            <span className={['font-semibold', totalSavings < 0 ? 'text-due-danger' : 'text-due-safe'].join(' ')}>
              {formatCurrency(totalSavings)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button type="button" variant="secondary" onClick={() => setStep(2)}>
          ← Edit
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {mode === 'edit' ? 'Save Changes' : 'Save Budget'}
        </Button>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </form>
    </div>
  )
}
