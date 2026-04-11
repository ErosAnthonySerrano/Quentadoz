'use client'

import React, { useRef, useState } from 'react'
import {
  useFieldArray,
  Control,
  UseFormRegister,
  FieldErrors,
  UseFormWatch,
  UseFormSetValue,
} from 'react-hook-form'
import { HiOutlineTrash } from 'react-icons/hi2'
import { RiScissorsLine } from 'react-icons/ri'
import { HiPlus } from 'react-icons/hi'
import type { FormValues } from './budgetFormSchema'
import { ordinalLabel } from '@/utils/budget'

interface CutoffSectionProps {
  cutoffIndex: number
  control: Control<FormValues>
  register: UseFormRegister<FormValues>
  errors: FieldErrors<FormValues>
  watch: UseFormWatch<FormValues>
  setValue: UseFormSetValue<FormValues>
  totalCutoffs: number
  onDivideItem: (cutoffIndex: number, itemIndex: number) => void
  month: number
  year: number
  otherSalaries: Array<{ label: string; salary: number }>
}

export function CutoffSection({
  cutoffIndex,
  control,
  register,
  errors,
  watch,
  setValue,
  onDivideItem,
  month,
  year,
  otherSalaries,
}: CutoffSectionProps) {
  const columnNameRef = useRef<HTMLInputElement>(null)
  const [salaryDropdownOpen, setSalaryDropdownOpen] = useState(false)

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: `cutoffs.${cutoffIndex}.items`,
  })

  const customColumns = watch(`cutoffs.${cutoffIndex}.customColumns`) ?? []
  const cutoffError = errors.cutoffs?.[cutoffIndex]

  // Default empty date inputs to first day of the selected budget month
  const budgetMonthDefault = `${year}-${String(month).padStart(2, '0')}-01`

  function handleDateFocus(e: React.FocusEvent<HTMLInputElement>, fieldName: string) {
    if (!e.target.value) {
      setValue(fieldName as Parameters<typeof setValue>[0], budgetMonthDefault, { shouldDirty: true })
    }
  }

  function addColumn() {
    const name = window.prompt('Enter column name:')
    if (!name || !name.trim()) return
    const trimmed = name.trim()
    if (customColumns.includes(trimmed)) return
    setValue(
      `cutoffs.${cutoffIndex}.customColumns`,
      [...customColumns, trimmed],
      { shouldDirty: true }
    )
    // initialize the key in all existing items
    itemFields.forEach((_, idx) => {
      const existing = watch(`cutoffs.${cutoffIndex}.items.${idx}.custom_fields`) ?? {}
      setValue(
        `cutoffs.${cutoffIndex}.items.${idx}.custom_fields`,
        { ...existing, [trimmed]: '' },
        { shouldDirty: true }
      )
    })
  }

  function removeColumn(colName: string) {
    setValue(
      `cutoffs.${cutoffIndex}.customColumns`,
      customColumns.filter((c) => c !== colName),
      { shouldDirty: true }
    )
  }

  function addItem() {
    const customInit: Record<string, string> = {}
    customColumns.forEach((col) => { customInit[col] = '' })
    appendItem({ name: '', amount: 0, due_date: '', custom_fields: customInit })
  }

  return (
    <div className="bg-card rounded-lg shadow-card p-5 mb-5">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-header">{ordinalLabel(cutoffIndex + 1)}</h2>
      </div>

      {/* Salary + Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-medium text-body">Salary Amount</label>
            {otherSalaries.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSalaryDropdownOpen((o) => !o)}
                  className="text-xs text-accent hover:underline flex items-center gap-1"
                >
                  Use other cutoff ▾
                </button>
                {salaryDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-card border border-line rounded-md shadow-card z-10 py-1 min-w-32">
                    {otherSalaries.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => {
                          setValue(`cutoffs.${cutoffIndex}.salary`, s.salary, { shouldDirty: true })
                          setSalaryDropdownOpen(false)
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-body hover:bg-surface"
                      >
                        {s.label} — {s.salary.toLocaleString()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register(`cutoffs.${cutoffIndex}.salary`)}
            className={[
              'w-full px-3 py-3 rounded-md text-sm text-header bg-surface outline-none transition-colors border',
              cutoffError?.salary ? 'border-due-danger' : 'border-line',
            ].join(' ')}
          />
          {cutoffError?.salary && (
            <span className="text-xs text-due-danger">{cutoffError.salary.message as string}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-body">Date of Credit</label>
          <input
            type="date"
            {...register(`cutoffs.${cutoffIndex}.date`)}
            onFocus={(e) => handleDateFocus(e, `cutoffs.${cutoffIndex}.date`)}
            className={[
              'w-full px-3 py-3 rounded-md text-sm text-header bg-surface outline-none transition-colors border',
              cutoffError?.date ? 'border-due-danger' : 'border-line',
            ].join(' ')}
          />
          {cutoffError?.date && (
            <span className="text-xs text-due-danger">{cutoffError.date.message as string}</span>
          )}
        </div>
      </div>

      {/* Items table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="text-left py-2 pr-3 text-xs font-medium text-muted w-48">Name</th>
              <th className="text-left py-2 pr-3 text-xs font-medium text-muted w-32">Amount (₱)</th>
              <th className="text-left py-2 pr-3 text-xs font-medium text-muted w-36">Due Date</th>
              {customColumns.map((col) => (
                <th key={col} className="text-left py-2 pr-3 text-xs font-medium text-muted min-w-28">
                  <span className="flex items-center gap-1">
                    {col}
                    <button
                      type="button"
                      onClick={() => removeColumn(col)}
                      className="text-muted hover:text-due-danger transition-colors ml-1"
                      title={`Remove "${col}" column`}
                    >
                      ×
                    </button>
                  </span>
                </th>
              ))}
              <th className="py-2 w-20" />
            </tr>
          </thead>
          <tbody>
            {itemFields.map((field, itemIndex) => {
              const itemError = cutoffError?.items?.[itemIndex]
              return (
                <tr key={field.id} className="border-b border-line-light last:border-0">
                  <td className="py-2 pr-3">
                    <div className="flex flex-col gap-0.5">
                      <input
                        type="text"
                        placeholder="e.g. Netflix"
                        {...register(`cutoffs.${cutoffIndex}.items.${itemIndex}.name`)}
                        className={[
                          'w-full px-2 py-1.5 rounded-md text-sm text-header bg-surface outline-none transition-colors border',
                          itemError?.name ? 'border-due-danger' : 'border-line',
                        ].join(' ')}
                      />
                      {itemError?.name && (
                        <span className="text-xs text-due-danger">{itemError.name.message as string}</span>
                      )}
                    </div>
                  </td>

                  <td className="py-2 pr-3">
                    <div className="flex flex-col gap-0.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...register(`cutoffs.${cutoffIndex}.items.${itemIndex}.amount`)}
                        className={[
                          'w-full px-2 py-1.5 rounded-md text-sm text-header bg-surface outline-none transition-colors border',
                          itemError?.amount ? 'border-due-danger' : 'border-line',
                        ].join(' ')}
                      />
                      {itemError?.amount && (
                        <span className="text-xs text-due-danger">{itemError.amount.message as string}</span>
                      )}
                    </div>
                  </td>

                  <td className="py-2 pr-3">
                    <div className="flex flex-col gap-0.5">
                      <input
                        type="date"
                        {...register(`cutoffs.${cutoffIndex}.items.${itemIndex}.due_date`)}
                        onFocus={(e) =>
                          handleDateFocus(e, `cutoffs.${cutoffIndex}.items.${itemIndex}.due_date`)
                        }
                        className={[
                          'w-full px-2 py-1.5 rounded-md text-sm text-header bg-surface outline-none transition-colors border',
                          itemError?.due_date ? 'border-due-danger' : 'border-line',
                        ].join(' ')}
                      />
                      {itemError?.due_date && (
                        <span className="text-xs text-due-danger">{itemError.due_date.message as string}</span>
                      )}
                    </div>
                  </td>

                  {/* Custom column cells */}
                  {customColumns.map((col) => (
                    <td key={col} className="py-2 pr-3">
                      <input
                        type="text"
                        placeholder={col}
                        {...register(`cutoffs.${cutoffIndex}.items.${itemIndex}.custom_fields.${col}`)}
                        className="w-full px-2 py-1.5 rounded-md text-sm text-header bg-surface outline-none transition-colors border border-line"
                      />
                    </td>
                  ))}

                  {/* Actions */}
                  <td className="py-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onDivideItem(cutoffIndex, itemIndex)}
                        title="Divide across cutoffs"
                        className="p-1.5 rounded-md text-muted hover:text-accent hover:bg-surface transition-colors"
                      >
                        <RiScissorsLine size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(itemIndex)}
                        disabled={itemFields.length === 1}
                        title="Remove item"
                        className="p-1.5 rounded-md text-muted hover:text-due-danger hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <HiOutlineTrash size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add item + add column */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-line-light flex-wrap">
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-sm text-accent font-medium hover:underline"
        >
          <HiPlus size={15} />
          Add Item
        </button>
        <button
          type="button"
          onClick={addColumn}
          className="flex items-center gap-1.5 text-sm text-muted font-medium hover:text-body hover:underline"
        >
          <HiPlus size={15} />
          Add Column
        </button>
      </div>

      {/* Ref for column name (unused — using window.prompt) */}
      <input ref={columnNameRef} type="hidden" />
    </div>
  )
}
