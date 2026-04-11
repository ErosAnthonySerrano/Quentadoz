'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  // Clear cache and redirect
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}
