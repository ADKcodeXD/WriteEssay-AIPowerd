import { Injectable } from '@nestjs/common'
import { registeredPrompts } from './prompts'
import { BasePromptTemplate } from './registry/base-prompt'
import { ModelCapability } from './registry/model-capabilities'

@Injectable()
export class PromptService {
  private prompts: Map<string, BasePromptTemplate> = new Map()

  constructor() {
    // 初始化时注册所有预定义的prompts
    this.registerPrompts(registeredPrompts)
  }

  /**
   * 注册多个prompt模板
   * @param prompts 要注册的prompt模板数组
   */
  registerPrompts(prompts: BasePromptTemplate[]): void {
    for (const prompt of prompts) {
      this.registerPrompt(prompt)
    }
  }

  /**
   * 注册单个prompt模板
   * @param prompt 要注册的prompt模板
   */
  registerPrompt(prompt: BasePromptTemplate): void {
    const id = prompt.getName()
    if (this.prompts.has(id)) {
      console.warn(`Prompt with ID "${id}" is already registered. Overwriting...`)
    }
    this.prompts.set(id, prompt)
  }

  /**
   * 获取指定ID的prompt模板
   * @param promptId Prompt的唯一标识
   * @param params 提供给prompt的参数
   * @param capabilities 模型支持的能力
   * @param modelName 模型名称（可选）
   * @returns 处理后的prompt模板
   */
  async getPrompt(
    promptId: string,
    params: any,
    capabilities: ModelCapability[] = [],
    modelName?: string
  ): Promise<BasePromptTemplate> {
    const prompt = this.prompts.get(promptId)
    if (!prompt) {
      throw new Error(`Prompt with ID "${promptId}" not found`)
    }

    // 验证prompt所需的能力是否被模型支持
    const requiredCapabilities = prompt.getCapabilities()
    const missingCapabilities = this.checkMissingCapabilities(requiredCapabilities, capabilities)

    if (missingCapabilities.length > 0) {
      throw new Error(
        `Model ${modelName || 'unknown'} does not support required capabilities: ${missingCapabilities.join(', ')}`
      )
    }

    // 返回准备好的prompt模板
    return prompt
  }

  /**
   * 检查模型是否支持prompt所需的全部能力
   * @param required 模板所需的能力
   * @param available 模型支持的能力
   * @returns 模型不支持的能力列表
   */
  private checkMissingCapabilities(
    required: ModelCapability[],
    available: ModelCapability[]
  ): ModelCapability[] {
    return required.filter((capability) => !available.includes(capability))
  }

  /**
   * 获取所有已注册的prompt模板
   * @returns 已注册的prompt模板列表
   */
  getAllPrompts(): BasePromptTemplate[] {
    return Array.from(this.prompts.values())
  }

  /**
   * 获取具有特定能力的所有prompt模板
   * @param capability 所需的能力
   * @returns 具有指定能力的prompt模板列表
   */
  getPromptsByCapability(capability: ModelCapability): BasePromptTemplate[] {
    return Array.from(this.prompts.values()).filter((prompt) =>
      prompt.getCapabilities().includes(capability)
    )
  }
}
