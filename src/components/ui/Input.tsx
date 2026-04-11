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
          'w-full px-3 py-3 rounded-md text-sm text-header bg-surface outline-none transition-colors border',
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

