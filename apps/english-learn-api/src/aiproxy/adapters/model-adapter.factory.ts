import { Injectable } from '@nestjs/common'
import { ModelAdapter, ModelAdapterFactory } from './model-adapter.interface'

@Injectable()
export class DefaultModelAdapterFactory implements ModelAdapterFactory {
  private adapters: ModelAdapter[] = []

  registerAdapter(adapter: ModelAdapter): void {
    this.adapters.push(adapter)
  }

  getAdapter(model: string): ModelAdapter {
    const adapter = this.adapters.find((adapter) => adapter.isModelSupported(model))
    if (!adapter) {
      throw new Error(`No adapter found for model: ${model}`)
    }
    return adapter
  }
}
