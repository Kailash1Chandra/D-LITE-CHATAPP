import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Pages accessible without any auth
const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"];
// Pages that need a session but not MFA
const MFA_PAGES = ["/setup-authenticator", "/verify-authenticator", "/auth/callback"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // ── Not logged in ─────────────────────────────────────────────
  if (!user) {
    const isPublic =
      AUTH_PAGES.some(p => pathname.startsWith(p)) ||
      MFA_PAGES.some(p => pathname.startsWith(p));
    if (isPublic) return response;
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── Logged in — check MFA level ───────────────────────────────
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const currentLevel = aal?.currentLevel; // "aal1" | "aal2"
  const nextLevel    = aal?.nextLevel;    // "aal1" (no MFA) | "aal2" (MFA enrolled)

  // Already fully verified — keep them out of auth/setup pages
  if (currentLevel === "aal2") {
    if (
      AUTH_PAGES.some(p => pathname.startsWith(p)) ||
      MFA_PAGES.some(p => pathname.startsWith(p))
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response; // allow everything else
  }

  // On MFA setup/verify pages — allow (they're in the middle of the flow)
  if (MFA_PAGES.some(p => pathname.startsWith(p))) return response;

  // No MFA enrolled yet → must set it up before accessing anything
  if (nextLevel === "aal1") {
    return NextResponse.redirect(new URL("/setup-authenticator", request.url));
  }

  // MFA enrolled but not verified this session → must complete challenge
  if (nextLevel === "aal2" && currentLevel !== "aal2") {
    return NextResponse.redirect(new URL("/verify-authenticator", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Match everything except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
