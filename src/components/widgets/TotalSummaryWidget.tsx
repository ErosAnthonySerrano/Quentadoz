'use client'

import React from 'react'
import type { Cutoff, BudgetItem } from '@/types'
import { formatCurrency } from '@/utils/budget'

interface Props {
  cutoffs: Cutoff[]
  items: BudgetItem[]
}

export function TotalSummaryWidget({ cutoffs, items }: Props) {
  const totalSalary = cutoffs.reduce((sum, c) => sum + c.salary, 0)
  const totalExpenses = items.reduce((sum, i) => sum + i.amount, 0)
  const totalSavings = totalSalary - totalExpenses

  return (
    <div className="bg-card rounded-lg shadow-card p-6">
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
        Total Summary
      </h3>
      <div className="flex items-center gap-6">
        <div className="flex flex-col gap-1.5 flex-1">
          <span className="text-xs text-muted font-medium">Total Salary</span>
          <span className="text-2xl font-semibold text-header">{formatCurrency(totalSalary)}</span>
        </div>
        <div className="w-px h-12 bg-line" />
        <div className="flex flex-col gap-1.5 flex-1">
          <span className="text-xs text-muted font-medium">Total Savings</span>
          <span
            className={[
              'text-2xl font-semibold',
              totalSavings >= 0 ? 'text-due-safe' : 'text-due-danger',
            ].join(' ')}
          >
            {formatCurrency(totalSavings)}
          </span>
        </div>
      </div>
    </div>
  )
}

