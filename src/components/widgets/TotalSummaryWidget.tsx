'use client'

import React from 'react'
import type { Cutoff, BudgetItem } from '@/types'
import { formatCurrency } from '@/utils/budget'
import { RiPieChart2Line } from 'react-icons/ri'

interface Props {
  cutoffs: Cutoff[]
  items: BudgetItem[]
}

export function TotalSummaryWidget({ cutoffs, items }: Props) {
  const totalSalary = cutoffs.reduce((sum, c) => sum + c.salary, 0)
  const totalExpenses = items.reduce((sum, i) => sum + i.amount, 0)
  const totalSavings = totalSalary - totalExpenses
  const savingsRate = totalSalary > 0
    ? Math.min(100, Math.max(0, (totalSavings / totalSalary) * 100))
    : 0

  return (
    <div className="dashboard-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
          Total Summary
        </h3>
        <div className="dashboard-chip w-8 h-8 rounded-lg text-accent flex items-center justify-center">
          <RiPieChart2Line size={14} />
        </div>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="min-w-0 flex-1 space-y-5 md:max-w-[28rem]">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs text-muted font-medium">Total Salary</span>
            <span className="block max-w-full text-[clamp(1.25rem,2.4vw,2.5rem)] font-semibold text-header leading-[1.05] whitespace-nowrap overflow-hidden text-ellipsis">
              {formatCurrency(totalSalary)}
            </span>
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs text-muted font-medium">Total Savings</span>
            <span
              className={[
                'block max-w-full text-[clamp(1.25rem,2.4vw,2.5rem)] font-semibold leading-[1.05] whitespace-nowrap overflow-hidden text-ellipsis',
                totalSavings >= 0 ? 'text-due-safe' : 'text-due-danger',
              ].join(' ')}
            >
              {formatCurrency(totalSavings)}
            </span>
          </div>
        </div>

        <div className="shrink-0 self-start md:self-center md:ml-2">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full p-1"
            style={{
              background: `conic-gradient(
                var(--color-ring-progress-a) 0%,
                var(--color-ring-progress-b) ${savingsRate}%,
                var(--color-ring-track) ${savingsRate}%,
                var(--color-ring-track) 100%
              )`,
            }}
          >
            <div className="w-full h-full rounded-full bg-card border border-line flex flex-col items-center justify-center">
              <span className="text-xl sm:text-2xl lg:text-3xl leading-none font-semibold text-header">{savingsRate.toFixed(1)}%</span>
              <span className="text-[10px] sm:text-xs text-muted mt-1">Saved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

