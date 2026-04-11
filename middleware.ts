import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = [
  '/dashboard',
  '/history',
  '/profile',
  '/budget',
]

const AUTH_ROUTES = [
  '/auth/login',
  '/auth/signup',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Clone the response and prepare cookie management
  const requestHeaders = new Headers(request.headers)
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Initialize Supabase client with proper SSR setup
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  try {
    // Check if user has an active session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
    const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

    // If user tries to access protected route without auth, redirect to login
    if (isProtectedRoute && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // If authenticated user tries to access auth pages, redirect to dashboard
    if (isAuthRoute && user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Redirect root to appropriate page based on auth status
    if (pathname === '/' || pathname === '/auth') {
      const url = request.nextUrl.clone()
      url.pathname = user ? '/dashboard' : '/auth/login'
      return NextResponse.redirect(url)
    }
  } catch (err) {
    console.error('Middleware error:', err)
    // On error, allow request through but user will be redirected by client if needed
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
