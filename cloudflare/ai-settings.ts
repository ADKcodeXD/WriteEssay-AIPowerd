import type { Env } from './context'

export const AI_SETTINGS_KEY = 'settings:ai'
export const DEFAULT_GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta'
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash'

type StoredSettings = {
  baseUrl: string
  model?: string
  apiKeyCiphertext?: string
  apiKey?: string // read once for backwards-compatible migration
  updatedAt: string
}

export type AiSettingsInput = { baseUrl?: unknown; apiKey?: unknown; model?: unknown }
export type ResolvedAiSettings = {
  baseUrl: string
  model: string
  apiKey: string
  updatedAt?: string
}

function normalizeModel(value: unknown) {
  const model = String(value || DEFAULT_GEMINI_MODEL).trim()
  if (!/^gemini-[a-z0-9.-]{1,100}$/.test(model)) throw new Error('Model must be a Gemini model ID')
  return model
}

function normalizeBaseUrl(value: unknown) {
  const input = String(value || DEFAULT_GEMINI_API_URL).trim().replace(/\/+$/, '')
  let url: URL
  try { url = new URL(input) } catch { throw new Error('AI URL must be a valid URL') }
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  if (!local && url.protocol !== 'https:') throw new Error('AI URL must use HTTPS')
  if (url.username || url.password || url.search || url.hash) throw new Error('AI URL cannot contain credentials or query parameters')
  return url.toString().replace(/\/+$/, '')
}

function encode(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function decode(value: string) {
  const binary = atob(value)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

async function cryptoKey(secret: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

async function encrypt(value: string, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await cryptoKey(secret), new TextEncoder().encode(value))
  return `${encode(iv)}.${encode(new Uint8Array(ciphertext))}`
}

async function decrypt(value: string, secret: string) {
  const [iv, ciphertext] = value.split('.')
  if (!iv || !ciphertext) throw new Error('Invalid encrypted AI setting')
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(iv) }, await cryptoKey(secret), decode(ciphertext))
  return new TextDecoder().decode(plain)
}

async function readStored(env: Env): Promise<StoredSettings | null> {
  if (!env.CACHE) return null
  return await env.CACHE.get(AI_SETTINGS_KEY, 'json') as StoredSettings | null
}

export async function loadAiSettings(env: Env): Promise<ResolvedAiSettings> {
  const stored = await readStored(env)
  let apiKey = ''
  if (stored?.apiKeyCiphertext && env.AI_SETTINGS_ENCRYPTION_KEY) {
    try { apiKey = await decrypt(stored.apiKeyCiphertext, env.AI_SETTINGS_ENCRYPTION_KEY) } catch { /* fall back to the Worker secret */ }
  } else if (stored?.apiKey && env.AI_SETTINGS_ENCRYPTION_KEY) {
    // Migrate a pre-encryption value on the next admin save; do not expose it.
    apiKey = stored.apiKey
  }
  return {
    model: normalizeModel(stored?.model || env.AI_MODEL),
    baseUrl: normalizeBaseUrl(stored?.baseUrl || env.GEMINI_API_URL || DEFAULT_GEMINI_API_URL),
    apiKey: apiKey || env.GEMINI_API_KEY || env.GOOGLE_GEMINI_API_KEY || env.OPENAI_API_KEY || '',
    updatedAt: stored?.updatedAt,
  }
}

export async function saveAiSettings(env: Env, input: AiSettingsInput) {
  if (!env.CACHE) throw new Error('AI settings storage is not configured')
  if (!env.AI_SETTINGS_ENCRYPTION_KEY) throw new Error('AI_SETTINGS_ENCRYPTION_KEY is required to save an AI key')
  const current = await loadAiSettings(env)
  const baseUrl = normalizeBaseUrl(input.baseUrl || current.baseUrl)
  const model = normalizeModel(input.model || current.model)
  const providedKey = typeof input.apiKey === 'string' ? input.apiKey.trim() : ''
  if (providedKey.length > 4096) throw new Error('AI key is too long')
  const apiKey = providedKey || current.apiKey
  if (!apiKey) throw new Error('AI key is required')
  const updatedAt = new Date().toISOString()
  const stored: StoredSettings = {
    baseUrl,
    model,
    apiKeyCiphertext: await encrypt(apiKey, env.AI_SETTINGS_ENCRYPTION_KEY),
    updatedAt,
  }
  await env.CACHE.put(AI_SETTINGS_KEY, JSON.stringify(stored))
  return { baseUrl, model, updatedAt, keyConfigured: true, keyHint: `••••••••${apiKey.slice(-4)}` }
}

export function publicAiSettings(settings: ResolvedAiSettings) {
  return {
    baseUrl: settings.baseUrl,
    model: settings.model,
    keyConfigured: Boolean(settings.apiKey),
    keyHint: settings.apiKey ? `••••••••${settings.apiKey.slice(-4)}` : '',
    updatedAt: settings.updatedAt || null,
  }
}
