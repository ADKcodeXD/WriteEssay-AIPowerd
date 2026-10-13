import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { buildApi } from '../../scripts/build-worker-api.mjs'

let apiFetch, consumeJobs, calls, mockHandler
const originalFetch = globalThis.fetch
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } })
const env = {
  SUPABASE_URL: 'https://fixture.supabase.co', SUPABASE_KEY: 'server-test-key', SUPABASE_ANON_KEY: 'public-test-key',
  CACHE: { get: async () => null, put: async () => {} }, JOBS: { send: async () => {} },
}
const ctx = { waitUntil: promise => promise.catch(() => {}) }
const request = (path, body, token) => new Request(`https://example.com/api${path}`, {
  method: body === undefined ? 'GET' : 'POST',
  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
})
before(async () => {
  await buildApi('.cloudflare/test-api.mjs')
  ;({ apiFetch, consumeJobs } = await import(pathToFileURL(resolve('.cloudflare/test-api.mjs'))))
  globalThis.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url)
    calls.push(url)
    if (!['fixture.supabase.co', 'generativelanguage.googleapis.com'].includes(url.hostname)) throw new Error('Unexpected network request in test')
    return mockHandler(url, init)
  }
})
after(() => { globalThis.fetch = originalFetch })
beforeEach(() => {
  calls = []
  mockHandler = url => {
    if (url.pathname === '/auth/v1/user') return json({ id: 'user-1', app_metadata: { role: 'member' } })
    if (url.pathname === '/rest/v1/article') return json([{ id: 10, article_title: 'Fixture essay' }], 200, { 'Content-Range': '0-0/398' })
    throw new Error(`Unexpected path ${url.pathname}`)
  }
})
test('public article listing keeps the original response contract', async () => {
  const response = await apiFetch(request('/essay/getList', { page: 1, pageSize: 1 }), env, ctx)
  assert.equal(response.status, 200)
  const result = await response.json()
  assert.equal(result.data.count, 398)
  assert.equal(result.data.rows[0].article_title, 'Fixture essay')
  assert.equal(result.data.rows[0].isWrited, false)
})
test('malformed JSON is rejected before database access', async () => {
  const response = await apiFetch(request('/essay/getList', '{invalid'), env, ctx)
  assert.equal(response.status, 400)
  assert.equal(calls.length, 0)
})
test('unauthenticated mutation and AI calls are rejected', async () => {
  for (const path of ['/essay/create', '/essay/question/relate', '/users/updateProfile', '/aiproxy/getResult']) {
    assert.equal((await apiFetch(request(path, {}), env, ctx)).status, 401)
  }
  assert.equal(calls.length, 0)
})
test('ordinary users cannot execute administrator mutations', async () => {
  assert.equal((await apiFetch(request('/essay/create', {}, 'token'), env, ctx)).status, 403)
  assert.equal(calls.length, 1)
})
test('rating IDs cannot disclose another user\'s records', async () => {
  mockHandler = url => url.pathname === '/auth/v1/user'
    ? json({ id: 'user-1', app_metadata: {} })
    : json({ id: 10, user_uuid: 'user-2', record_output: { private: true } })
  const response = await apiFetch(request('/aiproxy/getRateLogById?id=10', undefined, 'token'), env, ctx)
  assert.equal(response.status, 404)
  assert.doesNotMatch(await response.text(), /private|user-2/)
})
test('Supabase failure produces an error rather than empty success', async () => {
  mockHandler = () => json({ message: 'database unavailable' }, 503)
  const response = await apiFetch(request('/essay/getList', {}), env, ctx)
  assert.equal(response.status, 500)
  assert.doesNotMatch(await response.text(), /server-test-key/)
})
test('completed enrichment is acknowledged without another AI call', async () => {
  mockHandler = () => json({ id: 10, article_shortcut: { 'zh-CN': 'Already done' } })
  let ack = 0, retry = 0
  await consumeJobs({ messages: [{ id: 'job-1', body: { name: 'generateShortCut', data: { id: 10, article_title: 'Example' } }, ack() { ack++ }, retry() { retry++ } }] }, env)
  assert.equal(ack, 1)
  assert.equal(retry, 0)
  assert.equal(calls.length, 1)
})
test('failed enrichment is retried, not silently acknowledged', async () => {
  mockHandler = () => json({ message: 'database unavailable' }, 503)
  let ack = 0, retry = 0
  await consumeJobs({ messages: [{ id: 'job-2', body: { name: 'pickTags', data: { id: 10, article_title: 'Example' } }, ack() { ack++ }, retry() { retry++ } }] }, env)
  assert.equal(ack, 0)
  assert.equal(retry, 1)
})
test('AI continuation uses native fetch and awaits usage persistence', async () => {
  let saved = false, deducted = false
  mockHandler = async (url, init) => {
    if (url.pathname === '/auth/v1/user') return json({ id: 'user-1', app_metadata: {} })
    if (url.pathname === '/rest/v1/users') return json({ id: 1, user_uuid: 'user-1', normal_quota: 1000, high_quota: 1000 })
    if (url.hostname === 'generativelanguage.googleapis.com') {
      assert.equal(url.pathname, '/v1beta/models/gemini-3.8-flash:generateContent')
      const payload = JSON.parse(init.body)
      assert.ok(payload.contents.some(message => message.parts.some(part => String(part.text).includes('A useful beginning'))))
      return json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ continueContent: 'A useful continuation.' }) }] } }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 } })
    }
    if (url.pathname === '/rest/v1/modeloutputrecord') {
      assert.deepEqual(JSON.parse(init.body).usage, { inputTokens: 10, outputTokens: 5, totalTokens: 15 })
      await new Promise(resolve => setTimeout(resolve, 20))
      saved = true
      return json([{ id: 99, ...JSON.parse(init.body) }])
    }
    if (url.pathname === '/rest/v1/rpc/deduct_user_normal_quota') {
      assert.equal(JSON.parse(init.body).p_tokens, 15)
      deducted = true
      return json(null)
    }
    throw new Error(`Unexpected path: ${url.pathname}`)
  }
  const response = await apiFetch(request('/aiproxy/continueWriting', { title: 'Test', context: 'A useful beginning', grade: 'ielts', model: 'gpt-4o-mini' }, 'token'), { ...env, GEMINI_API_KEY: 'mock-key' }, ctx)
  assert.equal(response.status, 200)
  assert.equal((await response.json()).data.continueContent, 'A useful continuation.')
  assert.equal(saved, true)
  assert.equal(deducted, true)
})

test('administrators can rotate the encrypted Gemini setting without reading the key', async () => {
  const store = new Map()
  mockHandler = url => url.pathname === '/auth/v1/user'
    ? json({ id: 'admin-1', app_metadata: { role: 'admin' } })
    : (() => { throw new Error(`Unexpected path: ${url.pathname}`) })()
  const settingsEnv = {
    ...env,
    AI_SETTINGS_ENCRYPTION_KEY: 'test-encryption-secret',
    CACHE: {
      get: async (_key, type) => type === 'json' ? (store.has('settings:ai') ? JSON.parse(store.get('settings:ai')) : null) : null,
      put: async (_key, value) => store.set('settings:ai', value),
    },
  }
  const response = await apiFetch(request('/admin/ai-settings', { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-test-model', apiKey: 'test-gemini-key' }, 'token'), settingsEnv, ctx)
  assert.equal(response.status, 200)
  const saved = await response.json()
  assert.equal(saved.data.keyConfigured, true)
  assert.equal(saved.data.model, 'gemini-test-model')
  assert.match(saved.data.keyHint, /key$/)
  assert.doesNotMatch(JSON.stringify(saved), /test-gemini-key/)
  assert.doesNotMatch(store.get('settings:ai'), /test-gemini-key/)
  const loaded = await apiFetch(request('/admin/ai-settings', undefined, 'token'), settingsEnv, ctx)
  assert.equal(loaded.status, 200)
  assert.equal((await loaded.json()).data.keyHint, saved.data.keyHint)
  const retained = await apiFetch(request('/admin/ai-settings', { apiKey: '' }, 'token'), settingsEnv, ctx)
  assert.equal(retained.status, 200)
  assert.equal((await retained.json()).data.keyHint, saved.data.keyHint)
  mockHandler = (url, init) => {
    if (url.pathname === '/auth/v1/user') return json({ id: 'admin-1', app_metadata: { role: 'admin' } })
    if (url.pathname === '/rest/v1/users') return json({ id: 1, user_uuid: 'admin-1', normal_quota: 1000, high_quota: 1000 })
    if (url.hostname === 'generativelanguage.googleapis.com') {
      assert.equal(init.headers['x-goog-api-key'], 'test-gemini-key')
      assert.equal(url.pathname, '/v1beta/models/gemini-test-model:generateContent')
      return json({ candidates: [{ content: { parts: [{ text: '{"continueContent":"Configured key works."}' }] } }] })
    }
    if (url.pathname === '/rest/v1/modeloutputrecord') return json([{ id: 1, ...JSON.parse(init.body) }])
    if (url.pathname === '/rest/v1/rpc/deduct_user_normal_quota') return json(null)
    throw new Error(`Unexpected path: ${url.pathname}`)
  }
  const generated = await apiFetch(request('/aiproxy/continueWriting', { context: 'Start', title: 'Test', model: 'grok-2-1212' }, 'token'), settingsEnv, ctx)
  assert.equal(generated.status, 200)
  assert.equal((await generated.json()).data.continueContent, 'Configured key works.')
})

test('invalid structured AI output is rejected before persistence or quota deduction', async () => {
  mockHandler = url => {
    if (url.pathname === '/auth/v1/user') return json({ id: 'user-1', app_metadata: {} })
    if (url.pathname === '/rest/v1/users') return json({ id: 1, user_uuid: 'user-1', normal_quota: 1000, high_quota: 1000 })
    if (url.hostname === 'generativelanguage.googleapis.com') return json({ candidates: [{ content: { parts: [{ text: '{"unexpected":true}' }] } }] })
    throw new Error(`Unexpected path: ${url.pathname}`)
  }
  const response = await apiFetch(request('/aiproxy/continueWriting', { context: 'Start' }, 'token'), { ...env, GEMINI_API_KEY: 'mock-key' }, ctx)
  assert.equal(response.status, 500)
  assert.equal(calls.some(url => url.pathname === '/rest/v1/modeloutputrecord' || url.pathname.includes('/rpc/')), false)
})
