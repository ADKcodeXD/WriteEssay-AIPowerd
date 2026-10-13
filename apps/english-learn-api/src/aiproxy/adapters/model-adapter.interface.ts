import { AILLMModel, Tables } from '@repo/entity-ts-definition'
import { ModelCapabilities, ModelCapability } from '../../template/registry/model-capabilities'

export interface ModelAdapterConfig {
  model: string
  temperature: number
  maxTokens: number
  timeout?: number
  cache?: boolean
  images?: string[]
}

export interface ModelAdapter {
  initialize(config: ModelAdapterConfig): void
  createModelInvoker(): any
  getSupportedModels(): AILLMModel[]
  isModelSupported(model: string): boolean

  hasCapability(capability: ModelCapability): boolean

  getCapabilities(): ModelCapabilities
}

export interface ModelAdapterFactory {
  getAdapter(model: string): ModelAdapter
  registerAdapter(adapter: ModelAdapter): void
}
