'use client'

import React from 'react'
import Link from 'next/link'
import type { BudgetItem, Cutoff } from '@/types'
import { formatCurrency, formatDate, getDueStatus, dueStatusClasses, ordinalLabel } from '@/utils/budget'
import { Button } from '@/components/ui/Button'
import { HiOutlinePencilSquare } from 'react-icons/hi2'

interface Props {
  cutoffs: Cutoff[]
  items: BudgetItem[]
  updatingIds: Set<string>
  onChangeStatus: (item: BudgetItem) => void
  budgetMonthId: string
}

export function ExpensesTableWidget({ cutoffs, items, updatingIds, onChangeStatus, budgetMonthId }: Props) {
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
        <div className="flex flex-col gap-6">
          {cutoffs.map((cutoff) => {
            const cutoffItems = items.filter((i) => i.cutoff_id === cutoff.id)
            return (
              <div key={cutoff.id}>
                {/* Cutoff section header */}
                <div className="flex flex-wrap items-baseline gap-2 mb-3 pb-2 border-b border-line">
                  <span className="text-sm font-semibold text-title">
                    {ordinalLabel(cutoff.cutoff_number)}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDate(cutoff.date)} · {formatCurrency(cutoff.salary)}
                  </span>
                </div>

                {cutoffItems.length === 0 ? (
                  <p className="text-sm text-muted py-3 text-center">No expenses for this cutoff.</p>
                ) : (
                  <>
                    {/* Desktop table */}
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

                    {/* Mobile card list */}
                    <div className="md:hidden flex flex-col gap-2">
                      {cutoffItems.map((item) => {
                        const status = getDueStatus(item.due_date)
                        const cls = dueStatusClasses[status]
                        const isPaid = item.status === 'paid'
                        return (
                          <div
                            key={item.id}
                            className={[
                              'rounded-md p-3 border border-line-light',
                              isPaid ? 'bg-surface' : cls.row,
                            ].join(' ')}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <span className={`text-sm font-medium leading-snug ${isPaid ? 'text-muted' : cls.text}`}>
                                {item.name}
                              </span>
                              <span
                                className={[
                                  'inline-flex shrink-0 px-2 py-0.5 rounded-sm text-xs font-medium',
                                  item.status === 'paid' ? 'bg-paid-bg text-paid' : 'bg-card text-muted',
                                ].join(' ')}
                              >
                                {item.status === 'paid' ? 'Paid' : 'Unpaid'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-2.5">
                              <span className={`text-sm font-semibold ${isPaid ? 'text-muted' : cls.text}`}>
                                {formatCurrency(item.amount)}
                              </span>
                              {item.due_date && (
                                <>
                                  <span className="text-xs text-muted">·</span>
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

