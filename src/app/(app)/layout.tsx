'use client'

import React, { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/ui/Navbar'

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)

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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="page-content flex-1 max-w-screen-xl w-full mx-auto px-6 py-8 pb-20">
        {children}
      </main>
    </div>
  )
}
