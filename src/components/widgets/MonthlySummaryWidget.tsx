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
    <div className="bg-card rounded-lg shadow-card p-6">
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
        Monthly Summary
      </h3>
      <div className="overflow-x-auto">
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
            <tr className="bg-surface">
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
    </div>
  )
}

