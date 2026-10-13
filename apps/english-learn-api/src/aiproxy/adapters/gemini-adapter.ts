import { Injectable } from '@nestjs/common'
import { AILLMModel, DEFAULT_AI_MODEL } from '@repo/entity-ts-definition'
import { zodToJsonSchema } from 'zod-to-json-schema'
import configuration from 'src/config/configuration'
import { ModelAdapter, ModelAdapterConfig } from './model-adapter.interface'
import { ModelCapabilities, ModelCapability } from '../../template/registry/model-capabilities'

const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

type GeminiMessage = { role?: string; content?: unknown; _getType?: () => string }

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  const chunk = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunk, bytes.length)))
  }
  return btoa(binary)
}

async function imagePart(url: string) {
  const dataUrl = url.match(/^data:([^;]+);base64,(.+)$/s)
  if (dataUrl) return { inlineData: { mimeType: dataUrl[1], data: dataUrl[2] } }
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Image fetch failed with status ${response.status}`)
  const mimeType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg'
  const data = bytesToBase64(new Uint8Array(await response.arrayBuffer()))
  return { inlineData: { mimeType, data } }
}

async function partsFromContent(content: unknown): Promise<any[]> {
  if (typeof content === 'string') return [{ text: content }]
  if (!Array.isArray(content)) return [{ text: String(content ?? '') }]

  const parts: any[] = []
  for (const part of content) {
    if (Array.isArray(part)) {
      parts.push(...await partsFromContent(part))
      continue
    }
    if (typeof part === 'string') {
      parts.push({ text: part })
      continue
    }
    if (part?.type === 'text') {
      parts.push({ text: part.text || '' })
      continue
    }
    if (part?.type === 'image_url') {
      const url = typeof part.image_url === 'string' ? part.image_url : part.image_url?.url
      if (url) parts.push(await imagePart(url))
    }
  }
  return parts
}

async function toGeminiMessages(messages: GeminiMessage[]) {
  let systemInstruction = ''
  const contents: { role: 'user' | 'model'; parts: any[] }[] = []
  for (const message of messages || []) {
    const kind = message._getType?.() || message.role || 'user'
    const parts = await partsFromContent(message.content)
    if (kind === 'system') {
      systemInstruction += `${systemInstruction ? '\n\n' : ''}${parts.map((part) => part.text || '').join('')}`
      continue
    }
    const role = kind === 'ai' || kind === 'assistant' || kind === 'model' ? 'model' : 'user'
    const previous = contents[contents.length - 1]
    if (previous?.role === role) previous.parts.push(...parts)
    else contents.push({ role, parts })
  }
  return { systemInstruction, contents }
}

function cleanSchema(value: any): any {
  if (Array.isArray(value)) return value.map(cleanSchema)
  if (!value || typeof value !== 'object') return value
  const result: Record<string, any> = {}
  for (const [key, child] of Object.entries(value)) {
    if (key === '$schema' || key === '$id' || key === 'additionalProperties') continue
    result[key] = cleanSchema(child)
  }
  return result
}

function parseJsonOutput(text: string) {
  const normalized = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  try {
    return JSON.parse(normalized)
  } catch {
    throw new Error('Gemini returned invalid structured JSON')
  }
}

@Injectable()
export class GeminiAdapter implements ModelAdapter {
  private config!: ModelAdapterConfig
  private readonly supportedModels: AILLMModel[] = [DEFAULT_AI_MODEL]

  initialize(config: ModelAdapterConfig): void {
    this.config = { ...config, model: DEFAULT_AI_MODEL }
  }

  createModelInvoker(): any {
    const adapterConfig = this.config
    return {
      withStructuredOutput: (schema: any) => ({
        invoke: async (messages: GeminiMessage[]) => {
          const runtime = configuration()
          const apiKey = runtime.geminiApiKey || runtime.gptApiKey
          if (!apiKey) throw new Error('Gemini API key is not configured')
          const baseUrl = (runtime.geminiBaseUrl || DEFAULT_GEMINI_BASE_URL).replace(/\/+$/, '')
          const endpoint = /:generateContent$/.test(baseUrl)
            ? baseUrl
            : `${baseUrl}/models/${runtime.aiModel || DEFAULT_AI_MODEL}:generateContent`
          const prompt = await toGeminiMessages(messages)
          const response = await fetch(endpoint, {
            method: 'POST',
            signal: AbortSignal.timeout(adapterConfig.timeout || 60000),
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              ...(prompt.systemInstruction
                ? { systemInstruction: { parts: [{ text: prompt.systemInstruction }] } }
                : {}),
              contents: prompt.contents,
              generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: cleanSchema(zodToJsonSchema(schema)),
                maxOutputTokens: adapterConfig.maxTokens,
              },
            }),
          })
          if (!response.ok) throw new Error(`Gemini API returned ${response.status}`)
          const payload = await response.json() as any
          const text = payload.candidates?.[0]?.content?.parts
            ?.filter((part: any) => !part.thought)
            .map((part: any) => part.text || '')
            .join('')
          if (!text) throw new Error('Gemini response did not contain model output')
          return {
            parsed: schema.parse(parseJsonOutput(text)),
            raw: {
              response_metadata: {
                usage_metadata: {
                  input_tokens: payload.usageMetadata?.promptTokenCount || 0,
                  output_tokens: payload.usageMetadata?.candidatesTokenCount || 0,
                  total_tokens: payload.usageMetadata?.totalTokenCount || 0,
                },
              },
            },
          }
        },
      }),
    }
  }

  getSupportedModels(): AILLMModel[] { return this.supportedModels }
  isModelSupported(model: string): boolean { return model === DEFAULT_AI_MODEL }
  hasCapability(capability: ModelCapability): boolean {
    return [ModelCapability.TEXT, ModelCapability.IMAGE, ModelCapability.STRUCTURED_OUTPUT,
      ModelCapability.CODE, ModelCapability.MULTILINGUAL].includes(capability)
  }
  getCapabilities(): ModelCapabilities {
    return [ModelCapability.TEXT, ModelCapability.IMAGE, ModelCapability.STRUCTURED_OUTPUT,
      ModelCapability.CODE, ModelCapability.MULTILINGUAL]
  }
}
