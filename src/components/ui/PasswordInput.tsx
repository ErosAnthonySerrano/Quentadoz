'use client'

import React, { useState, forwardRef } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ label, error, id, className, ...props }, ref) {
    const [visible, setVisible] = useState(false)
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium text-body">
          {label}
        </label>
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={visible ? 'text' : 'password'}
            {...props}
            className={[
              'w-full rounded-xl border bg-surface py-3.5 pl-4 pr-11 text-sm text-header outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent-light',
              error ? 'border-due-danger' : 'border-line',
              className ?? '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            tabIndex={-1}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center rounded-lg p-2 text-muted transition-colors hover:bg-accent-light hover:text-body"
          >
            {visible ? <FiEyeOff size={16} /> : <FiEye size={16} />}
          </button>
        </div>
        {error && <span className="text-xs text-due-danger">{error}</span>}
      </div>
    )
  }
)

