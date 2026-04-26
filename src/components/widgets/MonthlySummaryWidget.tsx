'use client'

import React from 'react'
import type { Cutoff, BudgetItem } from '@/types'
import { formatCurrency, ordinalLabel } from '@/utils/budget'

interface Props {
  cutoffs: Cutoff[]
  items: BudgetItem[]
}

export function MonthlySummaryWidget({ cutoffs, items }: Props) {
  const totalSalary = cutoffs.reduce((sum, c) => sum + c.salary, 0)
  const totalExpenses = items.reduce((sum, i) => sum + i.amount, 0)
  const totalSavings = totalSalary - totalExpenses

  return (
    <div className="dashboard-card p-6">
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
        Monthly Summary
      </h3>

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
            {cutoffs.map((c) => {
              const cutoffExpenses = items
                .filter((i) => i.cutoff_id === c.id)
                .reduce((sum, i) => sum + i.amount, 0)
              const remaining = c.salary - cutoffExpenses
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
        {cutoffs.map((c) => {
          const cutoffExpenses = items
            .filter((i) => i.cutoff_id === c.id)
            .reduce((sum, i) => sum + i.amount, 0)
          const remaining = c.salary - cutoffExpenses
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
        {/* Monthly total card */}
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
