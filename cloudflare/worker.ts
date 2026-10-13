// Generated before Wrangler bundles this entrypoint.
// @ts-ignore
import next from '../apps/english-learn-web/.open-next/worker.js'
// @ts-ignore
import { apiFetch, consumeJobs } from '../.cloudflare/api.mjs'
import type { Env, Job } from './context'

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url)
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return apiFetch(request, env, ctx)
    if (url.pathname === '/healthz') return apiFetch(request, env, ctx)
    if (url.pathname === '/public-config.js' || url.pathname === '/admin/public-config.js') {
      const publicConfig = { supabaseUrl: env.SUPABASE_URL, supabaseAnonKey: env.SUPABASE_ANON_KEY, apiBaseUrl: '/api' }
      return new Response(`window.__WRITEESSAY_CONFIG__=${JSON.stringify(publicConfig).replace(/</g, '\\u003c')};`, {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
      })
    }
    if (url.pathname === '/admin') return Response.redirect(`${url.origin}/admin/`, 302)
    if (url.pathname.startsWith('/admin/')) {
      const response = await env.ASSETS.fetch(request)
      if (response.status !== 404 || /\.[a-z0-9]+$/i.test(url.pathname)) return response
      url.pathname = '/admin/index.html'
      return env.ASSETS.fetch(new Request(url, request))
    }
    return next.fetch(request, env, ctx)
  },
  queue(batch: MessageBatch<Job>, env: Env) { return consumeJobs(batch, env) },
} satisfies ExportedHandler<Env>
