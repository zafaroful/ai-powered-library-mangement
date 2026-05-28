import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getRoleForUser, homePathForRole } from '@/lib/auth/role'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const path = req.nextUrl.pathname

  const isAuthRoute = path.startsWith('/login') || path.startsWith('/register')
  const isAdminRoute = path.startsWith('/admin')
  const isStudentRoute = path.startsWith('/student')

  if (!session && (isAdminRoute || isStudentRoute)) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (session && (isAdminRoute || isStudentRoute || isAuthRoute)) {
    const role = await getRoleForUser(supabase, session.user.id, session.user.email)
    const home = homePathForRole(role)

    if (isAuthRoute) return NextResponse.redirect(new URL(home, req.url))
    if (role === 'admin' && isStudentRoute) return NextResponse.redirect(new URL('/admin', req.url))
    if (role === 'student' && isAdminRoute) return NextResponse.redirect(new URL('/student', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|.*\\..*).*)'],
}
