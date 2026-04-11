import React from 'react'
import { Navbar } from '@/components/ui/Navbar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="page-content flex-1 max-w-screen-xl w-full mx-auto px-6 py-8 pb-20">
        {children}
      </main>
    </div>
  )
}
