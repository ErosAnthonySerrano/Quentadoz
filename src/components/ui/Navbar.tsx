'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { RiDashboardLine, RiHistoryLine, RiUserLine } from 'react-icons/ri'
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi'
import { HiOutlinePlusCircle } from 'react-icons/hi2'
import { useThemeStore } from '@/store/useThemeStore'

const navItems = [
  { href: '/dashboard', icon: RiDashboardLine, label: 'Dashboard' },
  { href: '/history', icon: RiHistoryLine, label: 'History' },
]

export function Navbar() {
  const pathname = usePathname()
  const { theme, mounted, hydrate, toggleTheme } = useThemeStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  // ThemeIcon: renders nothing until mounted to prevent hydration mismatch
  const ThemeIcon = mounted
    ? theme === 'light' ? HiOutlineMoon : HiOutlineSun
    : null

  return (
    <>
      {/* Mobile top header */}
      <header className="md:hidden sticky top-0 z-100 bg-card border-b border-line flex items-center px-4 h-12">
        <Link href="/dashboard" className="flex items-center gap-2 no-underline">
          <Image src="/Quentadoz%20Main%20Logo.png" alt="Quentadoz" width={26} height={26} className="object-contain" style={{ height: 'auto' }} />
          <span className="text-base font-semibold text-header">Quentadoz</span>
        </Link>
      </header>

      {/* Desktop top navbar */}
      <header className="navbar-desktop hidden bg-card border-b border-line sticky top-0 z-100">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 no-underline">
              <Image src="/Quentadoz%20Main%20Logo.png" alt="Quentadoz" width={28} height={28} className="object-contain" style={{ height: 'auto' }} />
              <span className="text-base font-semibold text-header">Quentadoz</span>
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm no-underline transition-colors',
                    pathname === href
                      ? 'text-accent font-semibold'
                      : 'text-body font-normal hover:bg-surface',
                  ].join(' ')}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex items-center justify-center w-9 h-9 rounded-sm text-body bg-transparent border-none cursor-pointer hover:bg-surface transition-colors"
            >
              {ThemeIcon && <ThemeIcon size={18} />}
            </button>
            <Link
              href="/profile"
              aria-label="Profile"
              className="flex items-center justify-center w-9 h-9 rounded-sm text-body no-underline hover:bg-surface transition-colors"
            >
              <RiUserLine size={18} />
            </Link>
            <Link
              href="/budget/new"
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-white text-sm font-medium no-underline hover:bg-accent-hover transition-colors"
            >
              <HiOutlinePlusCircle size={16} />
              Add Budget
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="navbar-mobile flex fixed bottom-0 left-0 right-0 h-15 bg-card border-t border-line z-100 items-center justify-around">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={[
              'flex flex-col items-center gap-0.5 px-3 py-1 no-underline',
              pathname === href ? 'text-accent' : 'text-muted',
            ].join(' ')}
          >
            <Icon size={20} />
            <span className="text-xs">{label}</span>
          </Link>
        ))}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted bg-transparent border-none cursor-pointer"
          aria-label="Toggle theme"
        >
          {ThemeIcon && <ThemeIcon size={20} />}
          <span className="text-xs">Theme</span>
        </button>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted no-underline">
          <RiUserLine size={20} />
          <span className="text-xs">Profile</span>
        </Link>
        <Link href="/budget/new" className="flex flex-col items-center gap-0.5 px-3 py-1 text-accent no-underline">
          <HiOutlinePlusCircle size={20} />
          <span className="text-xs">Add</span>
        </Link>
      </nav>
    </>
  )
}

