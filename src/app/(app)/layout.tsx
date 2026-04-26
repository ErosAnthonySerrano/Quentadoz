'use client'

import React, { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/ui/Navbar'

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = React.useState(true)
  const isDashboardRoute = pathname === '/dashboard'

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.replace('/auth/login')
        return
      }
      
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />
      <main
        className={[
          'page-content flex-1 w-full mx-auto px-4 sm:px-6 xl:px-8 2xl:px-10 pt-24 md:pt-28 pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-28',
          isDashboardRoute ? '' : 'max-w-screen-xl',
        ].join(' ')}
      >
        {children}
      </main>
    </div>
  )
}
