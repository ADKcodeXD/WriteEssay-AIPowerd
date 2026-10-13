import { DEFAULT_AI_MODEL, Model, TokenUsage } from '@repo/entity-ts-definition'

export interface ModelConfig {
  inputPrice: number
  outputPrice: number
  quotaType: 'standard' | 'advanced'
  inputWeight: number
  outputWeight: number
  tokenMapping?: { input: string; output: string; total?: string }
}

export type ModelConfigMap = Partial<Record<Model, ModelConfig>>

// Only the canonical server model is configured for runtime use. Historical
// model names are intentionally absent; existing database rows still receive
// the neutral fallback below when their usage is displayed or recalculated.
export const MODEL_CONFIGS: ModelConfigMap = {
  [DEFAULT_AI_MODEL]: {
    inputPrice: 0,
    outputPrice: 0,
    quotaType: 'standard',
    inputWeight: 1,
    outputWeight: 1,
    // GeminiAdapter normalizes usage metadata to the shared snake_case shape
    // consumed by ModelRecordService.
    tokenMapping: { input: 'input_tokens', output: 'output_tokens', total: 'total_tokens' },
  },
  google: { inputPrice: 0, outputPrice: 0, quotaType: 'standard', inputWeight: 1, outputWeight: 1 },
  youdao: { inputPrice: 0, outputPrice: 0, quotaType: 'standard', inputWeight: 1, outputWeight: 1 },
  textgears: { inputPrice: 0, outputPrice: 0, quotaType: 'standard', inputWeight: 1, outputWeight: 1 },
  deepl: { inputPrice: 0, outputPrice: 0, quotaType: 'standard', inputWeight: 1, outputWeight: 1 },
  baidu: { inputPrice: 0, outputPrice: 0, quotaType: 'standard', inputWeight: 1, outputWeight: 1 },
}

const fallback: ModelConfig = {
  inputPrice: 0,
  outputPrice: 0,
  quotaType: 'standard',
  inputWeight: 1,
  outputWeight: 1,
}

export function calculateModelPrice(model: Model, usage?: TokenUsage) {
  const config = MODEL_CONFIGS[model] || fallback
  const price = usage
    ? (usage.inputTokens * config.inputPrice) / 1_000_000 + (usage.outputTokens * config.outputPrice) / 1_000_000
    : 0
  return { price, quotaType: config.quotaType }
}

export function calculateTokenUsageByModel(model: Model, usage: TokenUsage): TokenUsage {
  const config = MODEL_CONFIGS[model] || fallback
  const inputTokens = usage.inputTokens * config.inputWeight
  const outputTokens = usage.outputTokens * config.outputWeight
  return { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens }
}

export function normalizeTokenUsage(model: Model, rawUsage: any): TokenUsage {
  if (!rawUsage) return { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
  const mapping = MODEL_CONFIGS[model]?.tokenMapping || MODEL_CONFIGS[DEFAULT_AI_MODEL]?.tokenMapping
  if (!mapping) return { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
  const inputTokens = Number(rawUsage[mapping.input] || 0)
  const outputTokens = Number(rawUsage[mapping.output] || 0)
  return {
    inputTokens,
    outputTokens,
    totalTokens: Number(rawUsage[mapping.total || ''] || inputTokens + outputTokens),
  }
}
