'use client'

import React from 'react'
import Link from 'next/link'
import type { BudgetItem, Cutoff } from '@/types'
import { formatCurrency, formatDate, getDueStatus, dueStatusClasses, ordinalLabel } from '@/utils/budget'
import { Button } from '@/components/ui/Button'
import { HiChevronLeft, HiChevronRight, HiOutlinePencilSquare } from 'react-icons/hi2'
import { ExpenseIdentityBadge } from '@/components/widgets/ExpenseIdentityBadge'

interface Props {
  cutoffs: Cutoff[]
  items: BudgetItem[]
  updatingIds: Set<string>
  onChangeStatus: (item: BudgetItem) => void
  budgetMonthId: string
}

export function ExpensesTableWidget({ cutoffs, items, updatingIds, onChangeStatus, budgetMonthId }: Props) {
  const ROWS_PER_PAGE = 10
  const [activeCutoffIdx, setActiveCutoffIdx] = React.useState(0)
  const [itemPage, setItemPage] = React.useState(0)

  React.useEffect(() => {
    setActiveCutoffIdx((prev) => Math.min(prev, Math.max(0, cutoffs.length - 1)))
  }, [cutoffs.length])

  React.useEffect(() => {
    setItemPage(0)
  }, [activeCutoffIdx])

  const activeCutoff = cutoffs[activeCutoffIdx] ?? null
  const activeCutoffItems = activeCutoff
    ? items.filter((i) => i.cutoff_id === activeCutoff.id)
    : []
  const itemPageCount = Math.max(1, Math.ceil(activeCutoffItems.length / ROWS_PER_PAGE))
  const safeItemPage = Math.min(itemPage, itemPageCount - 1)
  const itemStart = safeItemPage * ROWS_PER_PAGE
  const itemEnd = Math.min(activeCutoffItems.length, itemStart + ROWS_PER_PAGE)
  const pagedActiveCutoffItems = activeCutoffItems.slice(itemStart, itemEnd)

  React.useEffect(() => {
    setItemPage((prev) => Math.min(prev, itemPageCount - 1))
  }, [itemPageCount])

  return (
    <div className="dashboard-card p-6 h-full flex flex-col min-h-0">
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
        <>
          <div className="hidden md:flex md:flex-col md:flex-1 md:min-h-0">
            {activeCutoff ? (
              <>
                <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-line min-w-0">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2 min-w-0">
                      <span className="text-sm font-semibold text-title min-w-0">
                        {ordinalLabel(activeCutoff.cutoff_number)}
                      </span>
                      <span className="text-xs text-muted min-w-0 break-words">
                        {formatDate(activeCutoff.date)} - {formatCurrency(activeCutoff.salary)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      className="dashboard-chip h-7 w-7 rounded-md text-muted disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                      onClick={() => setActiveCutoffIdx((idx) => Math.max(0, idx - 1))}
                      disabled={activeCutoffIdx === 0}
                      aria-label="Previous cutoff"
                    >
                      <HiChevronLeft size={14} />
                    </button>
                    <span className="text-[11px] text-muted min-w-[3.25rem] text-center">
                      {activeCutoffIdx + 1}/{cutoffs.length}
                    </span>
                    <button
                      type="button"
                      className="dashboard-chip h-7 w-7 rounded-md text-muted disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                      onClick={() => setActiveCutoffIdx((idx) => Math.min(cutoffs.length - 1, idx + 1))}
                      disabled={activeCutoffIdx >= cutoffs.length - 1}
                      aria-label="Next cutoff"
                    >
                      <HiChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {activeCutoffItems.length === 0 ? (
                  <p className="text-sm text-muted py-6 text-center">No expenses for this cutoff.</p>
                ) : (
                  <div className="min-h-0 flex flex-col">
                    {activeCutoffItems.length > ROWS_PER_PAGE && (
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] text-muted">
                          Showing {itemStart + 1}-{itemEnd} of {activeCutoffItems.length} items
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className="dashboard-chip h-6 px-2 rounded-sm text-[11px] text-muted disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => setItemPage((p) => Math.max(0, p - 1))}
                            disabled={safeItemPage === 0}
                          >
                            Prev
                          </button>
                          <button
                            type="button"
                            className="dashboard-chip h-6 px-2 rounded-sm text-[11px] text-muted disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => setItemPage((p) => Math.min(itemPageCount - 1, p + 1))}
                            disabled={safeItemPage >= itemPageCount - 1}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="min-h-0 overflow-auto">
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
                          {pagedActiveCutoffItems.map((item) => {
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
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted py-6 text-center">No cutoffs available.</p>
            )}
          </div>

          <div className="md:hidden flex flex-col gap-6">
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
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
