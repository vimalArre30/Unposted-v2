import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write cookies into the request (for downstream middleware)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Recreate response so cookie changes are sent to the browser
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — must be called before any logic that reads the user.
  // This keeps the Supabase auth cookie from expiring on active users.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // First-time visitor: create a silent anonymous session
  if (!user) {
    try {
      await supabase.auth.signInAnonymously()
    } catch {
      // Anonymous auth may be disabled in Supabase dashboard — app still works
    }
  }

  // Setup guard: non-anonymous users who haven't completed setup must go to /auth/setup.
  // After complete-setup, the real email is replaced with {id}@private.unposted.app,
  // so that suffix is the reliable signal that setup is done — no DB query needed.
  if (user && !user.is_anonymous) {
    const email = user.email ?? ''
    const setupComplete = email.endsWith('@private.unposted.app')
    const pathname = request.nextUrl.pathname
    if (!setupComplete && !pathname.startsWith('/auth/')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/auth/setup'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on all routes except /api, Next.js internals, and static files
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
