'use client'

import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-body">
        {label}
      </label>
      <input
        id={inputId}
        {...props}
        className={[
          'w-full rounded-xl border bg-surface px-4 py-3.5 text-sm text-header outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent-light',
          error ? 'border-due-danger' : 'border-line',
          className ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
      />
      {error && <span className="text-xs text-due-danger">{error}</span>}
    </div>
  )
}

