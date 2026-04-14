'use client'

import React, { useEffect, useRef, useState } from 'react'
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
import { HiSparkles } from 'react-icons/hi2'
import { useToast } from '@/components/ui/Toast'
import { AIUploadModal } from './AIUploadModal'
import { AIOutOfRangeModal } from './AIOutOfRangeModal'
import type { FormValues } from './budgetFormSchema'
import type { ParsedReceiptItemWithCutoff } from '@/types'
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
  totalCutoffs,
  onDivideItem,
  month,
  year,
  otherSalaries,
}: CutoffSectionProps) {
  const columnNameRef = useRef<HTMLInputElement>(null)
  const [salaryDropdownOpen, setSalaryDropdownOpen] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiFilledIds, setAiFilledIds] = useState<Set<string>>(new Set())
  const pendingAiCountRef = useRef(0)
  const [pendingAIItems, setPendingAIItems] = useState<ParsedReceiptItemWithCutoff[] | null>(null)
  const [outOfRangeModalOpen, setOutOfRangeModalOpen] = useState(false)
  const { show: showToast } = useToast()

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: `cutoffs.${cutoffIndex}.items`,
  })

  const customColumns = watch(`cutoffs.${cutoffIndex}.customColumns`) ?? []
  const cutoffError = errors.cutoffs?.[cutoffIndex]

  // After appendItem calls settle, mark the last N appended fields as AI
  useEffect(() => {
    if (pendingAiCountRef.current > 0) {
      const newIds = itemFields.slice(-pendingAiCountRef.current).map((f) => f.id)
      setAiFilledIds((prev) => {
        const next = new Set(prev)
        newIds.forEach((id) => next.add(id))
        return next
      })
      pendingAiCountRef.current = 0
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemFields.length])

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

  function doInsertItems(items: ParsedReceiptItemWithCutoff[]) {
    const customInit: Record<string, string> = {}
    customColumns.forEach((col) => { customInit[col] = '' })

    const sourceCutoffNumber = cutoffIndex + 1

    const thisItems = items.filter(
      (item) =>
        item.cutoff_number === null ||
        item.cutoff_number === sourceCutoffNumber ||
        item.cutoff_number < 1 ||
        item.cutoff_number > totalCutoffs
    )
    const crossItems = items.filter(
      (item) =>
        item.cutoff_number !== null &&
        item.cutoff_number !== sourceCutoffNumber &&
        item.cutoff_number >= 1 &&
        item.cutoff_number <= totalCutoffs
    )

    const hasOnlyBlankRow =
      itemFields.length === 1 &&
      !watch(`cutoffs.${cutoffIndex}.items.0.name`) &&
      !watch(`cutoffs.${cutoffIndex}.items.0.amount`)

    thisItems.forEach((item, idx) => {
      const parsed = {
        name: item.name,
        amount: item.amount,
        due_date: item.due_date || '',
        custom_fields: { ...customInit },
      }

      if (idx === 0 && hasOnlyBlankRow) {
        setValue(`cutoffs.${cutoffIndex}.items.0.name`, parsed.name, { shouldDirty: true, shouldValidate: true })
        setValue(`cutoffs.${cutoffIndex}.items.0.amount`, parsed.amount, { shouldDirty: true, shouldValidate: true })
        setValue(`cutoffs.${cutoffIndex}.items.0.due_date`, parsed.due_date, { shouldDirty: true, shouldValidate: true })
        setValue(`cutoffs.${cutoffIndex}.items.0.custom_fields`, parsed.custom_fields, { shouldDirty: true, shouldValidate: true })
        setAiFilledIds((prev) => new Set(prev).add(itemFields[0].id))
      } else {
        appendItem(parsed)
        pendingAiCountRef.current += 1
      }
    })

    const crossCutoffNumbers = new Set<number>()
    crossItems.forEach((item) => {
      const targetIdx = item.cutoff_number! - 1
      const targetItems = watch(`cutoffs.${targetIdx}.items`) ?? []
      const targetCustomCols = (watch(`cutoffs.${targetIdx}.customColumns`) ?? []) as string[]
      const targetCustomInit: Record<string, string> = {}
      targetCustomCols.forEach((col) => { targetCustomInit[col] = '' })

      const parsed = {
        name: item.name,
        amount: item.amount,
        due_date: item.due_date || '',
        custom_fields: { ...targetCustomInit },
      }

      const targetHasOnlyBlankRow =
        targetItems.length === 1 &&
        !targetItems[0].name &&
        (Number(targetItems[0].amount) === 0 || !targetItems[0].amount)

      if (targetHasOnlyBlankRow) {
        setValue(`cutoffs.${targetIdx}.items`, [parsed], { shouldDirty: true })
      } else {
        setValue(`cutoffs.${targetIdx}.items`, [...targetItems, parsed], { shouldDirty: true })
      }

      crossCutoffNumbers.add(item.cutoff_number!)
    })

    const totalInserted = thisItems.length + crossItems.length
    if (crossItems.length > 0) {
      const labels = Array.from(crossCutoffNumbers).sort().map((n) => ordinalLabel(n)).join(', ')
      showToast(`${totalInserted} item(s) distributed across cutoffs. Items sent to: ${labels}.`, 'success')
    } else {
      showToast(`Added ${totalInserted} item(s) from receipt.`, 'success')
    }
  }

  function handleAIParsed(items: ParsedReceiptItemWithCutoff[]) {
    if (items.length === 0) {
      showToast('No items found in the image. Please try a different photo.', 'error')
      return
    }

    const outOfRangeItems = items.filter(
      (item) => item.cutoff_number !== null && item.cutoff_number > totalCutoffs
    )

    if (outOfRangeItems.length > 0) {
      setPendingAIItems(items)
      setOutOfRangeModalOpen(true)
      return
    }

    doInsertItems(items)
  }

  function handleOutOfRangeAddAll() {
    if (!pendingAIItems) return
    const resolved = pendingAIItems.map((item) =>
      item.cutoff_number !== null && item.cutoff_number > totalCutoffs
        ? { ...item, cutoff_number: null }
        : item
    )
    setOutOfRangeModalOpen(false)
    setPendingAIItems(null)
    doInsertItems(resolved)
  }

  function handleOutOfRangeDiscard() {
    if (!pendingAIItems) return
    const resolved = pendingAIItems.filter(
      (item) => item.cutoff_number === null || item.cutoff_number <= totalCutoffs
    )
    setOutOfRangeModalOpen(false)
    setPendingAIItems(null)
    if (resolved.length === 0) {
      showToast('All items were discarded — no items matched your cutoffs.', 'error')
      return
    }
    doInsertItems(resolved)
  }

  return (
    <div className="bg-card rounded-lg shadow-card p-5 mb-5">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-header">{ordinalLabel(cutoffIndex + 1)}</h2>
        <button
          type="button"
          onClick={() => setAiModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-accent hover:bg-accent-light transition-colors cursor-pointer"
          title="Scan receipt with AI"
        >
          <HiSparkles size={15} />
          <span>Scan with AI</span>
        </button>
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

      {/* Items table — desktop only */}
      <div className="hidden md:block overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm" style={{ minWidth: '480px' }}>
          <thead>
            <tr className="border-b border-line">
              <th className="text-left py-2 pr-3 text-xs font-medium text-muted">Name</th>
              <th className="text-left py-2 pr-3 text-xs font-medium text-muted w-32">Amount (₱)</th>
              <th className="text-left py-2 pr-3 text-xs font-medium text-muted w-32">Due Date</th>
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
              const isAI = aiFilledIds.has(field.id)
              return (
                <tr key={field.id} className="border-b border-line-light last:border-0">
                  <td className="py-2 pr-3">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="e.g. Netflix"
                          {...register(`cutoffs.${cutoffIndex}.items.${itemIndex}.name`)}
                          className={[
                            'flex-1 px-2 py-1.5 rounded-md text-sm text-header bg-surface outline-none transition-colors border',
                            itemError?.name ? 'border-due-danger' : 'border-line',
                          ].join(' ')}
                        />
                        {isAI && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded-sm text-xs font-medium bg-accent-light text-accent">
                            AI
                          </span>
                        )}
                      </div>
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

      {/* Items cards — mobile only */}
      <div className="md:hidden flex flex-col gap-3 mt-3">
        {customColumns.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customColumns.map((col) => (
              <span key={col} className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-medium bg-surface text-muted border border-line">
                {col}
                <button
                  type="button"
                  onClick={() => removeColumn(col)}
                  className="text-muted hover:text-due-danger transition-colors"
                  title={`Remove "${col}" column`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        {itemFields.map((field, itemIndex) => {
          const itemError = cutoffError?.items?.[itemIndex]
          const isAI = aiFilledIds.has(field.id)
          return (
            <div key={field.id} className="bg-surface rounded-md p-3 flex flex-col gap-2.5">
              {/* Row: name + AI badge + actions */}
              <div className="flex items-start gap-2">
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. Netflix"
                      {...register(`cutoffs.${cutoffIndex}.items.${itemIndex}.name`)}
                      className={[
                        'flex-1 px-2 py-1.5 rounded-md text-sm text-header bg-card outline-none transition-colors border',
                        itemError?.name ? 'border-due-danger' : 'border-line',
                      ].join(' ')}
                    />
                    {isAI && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded-sm text-xs font-medium bg-accent-light text-accent">
                        AI
                      </span>
                    )}
                  </div>
                  {itemError?.name && (
                    <span className="text-xs text-due-danger">{itemError.name.message as string}</span>
                  )}
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onDivideItem(cutoffIndex, itemIndex)}
                    title="Divide across cutoffs"
                    className="p-1.5 rounded-md text-muted hover:text-accent hover:bg-card transition-colors"
                  >
                    <RiScissorsLine size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(itemIndex)}
                    disabled={itemFields.length === 1}
                    title="Remove item"
                    className="p-1.5 rounded-md text-muted hover:text-due-danger hover:bg-card transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <HiOutlineTrash size={15} />
                  </button>
                </div>
              </div>

              {/* Amount + Due Date side by side */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-medium text-muted">Amount (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register(`cutoffs.${cutoffIndex}.items.${itemIndex}.amount`)}
                    className={[
                      'w-full px-2 py-1.5 rounded-md text-sm text-header bg-card outline-none transition-colors border',
                      itemError?.amount ? 'border-due-danger' : 'border-line',
                    ].join(' ')}
                  />
                  {itemError?.amount && (
                    <span className="text-xs text-due-danger">{itemError.amount.message as string}</span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-medium text-muted">Due Date</label>
                  <input
                    type="date"
                    {...register(`cutoffs.${cutoffIndex}.items.${itemIndex}.due_date`)}
                    onFocus={(e) =>
                      handleDateFocus(e, `cutoffs.${cutoffIndex}.items.${itemIndex}.due_date`)
                    }
                    className={[
                      'w-full px-2 py-1.5 rounded-md text-sm text-header bg-card outline-none transition-colors border',
                      itemError?.due_date ? 'border-due-danger' : 'border-line',
                    ].join(' ')}
                  />
                  {itemError?.due_date && (
                    <span className="text-xs text-due-danger">{itemError.due_date.message as string}</span>
                  )}
                </div>
              </div>

              {/* Custom columns */}
              {customColumns.length > 0 && (
                <div className="flex flex-col gap-2">
                  {customColumns.map((col) => (
                    <div key={col} className="flex flex-col gap-0.5">
                      <label className="text-xs font-medium text-muted">{col}</label>
                      <input
                        type="text"
                        placeholder={col}
                        {...register(`cutoffs.${cutoffIndex}.items.${itemIndex}.custom_fields.${col}`)}
                        className="w-full px-2 py-1.5 rounded-md text-sm text-header bg-card outline-none transition-colors border border-line"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
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

      {/* AI Upload Modal */}
      <AIUploadModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onSuccess={handleAIParsed}
        cutoffIndex={cutoffIndex}
        cutoffCount={totalCutoffs}
      />

      {/* Out-of-range decision modal */}
      {outOfRangeModalOpen && pendingAIItems && (
        <AIOutOfRangeModal
          isOpen={outOfRangeModalOpen}
          outOfRangeCount={pendingAIItems.filter((i) => i.cutoff_number !== null && i.cutoff_number > totalCutoffs).length}
          outOfRangeCutoffs={[...new Set(pendingAIItems.filter((i) => i.cutoff_number !== null && i.cutoff_number > totalCutoffs).map((i) => i.cutoff_number!))]}
          totalCutoffs={totalCutoffs}
          fallbackLabel={ordinalLabel(cutoffIndex + 1)}
          onAddAll={handleOutOfRangeAddAll}
          onDiscard={handleOutOfRangeDiscard}
        />
      )}
    </div>
  )
}
