'use client'

import React from 'react'
import type { Cutoff, BudgetItem } from '@/types'
import { formatCurrency } from '@/utils/budget'
import { HiWallet, HiShoppingCart, HiCurrencyDollar } from 'react-icons/hi2'

interface Props {
  cutoffs: Cutoff[]
  items: BudgetItem[]
}

export function SummaryCardsWidget({ cutoffs, items }: Props) {
  const totalSalary = cutoffs.reduce((sum, c) => sum + c.salary, 0)
  const totalExpenses = items.reduce((sum, i) => sum + i.amount, 0)
  const totalSavings = totalSalary - totalExpenses

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Total Salary Card */}
      <div className="dashboard-card p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
            Total Salary
          </h3>
          <div className="dashboard-chip w-8 h-8 rounded-lg text-accent flex items-center justify-center">
            <HiWallet size={16} />
          </div>
        </div>
        <div className="text-2xl font-semibold text-accent">
          {formatCurrency(totalSalary)}
        </div>
        <p className="text-xs text-muted mt-2">Monthly salary</p>
      </div>

      {/* Total Expenses Card */}
      <div className="dashboard-card p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
            Total Expenses
          </h3>
          <div className="dashboard-chip w-8 h-8 rounded-lg text-accent flex items-center justify-center">
            <HiShoppingCart size={16} />
          </div>
        </div>
        <div className="text-2xl font-semibold text-accent">
          {formatCurrency(totalExpenses)}
        </div>
        <p className="text-xs text-muted mt-2">Spent this month</p>
      </div>

      {/* Total Savings Card */}
      <div className="dashboard-card p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
            Total Savings
          </h3>
          <div className={`dashboard-chip w-8 h-8 rounded-lg ${totalSavings >= 0 ? 'text-due-safe' : 'text-due-danger'} flex items-center justify-center`}>
            <HiCurrencyDollar size={16} />
          </div>
        </div>
        <div className={`text-2xl font-semibold ${totalSavings >= 0 ? 'text-due-safe' : 'text-due-danger'}`}>
          {formatCurrency(totalSavings)}
        </div>
        <p className="text-xs text-muted mt-2">Remaining balance</p>
      </div>
    </div>
  )
}
