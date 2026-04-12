'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { createClient } from '@/lib/supabase/client'
import type { BudgetMonth, Cutoff, BudgetItem } from '@/types'
import { formatCurrency, formatDate, ordinalLabel } from '@/utils/budget'
import { ToastContainer, useToast } from '@/components/ui/Toast'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface MonthRecord {
  budgetMonth: BudgetMonth
  cutoffs: Cutoff[]
  items: BudgetItem[]
}

type LoadState = 'loading' | 'loaded' | 'error'

export default function HistoryPage() {
  const supabase = createClient()
  const router = useRouter()
  const { toasts, show: showToast, dismiss } = useToast()

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [records, setRecords] = useState<MonthRecord[]>([])
  const [exportingIds, setExportingIds] = useState<Set<string>>(new Set())

  // Filters
  const [filterYear, setFilterYear] = useState<number | 'all'>('all')
  const [filterFromMonth, setFilterFromMonth] = useState<number | 'all'>('all')
  const [filterToMonth, setFilterToMonth] = useState<number | 'all'>('all')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: bms, error: bmsError } = await supabase
        .from('budget_months')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      if (bmsError) {
        setLoadState('error')
        return
      }

      if (!bms || bms.length === 0) {
        setRecords([])
        setLoadState('loaded')
        return
      }

      const ids = bms.map((b) => b.id)

      const [{ data: cutoffs }, { data: items }] = await Promise.all([
        supabase.from('cutoffs').select('*').in('budget_month_id', ids).order('cutoff_number'),
        supabase.from('budget_items').select('*').in('budget_month_id', ids).order('created_at'),
      ])

      const monthRecords: MonthRecord[] = bms.map((bm) => ({
        budgetMonth: bm,
        cutoffs: (cutoffs ?? []).filter((c) => c.budget_month_id === bm.id),
        items: (items ?? []).filter((i) => i.budget_month_id === bm.id),
      }))

      setRecords(monthRecords)
      setLoadState('loaded')
    }

    load().catch(() => setLoadState('error'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const allYears = useMemo(() => {
    return [...new Set(records.map((r) => r.budgetMonth.year))].sort((a, b) => b - a)
  }, [records])

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterYear !== 'all' && r.budgetMonth.year !== filterYear) return false
      if (filterFromMonth !== 'all' && r.budgetMonth.month < filterFromMonth) return false
      if (filterToMonth !== 'all' && r.budgetMonth.month > filterToMonth) return false
      return true
    })
  }, [records, filterYear, filterFromMonth, filterToMonth])

  const groupedByYear = useMemo(() => {
    const map = new Map<number, MonthRecord[]>()
    filtered.forEach((r) => {
      const yr = r.budgetMonth.year
      if (!map.has(yr)) map.set(yr, [])
      map.get(yr)!.push(r)
    })
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0])
  }, [filtered])

  const hasFilters = filterYear !== 'all' || filterFromMonth !== 'all' || filterToMonth !== 'all'

  function clearFilters() {
    setFilterYear('all')
    setFilterFromMonth('all')
    setFilterToMonth('all')
  }

  function handleReuse(budgetMonthId: string) {
    router.push(`/budget/new?reuse=${budgetMonthId}`)
  }

  async function handleExportPDF(record: MonthRecord) {
    const id = record.budgetMonth.id
    setExportingIds((prev) => new Set([...prev, id]))
    try {
      const { exportMonthPDF } = await import('@/lib/pdf')
      await exportMonthPDF(record)
    } catch {
      showToast('Failed to generate PDF. Please try again.', 'error')
    } finally {
      setExportingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  // ─── Loading skeleton ─────────────────────────────────────────────────────

  if (loadState === 'loading') {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <div className="h-9 w-48 bg-surface rounded-md animate-pulse" />
        <div className="bg-card rounded-lg shadow-card p-4 h-16 animate-pulse" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg shadow-card p-5 h-64 animate-pulse" />
        ))}
      </div>
    )
  }

  // ─── Error ────────────────────────────────────────────────────────────────

  if (loadState === 'error') {
    return (
      <p className="text-sm text-due-danger text-center py-12">
        Something went wrong loading your history. Please refresh the page.
      </p>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 pb-8">
      <h1 className="text-3xl font-semibold text-header">Budget History</h1>

      {/* Filters — only show when there's data */}
      {records.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 bg-card rounded-lg shadow-card p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">Year</label>
            <select
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
                setFilterFromMonth('all')
                setFilterToMonth('all')
              }}
              className="px-3 py-2 rounded-md text-sm text-header bg-surface border border-line outline-none"
            >
              <option value="all">All years</option>
              {allYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">From month</label>
            <select
              value={filterFromMonth}
              onChange={(e) => setFilterFromMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              className="px-3 py-2 rounded-md text-sm text-header bg-surface border border-line outline-none"
            >
              <option value="all">Any</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">To month</label>
            <select
              value={filterToMonth}
              onChange={(e) => setFilterToMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              className="px-3 py-2 rounded-md text-sm text-header bg-surface border border-line outline-none"
            >
              <option value="all">Any</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2 rounded-md text-sm text-muted hover:text-body border border-line bg-surface transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Empty state — no data at all */}
      {records.length === 0 && (
        <div className="bg-card rounded-lg shadow-card px-5 py-16 text-center">
          <p className="text-base font-medium text-body mb-1">No budget history yet.</p>
          <p className="text-sm text-muted mb-5">Create your first budget to get started.</p>
          <Link
            href="/budget/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover transition-colors"
          >
            Create Budget
          </Link>
        </div>
      )}

      {/* Filters active but no results */}
      {records.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-muted text-center py-8">No records match your filters.</p>
      )}

      {/* Year groups */}
      {groupedByYear.map(([year, monthRecords], groupIdx) => (
        <div key={year}>
          {/* Year divider (skip top spacing for first group) */}
          {groupIdx > 0 && <div className="border-t border-line mb-6" />}

          <h2 className="text-5xl font-bold text-header mb-5">{year}</h2>

          <div className="flex flex-col gap-5">
            {monthRecords.map((record) => {
              const { budgetMonth, cutoffs, items } = record
              const monthLabel = MONTHS[budgetMonth.month - 1]
              const totalSalary = cutoffs.reduce((sum, c) => sum + Number(c.salary), 0)
              const totalExpenses = items.reduce((sum, i) => sum + Number(i.amount), 0)
              const totalSavings = totalSalary - totalExpenses
              const isCurrentMonth = budgetMonth.month === currentMonth && budgetMonth.year === currentYear

              return (
                <div key={budgetMonth.id} className={['bg-card rounded-lg shadow-card overflow-hidden', isCurrentMonth ? 'ring-2 ring-accent' : ''].join(' ')}>

                  {/* Month header */}
                  <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line">
                    <h3 className="text-base font-semibold text-header flex-1 min-w-0 flex items-center gap-2">
                      {monthLabel} {budgetMonth.year}
                      {isCurrentMonth && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-accent-light text-accent">
                          Current
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleReuse(budgetMonth.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-body border border-line rounded-md bg-surface hover:border-accent hover:text-accent transition-colors cursor-pointer"
                      >
                        Reuse
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportPDF(record)}
                        disabled={exportingIds.has(budgetMonth.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-body border border-line rounded-md bg-surface hover:border-accent hover:text-accent transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {exportingIds.has(budgetMonth.id) && (
                          <AiOutlineLoading3Quarters className="animate-spin" />
                        )}
                        {exportingIds.has(budgetMonth.id) ? 'Exporting...' : 'Export PDF'}
                      </button>
                      <Link
                        href={`/budget/${budgetMonth.id}/edit`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent border border-accent rounded-md hover:bg-accent-light transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>

                  {/* Scrollable table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-96">
                      <thead>
                        <tr className="border-b border-line text-left">
                          <th className="px-5 py-3 text-xs font-medium text-muted uppercase tracking-wide w-1/2">Item</th>
                          <th className="px-5 py-3 text-xs font-medium text-muted uppercase tracking-wide">Amount</th>
                          <th className="px-5 py-3 text-xs font-medium text-muted uppercase tracking-wide">Due Date</th>
                          <th className="px-5 py-3 text-xs font-medium text-muted uppercase tracking-wide">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cutoffs.map((cutoff) => {
                          const cutoffItems = items.filter((i) => i.cutoff_id === cutoff.id)
                          const cutoffExpenses = cutoffItems.reduce((sum, i) => sum + Number(i.amount), 0)
                          const remaining = Number(cutoff.salary) - cutoffExpenses

                          return (
                            <React.Fragment key={cutoff.id}>
                              {/* Cutoff label row */}
                              <tr className="bg-surface border-b border-line-light">
                                <td colSpan={4} className="px-5 py-2.5 text-xs font-semibold text-body">
                                  {ordinalLabel(cutoff.cutoff_number)}
                                  {cutoff.salary ? ` — ${formatCurrency(Number(cutoff.salary))}` : ''}
                                  {cutoff.date ? ` — ${formatDate(cutoff.date)}` : ''}
                                </td>
                              </tr>

                              {/* Item rows */}
                              {cutoffItems.length === 0 ? (
                                <tr className="border-b border-line-light">
                                  <td colSpan={4} className="px-5 py-3 text-xs text-muted italic">No items</td>
                                </tr>
                              ) : cutoffItems.map((item) => (
                                <tr key={item.id} className="border-b border-line-light">
                                  <td className="px-5 py-3 text-body">{item.name}</td>
                                  <td className="px-5 py-3 text-body font-medium tabular-nums">{formatCurrency(Number(item.amount))}</td>
                                  <td className="px-5 py-3 text-muted">{formatDate(item.due_date ?? null)}</td>
                                  <td className="px-5 py-3">
                                    <span className={[
                                      'inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium',
                                      item.status === 'paid'
                                        ? 'bg-paid-bg text-paid'
                                        : 'bg-surface text-muted border border-line',
                                    ].join(' ')}>
                                      {item.status === 'paid' ? 'Paid' : 'Unpaid'}
                                    </span>
                                  </td>
                                </tr>
                              ))}

                              {/* Cutoff summary row */}
                              <tr className="bg-surface border-b border-line">
                                <td className="px-5 py-2.5 text-xs text-muted">Total Expenses</td>
                                <td className="px-5 py-2.5 text-xs font-semibold text-body tabular-nums">
                                  {formatCurrency(cutoffExpenses)}
                                </td>
                                <td className="px-5 py-2.5 text-xs text-muted">Remaining</td>
                                <td className={[
                                  'px-5 py-2.5 text-xs font-semibold tabular-nums',
                                  remaining < 0 ? 'text-due-danger' : 'text-due-safe',
                                ].join(' ')}>
                                  {formatCurrency(remaining)}
                                </td>
                              </tr>
                            </React.Fragment>
                          )
                        })}

                        {/* Month summary row */}
                        <tr className="bg-surface border-t-2 border-line">
                          <td className="px-5 py-3 text-xs font-bold text-body">
                            Monthly Total — Salary: {formatCurrency(totalSalary)}
                          </td>
                          <td className="px-5 py-3 text-xs font-semibold text-body tabular-nums">
                            {formatCurrency(totalExpenses)}
                          </td>
                          <td className="px-5 py-3 text-xs text-muted">Savings</td>
                          <td className={[
                            'px-5 py-3 text-xs font-bold tabular-nums',
                            totalSavings < 0 ? 'text-due-danger' : 'text-due-safe',
                          ].join(' ')}>
                            {formatCurrency(totalSavings)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
