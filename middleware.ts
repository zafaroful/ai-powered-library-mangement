import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getRoleForUser, homePathForRole } from '@/lib/auth/role'
import { getMiddlewareSupabaseEnv } from '@/lib/supabase/middleware-env'

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/register')
  const isAdminRoute = path.startsWith('/admin')
  const isStudentRoute = path.startsWith('/student')
  const isProtectedRoute = isAdminRoute || isStudentRoute

  const env = getMiddlewareSupabaseEnv()
  if (!env) {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next({ request: req })
  }

  let res = NextResponse.next({ request: req })

  try {
    const supabase = createServerClient(env.url, env.anonKey, {
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
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user && isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (user && (isProtectedRoute || isAuthRoute)) {
      const role = await getRoleForUser(supabase, user.id, user.email)
      const home = homePathForRole(role)

      if (isAuthRoute) return NextResponse.redirect(new URL(home, req.url))
      if (role === 'admin' && isStudentRoute) {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      if (role === 'student' && isAdminRoute) {
        return NextResponse.redirect(new URL('/student', req.url))
      }
    }

    return res
  } catch (err) {
    console.error('[middleware]', err)
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next({ request: req })
  }
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|.*\\..*).*)'],
}

/** Next.js 16+ alias — same handler as `middleware` */
export { middleware as proxy }
