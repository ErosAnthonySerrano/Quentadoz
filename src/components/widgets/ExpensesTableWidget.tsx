'use client'

import React from 'react'
import Link from 'next/link'
import type { BudgetItem, Cutoff } from '@/types'
import { formatCurrency, formatDate, getDueStatus, dueStatusClasses, ordinalLabel } from '@/utils/budget'
import { Button } from '@/components/ui/Button'
import { HiOutlinePencilSquare } from 'react-icons/hi2'
import { ExpenseIdentityBadge } from '@/components/widgets/ExpenseIdentityBadge'

interface Props {
  cutoffs: Cutoff[]
  items: BudgetItem[]
  updatingIds: Set<string>
  onChangeStatus: (item: BudgetItem) => void
  budgetMonthId: string
}

export function ExpensesTableWidget({ cutoffs, items, updatingIds, onChangeStatus, budgetMonthId }: Props) {
  return (
    <div className="dashboard-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Expenses</h3>
        <Link
          href={`/budget/${budgetMonthId}/edit`}
          className="dashboard-chip flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-accent hover:bg-accent-light transition-all active:scale-95 no-underline shrink-0"
        >
          <HiOutlinePencilSquare size={13} />
          Edit Budget
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">No expenses added yet.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {cutoffs.map((cutoff) => {
            const cutoffItems = items.filter((i) => i.cutoff_id === cutoff.id)
            return (
              <div key={cutoff.id}>
                <div className="flex flex-wrap items-baseline gap-2 mb-3 pb-2 border-b border-line min-w-0">
                  <span className="text-sm font-semibold text-title min-w-0">
                    {ordinalLabel(cutoff.cutoff_number)}
                  </span>
                  <span className="text-xs text-muted min-w-0 break-words">
                    {formatDate(cutoff.date)} - {formatCurrency(cutoff.salary)}
                  </span>
                </div>

                {cutoffItems.length === 0 ? (
                  <p className="text-sm text-muted py-3 text-center">No expenses for this cutoff.</p>
                ) : (
                  <>
                    <div className="hidden md:block">
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
                          {cutoffItems.map((item) => {
                            const status = getDueStatus(item.due_date)
                            const cls = dueStatusClasses[status]
                            const isPaid = item.status === 'paid'
                            return (
                              <tr key={item.id} className={isPaid ? '' : cls.row}>
                                <td className="px-3 py-3 border-b border-line-light font-medium text-muted min-w-0">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <ExpenseIdentityBadge name={item.name} />
                                    <span className="min-w-0 break-words">{item.name}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-3 border-b border-line-light text-muted">
                                  {formatCurrency(item.amount)}
                                </td>
                                <td className={`px-3 py-3 border-b border-line-light ${isPaid ? 'text-muted' : cls.text}`}>
                                  {formatDate(item.due_date)}
                                </td>
                                <td className="px-3 py-3 border-b border-line-light">
                                  <span
                                    className={[
                                      'inline-flex px-2.5 py-0.5 rounded-sm text-xs font-medium shadow-sm',
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

                    <div className="md:hidden flex flex-col gap-2">
                      {cutoffItems.map((item) => {
                        const status = getDueStatus(item.due_date)
                        const cls = dueStatusClasses[status]
                        const isPaid = item.status === 'paid'
                        return (
                          <div
                            key={item.id}
                            className="dashboard-chip rounded-md p-3"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5 min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <ExpenseIdentityBadge name={item.name} />
                                <span className="text-sm font-medium leading-snug text-muted min-w-0 break-words">{item.name}</span>
                              </div>
                              <span
                                className={[
                                  'inline-flex shrink-0 px-2 py-0.5 rounded-sm text-xs font-medium',
                                  item.status === 'paid' ? 'bg-paid-bg text-paid' : 'bg-card text-muted',
                                ].join(' ')}
                              >
                                {item.status === 'paid' ? 'Paid' : 'Unpaid'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-2.5 min-w-0">
                              <span className="text-sm font-semibold text-muted shrink-0">
                                {formatCurrency(item.amount)}
                              </span>
                              {item.due_date && (
                                <>
                                  <span className="text-xs text-muted">-</span>
                                  <span className={`text-xs ${isPaid ? 'text-muted' : cls.text}`}>
                                    Due {formatDate(item.due_date)}
                                  </span>
                                </>
                              )}
                            </div>
                            <Button
                              variant="secondary"
                              loading={updatingIds.has(item.id)}
                              onClick={() => onChangeStatus(item)}
                              className="w-full py-1.5 text-xs"
                            >
                              Change Status
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
