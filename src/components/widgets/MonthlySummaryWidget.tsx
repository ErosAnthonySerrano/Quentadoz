'use client'

import React from 'react'
import type { Cutoff, BudgetItem } from '@/types'
import { formatCurrency, ordinalLabel } from '@/utils/budget'

interface Props {
  cutoffs: Cutoff[]
  items: BudgetItem[]
}

export function MonthlySummaryWidget({ cutoffs, items }: Props) {
  const CUTOFFS_PER_PAGE = 4
  const [cutoffPage, setCutoffPage] = React.useState(0)

  const totalSalary = cutoffs.reduce((sum, c) => sum + c.salary, 0)
  const totalExpenses = items.reduce((sum, i) => sum + i.amount, 0)
  const totalSavings = totalSalary - totalExpenses
  const cutoffSummaries = cutoffs.map((c) => {
    const cutoffExpenses = items
      .filter((i) => i.cutoff_id === c.id)
      .reduce((sum, i) => sum + i.amount, 0)
    const remaining = c.salary - cutoffExpenses
    const spentPct = c.salary > 0 ? Math.min(100, Math.max(0, (cutoffExpenses / c.salary) * 100)) : 0
    return { cutoff: c, cutoffExpenses, remaining, spentPct }
  })
  const sortedCutoffSummaries = [...cutoffSummaries].sort((a, b) => a.cutoff.cutoff_number - b.cutoff.cutoff_number)
  const cutoffPageCount = Math.max(1, Math.ceil(sortedCutoffSummaries.length / CUTOFFS_PER_PAGE))
  const safeCutoffPage = Math.min(cutoffPage, cutoffPageCount - 1)
  const pageStart = safeCutoffPage * CUTOFFS_PER_PAGE
  const pageEnd = Math.min(sortedCutoffSummaries.length, pageStart + CUTOFFS_PER_PAGE)
  const pagedCutoffSummaries = sortedCutoffSummaries.slice(pageStart, pageEnd)
  const hasSalary = totalSalary > 0
  const spentPct = hasSalary ? Math.min(100, Math.max(0, (totalExpenses / totalSalary) * 100)) : 0
  const remainingPct = hasSalary ? Math.max(0, 100 - spentPct) : 0
  const isOverspent = totalExpenses > totalSalary

  React.useEffect(() => {
    setCutoffPage((prev) => Math.min(prev, cutoffPageCount - 1))
  }, [cutoffPageCount])

  return (
    <div className="dashboard-card p-6 h-full">
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
        Monthly Summary
      </h3>

      <div className="dashboard-chip rounded-md p-4 mb-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">Salary Allocation</span>
          <span className={`text-xs font-semibold ${totalSavings >= 0 ? 'text-due-safe' : 'text-due-danger'}`}>
            {hasSalary ? `${spentPct.toFixed(1)}% spent` : 'No salary set'}
          </span>
        </div>

        <div className="mt-2">
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-line-light">
            {hasSalary && (
              <>
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${spentPct}%`, backgroundColor: 'var(--color-accent)' }}
                />
                {!isOverspent && remainingPct > 0 && (
                  <div
                    className="absolute inset-y-0 rounded-full"
                    style={{
                      left: `${spentPct}%`,
                      width: `${remainingPct}%`,
                      backgroundColor: 'var(--color-due-safe)',
                    }}
                  />
                )}
              </>
            )}
            {isOverspent && (
              <div
                className="absolute inset-y-0 right-0 w-1.5"
                style={{ backgroundColor: 'var(--color-due-danger)' }}
                aria-hidden="true"
              />
            )}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="rounded-sm bg-surface/60 px-2.5 py-1.5 flex items-center justify-between gap-3 md:block">
            <span className="text-[11px] text-muted">Salary</span>
            <span className="text-xs font-semibold text-header md:mt-0.5 md:block">{formatCurrency(totalSalary)}</span>
          </div>
          <div className="rounded-sm bg-surface/60 px-2.5 py-1.5 flex items-center justify-between gap-3 md:block">
            <span className="text-[11px] text-muted">Expenses</span>
            <span className="text-xs font-semibold text-body md:mt-0.5 md:block">{formatCurrency(totalExpenses)}</span>
          </div>
          <div className="rounded-sm bg-surface/60 px-2.5 py-1.5 flex items-center justify-between gap-3 md:block">
            <span className="text-[11px] text-muted">{isOverspent ? 'Overspent' : 'Remaining'}</span>
            <span className={`text-xs font-semibold md:mt-0.5 md:block ${totalSavings >= 0 ? 'text-due-safe' : 'text-due-danger'}`}>
              {formatCurrency(Math.abs(totalSavings))}
            </span>
          </div>
        </div>

        {sortedCutoffSummaries.length > CUTOFFS_PER_PAGE && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted">
              Showing {pageStart + 1}-{pageEnd} of {sortedCutoffSummaries.length} cutoffs
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="dashboard-chip h-6 px-2 rounded-sm text-[11px] text-muted disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setCutoffPage((p) => Math.max(0, p - 1))}
                disabled={safeCutoffPage === 0}
              >
                Prev
              </button>
              <button
                type="button"
                className="dashboard-chip h-6 px-2 rounded-sm text-[11px] text-muted disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setCutoffPage((p) => Math.min(cutoffPageCount - 1, p + 1))}
                disabled={safeCutoffPage >= cutoffPageCount - 1}
              >
                Next
              </button>
            </div>
          </div>
        )}

        <div className="mt-3 space-y-2">
          {pagedCutoffSummaries.map(({ cutoff, remaining, spentPct: cutoffSpentPct }) => (
            <div key={cutoff.id}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  {ordinalLabel(cutoff.cutoff_number)}
                </span>
                <span className="text-[11px] text-muted">{cutoffSpentPct.toFixed(0)}% spent</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-line-light">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${cutoffSpentPct}%`, backgroundColor: 'var(--color-accent)' }}
                />
                {remaining >= 0 && cutoffSpentPct < 100 && (
                  <div
                    className="absolute inset-y-0 rounded-full"
                    style={{
                      left: `${cutoffSpentPct}%`,
                      width: `${100 - cutoffSpentPct}%`,
                      backgroundColor: 'var(--color-due-safe)',
                    }}
                  />
                )}
                {remaining < 0 && (
                  <div
                    className="absolute inset-y-0 right-0 w-1.5"
                    style={{ backgroundColor: 'var(--color-due-danger)' }}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted">{formatCurrency(cutoff.salary)} salary</span>
                <span className={`text-[11px] font-medium ${remaining >= 0 ? 'text-due-safe' : 'text-due-danger'}`}>
                  {remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto max-w-full">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted border-b border-line whitespace-nowrap">
                Cutoff
              </th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted border-b border-line whitespace-nowrap">
                Total Expenses
              </th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted border-b border-line whitespace-nowrap">
                Remaining Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedCutoffSummaries.map(({ cutoff: c, cutoffExpenses, remaining }) => {
              return (
                <tr key={c.id}>
                  <td className="px-3 py-3 border-b border-line-light text-body">
                    {ordinalLabel(c.cutoff_number)}
                  </td>
                  <td className="px-3 py-3 border-b border-line-light text-body text-right">
                    {formatCurrency(cutoffExpenses)}
                  </td>
                  <td
                    className={[
                      'px-3 py-3 border-b border-line-light text-right font-medium',
                      remaining >= 0 ? 'text-due-safe' : 'text-due-danger',
                    ].join(' ')}
                  >
                    {formatCurrency(remaining)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-surface/70">
              <td className="px-3 py-3 font-semibold text-header">
                Total ({formatCurrency(totalSalary)} salary)
              </td>
              <td className="px-3 py-3 font-semibold text-header text-right">
                {formatCurrency(totalExpenses)}
              </td>
              <td
                className={[
                  'px-3 py-3 font-semibold text-right',
                  totalSavings >= 0 ? 'text-due-safe' : 'text-due-danger',
                ].join(' ')}
              >
                {formatCurrency(totalSavings)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {pagedCutoffSummaries.map(({ cutoff: c, cutoffExpenses, remaining }) => {
          return (
            <div key={c.id} className="dashboard-chip rounded-md p-4 min-w-0">
              <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                {ordinalLabel(c.cutoff_number)}
              </span>
              <div className="mt-2 flex flex-col gap-1.5">
                <div className="flex justify-between items-center gap-3 min-w-0">
                  <span className="text-xs text-muted min-w-0">Total Expenses</span>
                  <span className="text-sm font-medium text-body shrink-0">{formatCurrency(cutoffExpenses)}</span>
                </div>
                <div className="flex justify-between items-center gap-3 min-w-0">
                  <span className="text-xs text-muted min-w-0">Remaining Balance</span>
                  <span className={`text-sm font-semibold shrink-0 ${remaining >= 0 ? 'text-due-safe' : 'text-due-danger'}`}>
                    {formatCurrency(remaining)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        <div className="dashboard-chip rounded-md p-4 min-w-0">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">Monthly Total</span>
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="flex justify-between items-center gap-3 min-w-0">
              <span className="text-xs text-muted min-w-0">Total Salary</span>
              <span className="text-sm font-medium text-body shrink-0">{formatCurrency(totalSalary)}</span>
            </div>
            <div className="flex justify-between items-center gap-3 min-w-0">
              <span className="text-xs text-muted min-w-0">Total Expenses</span>
              <span className="text-sm font-medium text-body shrink-0">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center gap-3 pt-1.5 border-t border-line-light min-w-0">
              <span className="text-xs font-semibold text-muted min-w-0">Total Savings</span>
              <span className={`text-sm font-semibold shrink-0 ${totalSavings >= 0 ? 'text-due-safe' : 'text-due-danger'}`}>
                {formatCurrency(totalSavings)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
