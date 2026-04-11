'use client'

import React from 'react'
import Link from 'next/link'
import type { BudgetItem } from '@/types'
import { formatCurrency, formatDate, getDueStatus, dueStatusClasses } from '@/utils/budget'
import { Button } from '@/components/ui/Button'
import { HiOutlinePencilSquare } from 'react-icons/hi2'

interface Props {
  items: BudgetItem[]
  updatingIds: Set<string>
  onChangeStatus: (item: BudgetItem) => void
  budgetMonthId: string
}

export function ExpensesTableWidget({ items, updatingIds, onChangeStatus, budgetMonthId }: Props) {
  return (
    <div className="bg-card rounded-lg shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Expenses</h3>
        <Link
          href={`/budget/${budgetMonthId}/edit`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-accent bg-accent-light hover:bg-accent hover:text-white transition-colors no-underline"
        >
          <HiOutlinePencilSquare size={13} />
          Edit Budget
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">No expenses added yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {['Name', 'Amount (PHP)', 'Due Date', 'Status', 'Action'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2.5 text-xs font-semibold text-muted border-b border-line whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const status = getDueStatus(item.due_date)
                const cls = dueStatusClasses[status]
                const isPaid = item.status === 'paid'
                return (
                  <tr key={item.id} className={isPaid ? '' : cls.row}>
                    <td className={`px-3 py-3 border-b border-line-light font-medium ${isPaid ? 'text-muted' : cls.text}`}>
                      {item.name}
                    </td>
                    <td className={`px-3 py-3 border-b border-line-light ${isPaid ? 'text-muted' : cls.text}`}>
                      {formatCurrency(item.amount)}
                    </td>
                    <td className={`px-3 py-3 border-b border-line-light ${isPaid ? 'text-muted' : cls.text}`}>
                      {formatDate(item.due_date)}
                    </td>
                    <td className="px-3 py-3 border-b border-line-light">
                      <span
                        className={[
                          'inline-flex px-2.5 py-0.5 rounded-sm text-xs font-medium',
                          item.status === 'paid' ? 'bg-paid-bg text-paid' : 'bg-surface text-muted',
                        ].join(' ')}
                      >
                        {item.status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-b border-line-light whitespace-nowrap">
                      <Button
                        variant="secondary"
                        loading={updatingIds.has(item.id)}
                        onClick={() => onChangeStatus(item)}
                        className="px-3 py-1.5 text-xs"
                      >
                        Change Status
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

