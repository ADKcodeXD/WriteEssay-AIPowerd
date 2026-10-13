import { createClient } from '@supabase/supabase-js'
import { ArticleService } from '../apps/english-learn-api/src/article/article.service'
import { TagService } from '../apps/english-learn-api/src/article/tag.service'
import { QuestionSetService } from '../apps/english-learn-api/src/article/questionset.service'
import { UsersService } from '../apps/english-learn-api/src/user/users.service'
import { RateLogService } from '../apps/english-learn-api/src/aiproxy/ratelog.service'
import { StatisticsService } from '../apps/english-learn-api/src/aiproxy/statistics.service'
import { ModelRecordService } from '../apps/english-learn-api/src/aiproxy/modeloutputrecord.service'
import { AiProxyService } from '../apps/english-learn-api/src/aiproxy/aiproxy.service'
import { PromptService } from '../apps/english-learn-api/src/template/prompt-service'
import type { Env, Job } from './context'

// Auth/quota data is deliberately request-local, never an eventually consistent KV cache.
class RequestCache {
  values = new Map<string, unknown>()
  async get(key: string) { return this.values.get(key) }
  async set(key: string, value: unknown) { this.values.set(key, value) }
  async del(key: string) { this.values.delete(key) }
  async delByPrefix(prefix: string) {
    for (const key of this.values.keys()) if (key.startsWith(prefix)) this.values.delete(key)
  }
}

export function createServices(env: Env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_KEY || !env.SUPABASE_ANON_KEY) throw new Error('Missing Supabase configuration')
  const db = createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const supabase = { supabseInstance: db } as any
  const cache = new RequestCache() as any
  const records = new ModelRecordService(supabase, cache)
  const rates = new RateLogService(supabase, cache)
  const queue = {
    async addJob(name: string, data: any) {
      // Financial/accounting writes finish before the HTTP response. They must
      // not be repeated by an at-least-once queue consumer.
      if (name === 'modelOutputRecord') {
        const saved = await records.recordModelOutput(data)
        if (!saved) throw new Error('Failed to persist model usage')
        return saved
      }
      if (name === 'rateLog') {
        const saved = await rates.recordRateLog(data)
        if (!saved) throw new Error('Failed to persist rating')
        return saved
      }
      if (name !== 'pickTags' && name !== 'generateShortCut') throw new Error('Unsupported job')
      await env.JOBS.send({ name, data: { id: data.id, article_title: data.article_title } })
    },
  } as any
  const http = { axiosRef: { async post(url: string, body: unknown) {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`)
    return { data: await response.json() }
  } } } as any
  return {
    db, cache, records, rates,
    articles: new ArticleService(supabase, queue),
    tags: new TagService(supabase),
    questions: new QuestionSetService(supabase, queue),
    users: new UsersService(supabase, cache),
    statistics: new StatisticsService(supabase),
    ai: new AiProxyService(http, queue, new PromptService()),
  }
}

export async function processJob(env: Env, job: Job) {
  if (!['pickTags', 'generateShortCut'].includes(job.name) || !Number.isInteger(job.data?.id)) throw new Error('Invalid job')
  const services = createServices(env)
  const { data: article, error } = await services.db.from('article').select('*').eq('id', job.data.id).single()
  if (error) throw error
  // Skip already completed enrichment on redelivery.
  if (job.name === 'pickTags') {
    if (article.article_tag?.length) return
    const { data: tags, error } = await services.db.from('tag').select('*').limit(100)
    if (error) throw error
    const result = await services.ai.pickTagsByTitle(article.article_title, tags as any)
    const saved = await services.db.from('article').update({ article_tag: result.tags }).eq('id', article.id)
    if (saved.error) throw saved.error
  } else {
    if (article.article_shortcut?.['zh-CN']) return
    const result = await services.ai.generateShortCutByTitle(article.article_title)
    const saved = await services.db.from('article').update({ article_shortcut: result }).eq('id', article.id)
    if (saved.error) throw saved.error
  }
}
