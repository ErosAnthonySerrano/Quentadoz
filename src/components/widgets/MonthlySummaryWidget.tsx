'use client'

import React, { useState } from 'react'
import type { Cutoff, BudgetItem } from '@/types'
import { formatCurrency, ordinalLabel } from '@/utils/budget'
import { HiXMark } from 'react-icons/hi2'

interface Props {
  cutoffs: Cutoff[]
  items: BudgetItem[]
}

export function MonthlySummaryWidget({ cutoffs, items }: Props) {
  const [showFullBreakdown, setShowFullBreakdown] = useState(false)
  const MAX_CUTOFFS = 6

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
  const visibleCutoffSummaries = sortedCutoffSummaries.slice(0, MAX_CUTOFFS)
  const hasSalary = totalSalary > 0
  const totalSpentPct = hasSalary ? Math.min(100, Math.max(0, (totalExpenses / totalSalary) * 100)) : 0

  // Calculate circle progress properties
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (totalSpentPct / 100) * circumference

  if (showFullBreakdown) {
    return (
      <div className="dashboard-card p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
            Cutoff Breakdown Details
          </h3>
          <button
            type="button"
            onClick={() => setShowFullBreakdown(false)}
            className="text-muted hover:text-header transition-colors"
            aria-label="Close breakdown"
          >
            <HiXMark size={20} />
          </button>
        </div>

        {/* Breakdown table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-semibold text-muted uppercase tracking-wide">
                  Cutoff
                </th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-muted uppercase tracking-wide">
                  Spent
                </th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-muted uppercase tracking-wide">
                  Remaining
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCutoffSummaries.map(({ cutoff, cutoffExpenses, remaining }) => (
                <tr key={cutoff.id} className="border-b border-line-light hover:bg-surface/30 transition-colors">
                  <td className="px-3 py-3 text-body font-medium">
                    {ordinalLabel(cutoff.cutoff_number)}
                  </td>
                  <td className="px-3 py-3 text-body text-right">
                    {formatCurrency(cutoffExpenses)}
                  </td>
                  <td className={`px-3 py-3 text-right font-medium ${remaining >= 0 ? 'text-due-safe' : 'text-due-danger'}`}>
                    {formatCurrency(remaining)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-surface/50 border-t-2 border-line">
                <td className="px-3 py-3 font-semibold text-header">
                  Total
                </td>
                <td className="px-3 py-3 font-semibold text-header text-right">
                  {formatCurrency(totalExpenses)}
                </td>
                <td className={`px-3 py-3 font-semibold text-right ${totalSavings >= 0 ? 'text-due-safe' : 'text-due-danger'}`}>
                  {formatCurrency(totalSavings)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={() => setShowFullBreakdown(false)}
          className="mt-4 w-full px-4 py-2 rounded-md bg-surface text-accent font-semibold text-xs uppercase tracking-wide hover:bg-surface/80 transition-colors"
        >
          Back
        </button>
      </div>
    )
  }

  return (
    <div className="dashboard-card p-6 h-full flex flex-col">
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-6">
        Monthly Summary
      </h3>

      {/* Circular progress */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--color-line)"
              strokeWidth="2"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-header">{totalSpentPct.toFixed(1)}%</div>
            <div className="text-xs text-muted">of salary spent</div>
          </div>
        </div>
      </div>

      {/* Expenses and Remaining row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="dashboard-chip rounded-md p-3">
          <div className="text-[11px] text-muted mb-1">Expenses</div>
          <div className="text-sm font-semibold text-body">{formatCurrency(totalExpenses)}</div>
        </div>
        <div className="dashboard-chip rounded-md p-3">
          <div className="text-[11px] text-muted mb-1">Remaining</div>
          <div className={`text-sm font-semibold ${totalSavings >= 0 ? 'text-due-safe' : 'text-due-danger'}`}>
            {formatCurrency(totalSavings)}
          </div>
        </div>
      </div>

      {/* Cutoff breakdown */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wide">
            Cutoff Breakdown
          </h4>
          <span className="text-xs font-semibold text-accent">{visibleCutoffSummaries.length} cutoffs</span>
        </div>

        <div className="space-y-2">
          {visibleCutoffSummaries.map(({ cutoff, cutoffExpenses, remaining, spentPct: cutoffSpentPct }) => (
            <div key={cutoff.id} className="dashboard-chip rounded-md p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-muted uppercase">
                  {ordinalLabel(cutoff.cutoff_number)}
                </span>
                <span className="text-[11px] text-due-danger">{cutoffSpentPct.toFixed(0)}% • {formatCurrency(cutoffExpenses)}</span>
                <span className={`text-[11px] font-medium ${remaining >= 0 ? 'text-due-safe' : 'text-due-danger'}`}>
                  {formatCurrency(remaining)} left
                </span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-line-light mt-2">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${cutoffSpentPct}%`, backgroundColor: 'var(--color-accent)' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* View full breakdown link */}
        <button 
          type="button"
          onClick={() => setShowFullBreakdown(true)}
          className="w-full mt-4 text-xs font-semibold text-accent hover:text-accent-hover transition-colors flex items-center justify-center gap-1.5 py-2"
        >
          View full breakdown
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M11 6H1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

