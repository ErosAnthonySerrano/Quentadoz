'use client'

import React, { useMemo } from 'react'
import { RiBus2Line, RiHandCoinLine, RiMovie2Line, RiRestaurant2Line, RiWallet3Line } from 'react-icons/ri'

type FallbackVisual = {
  Icon: React.ComponentType<{ size?: number }>
  bg: string
}

function normalizeName(name: string) {
  return name.trim().toLowerCase()
}

function getFallbackVisual(name: string): FallbackVisual {
  const key = normalizeName(name)

  if (key.includes('transport') || key.includes('transpo') || key.includes('bus') || key.includes('ride') || key.includes('taxi')) {
    return { Icon: RiBus2Line, bg: 'var(--color-chip-transport-bg)' }
  }

  if (key.includes('borrow') || key.includes('loan') || key.includes('debt')) {
    return { Icon: RiHandCoinLine, bg: 'var(--color-chip-loan-bg)' }
  }

  if (key.includes('food') || key.includes('meal') || key.includes('grocery') || key.includes('restaurant') || key.includes('dine')) {
    return { Icon: RiRestaurant2Line, bg: 'var(--color-chip-food-bg)' }
  }

  if (
    key.includes('netflix') ||
    key.includes('spotify') ||
    key.includes('youtube') ||
    key.includes('yt') ||
    key.includes('movie') ||
    key.includes('entertain')
  ) {
    return { Icon: RiMovie2Line, bg: 'var(--color-chip-entertainment-bg)' }
  }

  return { Icon: RiWallet3Line, bg: 'var(--color-chip-default-bg)' }
}

interface Props {
  name: string
  size?: 'sm' | 'md'
}

export function ExpenseIdentityBadge({ name, size = 'sm' }: Props) {
  const fallback = useMemo(() => getFallbackVisual(name), [name])

  const dimensions = size === 'md' ? 'h-8 w-8' : 'h-7 w-7'
  const iconSize = size === 'md' ? 16 : 15

  return (
    <span
      className={[
        'inline-flex shrink-0 items-center justify-center rounded-md overflow-hidden border border-line shadow-sm',
        dimensions,
      ].join(' ')}
      style={{ backgroundColor: fallback.bg, color: '#fff' }}
      aria-hidden="true"
    >
      <fallback.Icon size={iconSize} />
    </span>
  )
}
