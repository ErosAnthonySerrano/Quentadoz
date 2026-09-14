'use client'

import React from 'react'
import { FiCheckCircle, FiShield } from 'react-icons/fi'

interface AuthLayoutProps {
  eyebrow?: string
  title: string
  description: string
  children: React.ReactNode
  compact?: boolean
}

const benefits = [
  'Plan every salary cutoff with clarity',
  'Keep spending, bills, and savings in view',
  'A calmer way to stay in control of your money',
]

function MainLogo({ className }: { className: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/Quentadoz%20Main%20Logo%20Light.png" alt="Quentadoz" className={`${className} theme-light-only`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/Quentadoz%20Main%20Logo%20Dark.png" alt="Quentadoz" className={`${className} theme-dark-only`} />
    </>
  )
}

export function AuthLayout({ eyebrow, title, description, children, compact = false }: AuthLayoutProps) {
  return (
    <main className="relative min-h-svh overflow-hidden bg-page px-4 py-6 text-body sm:px-8 sm:py-10">
      <div className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full border-[3.5rem] border-accent-light opacity-80" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-page-grad-a opacity-70 blur-3xl" />

      <div className={`relative mx-auto grid min-h-[calc(100svh-3rem)] w-full items-center gap-10 ${compact ? 'max-w-4xl lg:grid-cols-[.85fr_25rem] lg:gap-16' : 'max-w-6xl lg:grid-cols-[1fr_27rem] lg:gap-24'}`}>
        <section className="hidden lg:block">
          <MainLogo className="h-auto w-[280px] object-contain" />
          <div className="mt-12 max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent shadow-sm">
              <FiShield size={14} />
              Your money, made clearer
            </div>
            <h2 className="max-w-lg text-5xl font-extrabold leading-[1.04] tracking-[-0.04em] text-header">
              Your budget should work <span className="text-accent">for you.</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-muted">
              Quentadoz brings your income, expenses, and goals together so every month feels a little more intentional.
            </p>
            <div className="mt-10 space-y-4 text-sm text-body">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <FiCheckCircle className="h-5 w-5 shrink-0 text-accent" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full rounded-[1.75rem] border border-line bg-card p-6 shadow-[0_24px_70px_rgba(14,32,54,0.12)] sm:p-9">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <MainLogo className="h-auto w-[220px] object-contain" />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-light text-accent">
              <FiShield size={18} />
            </div>
          </div>
          <div className="mb-8">
            {eyebrow && <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>}
            <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-header">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
          </div>
          {children}
        </section>
      </div>
    </main>
  )
}
