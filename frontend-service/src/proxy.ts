import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Supabase unreachable — treat as unauthenticated
  }

  const { pathname } = request.nextUrl

  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')

  const isMfaRoute =
    pathname.startsWith('/setup-authenticator') ||
    pathname.startsWith('/verify-authenticator') ||
    pathname.startsWith('/auth/callback')

  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/groups') ||
    pathname.startsWith('/call') ||
    pathname.startsWith('/calls') ||
    pathname.startsWith('/ai') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/settings')

  // Not logged in — allow auth pages, block everything else
  if (!user) {
    if (isProtectedRoute || isMfaRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Logged in — check MFA assurance level
  let currentLevel: string | undefined
  let nextLevel: string | undefined
  try {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    currentLevel = aal?.currentLevel
    nextLevel = aal?.nextLevel
  } catch {
    // MFA check failed — don't block the user
  }

  // Fully verified (aal2) — redirect away from auth/MFA pages
  if (currentLevel === 'aal2') {
    if (isAuthRoute || isMfaRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // In the middle of MFA flow — allow
  if (isMfaRoute) return supabaseResponse

  // No MFA factor enrolled yet → force setup
  if (nextLevel === 'aal1') {
    const url = request.nextUrl.clone()
    url.pathname = '/setup-authenticator'
    return NextResponse.redirect(url)
  }

  // MFA enrolled but not verified this session → force challenge
  if (nextLevel === 'aal2' && currentLevel !== 'aal2') {
    const url = request.nextUrl.clone()
    url.pathname = '/verify-authenticator'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
