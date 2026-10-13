const origin = process.env.DEPLOY_URL
if (!origin || !/^https?:\/\//.test(origin)) throw new Error('DEPLOY_URL must be the deployed Worker origin')
let lastError
for (let attempt = 0; attempt < 18; attempt++) {
  try {
    const health = await fetch(`${origin}/healthz`, { signal: AbortSignal.timeout(15000) })
    if (!health.ok || (await health.json()).runtime !== 'cloudflare-workers') throw new Error('Worker health check failed')
    const page = await fetch(`${origin}/zh-CN/broswer`, { signal: AbortSignal.timeout(30000) })
    if (!page.ok || !(await page.text()).includes('__WRITEESSAY_CONFIG__')) throw new Error('Frontend smoke check failed')
    const api = await fetch(`${origin}/api/essay/getList`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: 1, pageSize: 1 }), signal: AbortSignal.timeout(15000),
    })
    const data = await api.json()
    if (!api.ok || data.code !== 200 || !Array.isArray(data.data?.rows)) throw new Error('Supabase smoke check failed')
    console.log('Worker, frontend and Supabase checks passed')
    process.exit(0)
  } catch (error) { lastError = error; await new Promise(resolve => setTimeout(resolve, 5000)) }
}
throw lastError
