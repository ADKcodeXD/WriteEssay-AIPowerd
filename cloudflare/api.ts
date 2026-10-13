import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { bodyLimit } from 'hono/body-limit'
import { createServices, processJob } from './services'
import { requestScope, type Env, type Job } from './context'
import { loadAiSettings, publicAiSettings, saveAiSettings } from './ai-settings'

type Services = ReturnType<typeof createServices>
const app = new Hono<{ Bindings: Env; Variables: { services: Services; user: any; token: string } }>()
const ok = (data: unknown) => ({ code: 200, message: 'Success', data })
app.use('*', bodyLimit({ maxSize: 256 * 1024 }))
app.get('/healthz', c => c.json({ status: 'ok', runtime: 'cloudflare-workers' }))
app.use('*', async (c, next) => {
  c.set('services', createServices(c.env))
  const token = /^Bearer\s+(.+)$/i.exec(c.req.header('Authorization') || '')?.[1]
  if (token && token !== 'undefined') {
    const { data, error } = await c.get('services').db.auth.getUser(token)
    if (error || !data.user) throw new HTTPException(401, { message: 'Invalid session' })
    c.set('user', data.user)
    c.set('token', token)
  }
  await next()
})
const auth = async (c: any, next: any) => {
  if (!c.get('user')) throw new HTTPException(401, { message: 'Please sign in' })
  await next()
}
const admin = async (c: any, next: any) => {
  if (!c.get('user')) throw new HTTPException(401)
  if (c.get('user').app_metadata?.role !== 'admin') throw new HTTPException(403, { message: 'Administrator required' })
  await next()
}
async function body(c: any) {
  try {
    const value = await c.req.json()
    if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error()
    if ('page' in value) value.page = Math.max(1, Math.floor(Number(value.page) || 1))
    if ('pageSize' in value) value.pageSize = Math.min(100, Math.max(1, Math.floor(Number(value.pageSize) || 10)))
    return value
  } catch { throw new HTTPException(400, { message: 'Expected a JSON object' }) }
}
function id(value: unknown) {
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < 1) throw new HTTPException(400, { message: 'Invalid ID' })
  return number
}
app.post('/essay/getList', async c => c.json(ok(await c.get('services').articles.getEssayListByPageQuery(await body(c), c.get('user')))))
app.post('/essay/getTagList', async c => {
  const params = await body(c)
  const key = `tags:${JSON.stringify(params)}`
  const cached = await c.env.CACHE.get(key, 'json')
  if (cached) return c.json(ok(cached))
  const tags = await c.get('services').tags.getTagList(params)
  if (!tags) throw new Error('Failed to load tags')
  c.executionCtx.waitUntil(c.env.CACHE.put(key, JSON.stringify(tags), { expirationTtl: 60 }))
  return c.json(ok(tags))
})
app.get('/essay/getEssayDetail', async c => c.json(ok(await c.get('services').articles.getEssayDetail(id(c.req.query('id')), c.get('user')))))
app.post('/essay/create', admin, async c => c.json(ok(await c.get('services').articles.createEssay(await body(c)))))
app.post('/essay/question/list', async c => c.json(ok(await c.get('services').questions.getQuestionSetList(await body(c), c.get('user')))))
app.post('/essay/question/detail', async c => c.json(ok(await c.get('services').questions.getQuestionDetail(id((await body(c)).questionId)))))
app.post('/essay/question/related', async c => c.json(ok(await c.get('services').questions.getRelatedArticles(id((await body(c)).questionId)))))
app.post('/essay/question/create', admin, async c => c.json(ok(await c.get('services').questions.createQuestion(await body(c), c.get('user')))))
app.post('/essay/question/update', admin, async c => {
  const params = await body(c); params.id = id(params.id)
  return c.json(ok(await c.get('services').questions.updateQuestion(params)))
})
for (const action of ['relate', 'unrelate'] as const) app.post(`/essay/question/${action}`, admin, async c => {
  const params = await body(c)
  const service = c.get('services').questions
  const result = action === 'relate'
    ? await service.createQuestionRelation(id(params.articleId), id(params.questionId))
    : await service.deleteQuestionRelation(id(params.articleId), id(params.questionId))
  return c.json(ok(result))
})
app.use('/users/*', auth)
app.post('/users/getProfile', async c => c.json(ok(await c.get('services').users.getUsersByUuidOrToken(c.get('user').id, c.get('token')))))
app.post('/users/updateProfile', async c => c.json(ok(await c.get('services').users.updateUserProfile(c.get('user').id, await body(c)))))
app.post('/users/logout', async c => {
  await c.get('services').db.auth.admin.signOut(c.get('token'), 'local')
  return c.json(ok(null))
})
app.use('/aiproxy/*', auth)
app.get('/admin/ai-settings', admin, async c => c.json(ok(publicAiSettings(await loadAiSettings(c.env)))))
app.put('/admin/ai-settings', admin, async c => {
  const params = await body(c)
  return c.json(ok(await saveAiSettings(c.env, params)))
})
app.post('/admin/ai-settings', admin, async c => {
  const params = await body(c)
  return c.json(ok(await saveAiSettings(c.env, params)))
})
app.get('/aiproxy/getRateLogByArticleId', async c => c.json(ok(await c.get('services').rates.getRateLogByArticleId(id(c.req.query('id')), c.get('user').id))))
app.get('/aiproxy/getRateLogById', async c => {
  const result = await c.get('services').rates.getRateLogById(id(c.req.query('id')))
  if (!result || result.user_uuid !== c.get('user').id) throw new HTTPException(404)
  return c.json(ok(result))
})
app.post('/aiproxy/getMyRateLog', async c => c.json(ok(await c.get('services').rates.getRateLogByUserId(await body(c), c.get('user').id))))
app.get('/aiproxy/getStatistics', async c => c.json(ok(await c.get('services').statistics.getEssayStatistics(c.get('user').id, c.req.query('grade') || 'ielts'))))
app.post('/aiproxy/getIncorrectWords', async c => {
  const params = await body(c)
  if (typeof params.content !== 'string' || params.content.length > 5000) throw new HTTPException(400)
  if (!c.env.TEXT_GEARS_SECRET) throw new HTTPException(503, { message: 'Spelling provider is not configured' })
  return c.json(ok(await c.get('services').ai.spellCheckByTextGears(params.content)))
})
for (const action of ['getResult', 'translate', 'polishSentence', 'continueWriting'] as const) app.post(`/aiproxy/${action}`, async c => {
  const params = await body(c)
  const inputText = action === 'continueWriting' ? params.context : params.content
  if (typeof inputText !== 'string' || inputText.length > 30000) throw new HTTPException(400)
  if (params.imageList && (!Array.isArray(params.imageList) || params.imageList.length > 2 || params.imageList.some((u: unknown) => typeof u !== 'string' || !u.startsWith(`${c.env.SUPABASE_URL}/storage/v1/object/`)))) throw new HTTPException(400, { message: 'Invalid image URL' })
  const services = c.get('services')
  const user = c.get('user')
  const key = c.env.GEMINI_API_KEY || c.env.GOOGLE_GEMINI_API_KEY || c.env.OPENAI_API_KEY
  if (!key) throw new HTTPException(503, { message: 'AI provider is not configured' })
  await services.users.getUsersByUuidOrToken(user.id)
  if (await services.records.checkQuota(user.id, 'gemini-3.8-flash') !== true) return c.json({ code: 402, message: 'USER_QUOTA_EXCEEDED', data: null }, 402)
  params.model = 'gemini-3.8-flash'
  const result = action === 'getResult' ? await services.ai.getResultByOpenAi(params, user)
    : action === 'polishSentence' ? await services.ai.polishSentence(params, user)
    : action === 'continueWriting' ? await services.ai.continueWriting(params, user)
    : await services.ai.translateByLLM(params, user)
  return c.json(ok(result))
})
app.onError((error, c) => {
  if (error instanceof HTTPException) return c.json({ code: error.status, message: error.message, data: null }, error.status)
  console.error('API request failed', c.req.path, error instanceof Error ? error.name : 'Error')
  return c.json({ code: 500, message: 'Request failed; check Worker logs and service configuration', data: null }, 500)
})
app.notFound(c => c.json({ code: 404, message: 'Not Found', data: null }, 404))

export async function apiFetch(request: Request, env: Env, ctx: ExecutionContext) {
  const url = new URL(request.url)
  url.pathname = url.pathname.replace(/^\/api(?=\/|$)/, '') || '/'
  const runtime = await loadAiSettings(env)
  const scopedEnv = { ...env, AI_MODEL: runtime.model, GEMINI_API_KEY: runtime.apiKey, GEMINI_API_URL: runtime.baseUrl }
  return requestScope.run(scopedEnv, () => app.fetch(new Request(url, request), scopedEnv, ctx))
}
export async function consumeJobs(batch: MessageBatch<Job>, env: Env) {
  const runtime = await loadAiSettings(env)
  const scopedEnv = { ...env, AI_MODEL: runtime.model, GEMINI_API_KEY: runtime.apiKey, GEMINI_API_URL: runtime.baseUrl }
  for (const message of batch.messages) {
    try {
      await requestScope.run(scopedEnv, () => processJob(scopedEnv, message.body))
      message.ack()
    } catch {
      console.error('Enrichment job failed', message.id, message.body?.name)
      message.retry({ delaySeconds: 30 })
    }
  }
}
