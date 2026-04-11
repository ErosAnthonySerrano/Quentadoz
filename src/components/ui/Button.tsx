'use client'

import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<string, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover',
  secondary: 'bg-surface text-body border border-line hover:bg-surface',
  ghost: 'bg-transparent text-body hover:bg-surface',
  danger: 'bg-due-danger text-white hover:opacity-90',
}

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variantClasses[variant],
        fullWidth ? 'w-full' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {loading ? (
        <>
          <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  )
}

