import { AsyncLocalStorage } from 'node:async_hooks'

export interface Env {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_KEY: string
  GEMINI_API_KEY?: string
  GOOGLE_GEMINI_API_KEY?: string
  GEMINI_API_URL?: string
  AI_MODEL?: string
  AI_SETTINGS_ENCRYPTION_KEY?: string
  OPENAI_API_KEY?: string
  TEXT_GEARS_SECRET?: string
  GOOGLE_TRANSLATION_KEY?: string
  ASSETS: Fetcher
  CACHE: KVNamespace
  JOBS: Queue<Job>
  [key: string]: unknown
}
export interface Job { name: 'pickTags' | 'generateShortCut'; data: { id: number; article_title: string } }
export const requestScope = new AsyncLocalStorage<Env>()
export function currentEnv(): Env {
  const env = requestScope.getStore()
  if (!env) throw new Error('Worker request scope is not initialized')
  return env
}
