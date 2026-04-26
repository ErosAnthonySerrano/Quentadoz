'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { RiDashboardLine, RiHistoryLine } from 'react-icons/ri'
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi'
import { HiOutlinePlusCircle } from 'react-icons/hi2'
import { createClient } from '@/lib/supabase/client'
import { useThemeStore } from '@/store/useThemeStore'

const navItems = [
  { href: '/dashboard', icon: RiDashboardLine, label: 'Dashboard' },
  { href: '/history', icon: RiHistoryLine, label: 'History' },
]

export function Navbar() {
  const pathname = usePathname()
  const { theme, mounted, hydrate, toggleTheme } = useThemeStore()
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null)
  const [profileAvatarLabel, setProfileAvatarLabel] = useState('Q')

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    async function loadProfileAvatar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setProfileAvatarUrl(null)
        setProfileAvatarLabel('Q')
        return
      }

      const displayName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'Quentadoz'
      const initials = displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part: string) => part[0]?.toUpperCase() ?? '')
        .join('')
        .slice(0, 2) || 'Q'

      setProfileAvatarUrl(user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null)
      setProfileAvatarLabel(initials)
    }

    loadProfileAvatar()
  }, [])

  // ThemeIcon: renders nothing until mounted to prevent hydration mismatch
  const ThemeIcon = mounted
    ? theme === 'light' ? HiOutlineMoon : HiOutlineSun
    : null

  const renderProfileBadge = () => (
    <div className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden border border-line bg-surface shadow-sm">
      {profileAvatarUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profileAvatarUrl}
            alt="Profile"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </>
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-[radial-gradient(circle_at_30%_30%,rgba(123,167,255,0.28),transparent_40%),radial-gradient(circle_at_70%_30%,rgba(166,120,255,0.24),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(237,242,255,0.98))] text-header text-xs font-semibold">
          {profileAvatarLabel}
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile top header */}
      <header className="md:hidden fixed top-0 inset-x-0 z-100 bg-card border-b border-line flex items-center px-4 h-12">
        <Link href="/dashboard" className="flex items-center gap-2 no-underline">
          <Image src="/Quentadoz%20Main%20Logo.png" alt="Quentadoz" width={26} height={26} className="object-contain" style={{ height: 'auto' }} />
          <span className="text-base font-semibold text-header">Quentadoz</span>
        </Link>
      </header>

      {/* Desktop top navbar */}
      <header className="navbar-desktop hidden fixed top-0 inset-x-0 z-100 bg-card border-b border-line shadow-md">
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
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm no-underline transition-all',
                    pathname === href
                      ? 'text-accent font-semibold bg-accent-light shadow-sm'
                      : 'text-body font-normal hover:bg-surface hover:shadow-sm',
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
              className="flex items-center justify-center w-9 h-9 rounded-sm text-body bg-transparent border border-transparent cursor-pointer hover:bg-surface hover:border-line hover:shadow-sm transition-all active:scale-95"
            >
              {ThemeIcon && <ThemeIcon size={18} />}
            </button>
            <Link
              href="/profile"
              aria-label="Profile"
              className="flex items-center justify-center w-9 h-9 rounded-sm text-body no-underline border border-transparent hover:bg-surface hover:border-line hover:shadow-sm transition-all active:scale-95"
            >
              {renderProfileBadge()}
            </Link>
            <Link
              href="/budget/new"
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-white text-sm font-medium no-underline hover:bg-accent-hover shadow-md active:scale-95 transition-all"
            >
              <HiOutlinePlusCircle size={16} />
              Add Budget
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="navbar-mobile flex fixed inset-x-0 bottom-0 h-15 bg-card border-t border-line z-100 items-center justify-around overflow-hidden pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={[
              'flex flex-col items-center gap-0.5 px-2 py-1 no-underline min-w-0 flex-1',
              pathname === href ? 'text-accent' : 'text-muted',
            ].join(' ')}
          >
            <Icon size={20} />
            <span className="text-[11px] leading-none whitespace-nowrap">{label}</span>
          </Link>
        ))}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-0.5 px-2 py-1 text-muted bg-transparent border-none cursor-pointer min-w-0 flex-1"
          aria-label="Toggle theme"
        >
          {ThemeIcon && <ThemeIcon size={20} />}
          <span className="text-[11px] leading-none whitespace-nowrap">Theme</span>
        </button>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 px-2 py-1 text-muted no-underline min-w-0 flex-1">
          {renderProfileBadge()}
          <span className="text-[11px] leading-none whitespace-nowrap">Profile</span>
        </Link>
        <Link href="/budget/new" className="flex flex-col items-center gap-0.5 px-2 py-1 text-accent no-underline min-w-0 flex-1">
          <HiOutlinePlusCircle size={20} />
          <span className="text-[11px] leading-none whitespace-nowrap">Add</span>
        </Link>
      </nav>
    </>
  )
}

