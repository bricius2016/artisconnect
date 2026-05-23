// ============================================================
// ArtisConnect — Middleware Next.js
// Compatible next-intl v4 + Supabase Auth
// ============================================================

import createMiddleware from 'next-intl/middleware'
import { routing } from '@/lib/i18n'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes qui nécessitent une connexion
const PROTECTED_ROUTES = ['/dashboard', '/profil', '/messages', '/candidatures', '/admin']

// Routes pour utilisateurs non connectés seulement
const AUTH_ROUTES = ['/auth/login', '/auth/register']

const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  // 1. Appliquer l'i18n
  const response = intlMiddleware(request)

  // 2. Vérifier l'auth Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const pathname = request.nextUrl.pathname

  // Extraire le pathname sans préfixe de locale (/fr ou /en)
  const pathnameWithoutLocale = pathname.replace(/^\/(fr|en)/, '') || '/'

  // Rediriger vers login si route protégée et non connecté
  const isProtected = PROTECTED_ROUTES.some(r => pathnameWithoutLocale.startsWith(r))
  if (isProtected && !session) {
    const locale = pathname.split('/')[1]
    const loginUrl = new URL(`/${locale}/auth/login`, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Rediriger vers dashboard si déjà connecté et sur page auth
  const isAuthRoute = AUTH_ROUTES.some(r => pathnameWithoutLocale.startsWith(r))
  if (isAuthRoute && session) {
    const locale = pathname.split('/')[1]
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',],
}
