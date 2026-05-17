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
    pathname.startsWith('/verify-authenticator')

  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/groups') ||
    pathname.startsWith('/call') ||
    pathname.startsWith('/calls') ||
    pathname.startsWith('/ai') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/settings')

  // Not logged in — block protected and MFA pages
  if (!user) {
    if (isProtectedRoute || isMfaRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Logged in — check MFA assurance level
  let needsMfa = false
  try {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    needsMfa = aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2'
  } catch {
    // MFA check failed — don't block the user
  }

  // Has enrolled MFA but not yet verified this session → must verify first
  if (needsMfa && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/verify-authenticator'
    return NextResponse.redirect(url)
  }

  // Fully authenticated — redirect away from auth and MFA setup pages
  if (!needsMfa && (isAuthRoute || isMfaRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
