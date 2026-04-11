'use client'

import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeStore {
  theme: Theme
  mounted: boolean
  hydrate: () => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  // Always start as 'light' on server — synced client-side via hydrate()
  theme: 'light',
  mounted: false,
  hydrate: () => {
    const saved = (localStorage.getItem('quentadoz-theme') as Theme) || 'light'
    set({ theme: saved, mounted: true })
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('quentadoz-theme', next)
    document.body.classList.add('transitions-ready')
    set({ theme: next })
  },
}))

