import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = process.env.APP_ORIGIN || url.origin
  const locale = /^\/(en|ja|zh-CN)\//.exec(url.pathname)?.[1] || 'en'
  const redirect = (path: string) => NextResponse.redirect(new URL(path, origin))
  const code = url.searchParams.get('code')
  const requestedNext = url.searchParams.get('next') || `/${locale}/broswer`
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//') && !/[\\\x00-\x20]/.test(requestedNext)
    ? requestedNext : `/${locale}/broswer`
  if (!code) return redirect(`/${locale}/auth/login`)
  const supabase = createClient()
  const { error, data } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.session?.access_token) return redirect(`/${locale}/auth/login`)
  const options = { path: '/', sameSite: 'lax' as const, secure: origin.startsWith('https://') }
  cookies().set('access_token', data.session.access_token, options)
  cookies().set('refresh_token', data.session.refresh_token || '', { ...options, httpOnly: true })
  try {
    const { data: user, error: profileError } = await supabase.from('users').select('user_name').eq('user_uuid', data.session.user.id).single()
    if (profileError) throw profileError
    if (!user?.user_name) return redirect(`/${locale}/auth/register?next=${encodeURIComponent(next)}`)
    return redirect(next)
  } catch {
    return redirect(`/${locale}/broswer`)
  }
}
