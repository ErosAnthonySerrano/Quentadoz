'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ordinalLabel } from '@/utils/budget'

interface DivideModalProps {
  totalCutoffs: number
  sourceCutoffIndex: number
  itemName: string
  itemAmount: number
  onConfirm: (selectedIndices: number[], perCutoffAmount: number) => void
  onClose: () => void
}

export function DivideModal({
  totalCutoffs,
  sourceCutoffIndex,
  itemName,
  itemAmount,
  onConfirm,
  onClose,
}: DivideModalProps) {
  const [selected, setSelected] = useState<number[]>([sourceCutoffIndex])

  const toggle = (idx: number) => {
    setSelected((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    )
  }

  const perAmount = selected.length > 0 ? itemAmount / selected.length : itemAmount

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-card p-6 w-full max-w-sm">
        <h3 className="text-base font-semibold text-header mb-1">Divide Item</h3>
        <p className="text-xs text-muted mb-4">
          &ldquo;{itemName}&rdquo; (₱{itemAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })})
          will be split equally across the selected cutoffs.
        </p>

        <div className="flex flex-col gap-2 mb-4">
          {Array.from({ length: totalCutoffs }, (_, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selected.includes(i)}
                onChange={() => toggle(i)}
                className="w-4 h-4"
              />
              <span className="text-sm text-body">{ordinalLabel(i + 1)}</span>
            </label>
          ))}
        </div>

        {selected.length > 0 && (
          <p className="text-xs text-muted mb-4">
            Each cutoff will receive ₱{perAmount.toFixed(2)}
          </p>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={selected.length === 0} onClick={() => onConfirm(selected, perAmount)}>
            Divide
          </Button>
        </div>
      </div>
    </div>
  )
}
