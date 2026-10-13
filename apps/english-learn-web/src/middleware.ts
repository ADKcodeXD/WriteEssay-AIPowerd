import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

export function stackMiddlewares(functions: any[] = [], index = 0) {
  const current = functions[index]
  if (current) {
    const next: any = stackMiddlewares(functions, index + 1)
    return current(next)
  }
  return () => NextResponse.next()
}

async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/',
    '/(en|zh-CN|ja)/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|aff|dic)$).*)',
  ],
}

export default stackMiddlewares([() => createMiddleware(routing)])
