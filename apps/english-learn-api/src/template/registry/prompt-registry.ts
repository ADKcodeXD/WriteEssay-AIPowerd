import { PromptTemplate } from './prompt-template'
import { ModelCapabilities, hasRequiredCapabilities } from './model-capabilities'
import { Injectable } from '@nestjs/common'

/**
 * Prompt注册表 - 单例模式实现
 * 用于集中管理所有的Prompt模板
 */
@Injectable()
export class PromptRegistry {
  private static instance: PromptRegistry
  private templates: Map<string, PromptTemplate> = new Map()

  private constructor() {}

  /**
   * 获取PromptRegistry单例
   */
  public static getInstance(): PromptRegistry {
    if (!PromptRegistry.instance) {
      PromptRegistry.instance = new PromptRegistry()
    }
    return PromptRegistry.instance
  }

  /**
   * 注册Prompt模板
   * @param template Prompt模板
   */
  register(template: PromptTemplate): void {
    const key = this.getTemplateKey(template.id, template.version)
    this.templates.set(key, template)
  }

  /**
   * 获取指定ID和版本的Prompt模板
   * @param id 模板ID
   * @param version 模板版本，默认为'latest'
   * @returns 匹配的Prompt模板
   */
  get(id: string, version: string = 'latest'): PromptTemplate {
    if (version !== 'latest') {
      const key = this.getTemplateKey(id, version)
      if (this.templates.has(key)) {
        return this.templates.get(key)
      }
    }

    // 获取最新版本
    const templates = Array.from(this.templates.entries())
      .filter(([key]) => key.startsWith(`${id}@`))
      .sort((a, b) => {
        const versionA = a[0].split('@')[1]
        const versionB = b[0].split('@')[1]
        return this.compareVersions(versionB, versionA) // 降序
      })

    if (templates.length === 0) {
      throw new Error(`No template found with id: ${id}`)
    }

    return templates[0][1]
  }

  /**
   * 根据模型能力获取合适的Prompt模板
   * @param id 模板ID
   * @param modelCapabilities 模型能力
   * @param version 版本，默认为latest
   * @returns 适配的Prompt模板
   */
  getBestMatch(
    id: string,
    modelCapabilities: ModelCapabilities,
    version: string = 'latest'
  ): PromptTemplate {
    try {
      // 首先尝试精确匹配ID和版本
      const template = this.get(id, version)

      // 检查模板是否需要超出模型能力范围的能力
      if (hasRequiredCapabilities(modelCapabilities, template.requiredCapabilities)) {
        return template
      }

      // 如果精确匹配的模板不符合模型能力，尝试查找备选模板
      // 例如：如果原模板需要图像能力但模型不支持，寻找相同ID的纯文本版本
      const alternatives = Array.from(this.templates.entries())
        .filter(([key, t]) => {
          // 找到相同ID但不同版本的模板
          const templateId = key.split('@')[0]
          return (
            templateId === id && hasRequiredCapabilities(modelCapabilities, t.requiredCapabilities)
          )
        })
        .sort((a, b) => {
          // 优先选择能力要求最接近但不超过模型能力的模板
          const aCapCount = a[1].requiredCapabilities.length
          const bCapCount = b[1].requiredCapabilities.length
          return bCapCount - aCapCount // 降序，优先选择能力要求更多的
        })

      if (alternatives.length > 0) {
        return alternatives[0][1]
      }

      // 如果找不到适合的备选，抛出错误
      throw new Error(`No compatible template found for id: ${id} with given model capabilities`)
    } catch (error) {
      console.error(`Error finding template: ${error.message}`)
      throw error
    }
  }

  /**
   * 获取所有已注册的模板ID
   */
  getAllTemplateIds(): string[] {
    const ids = new Set<string>()
    for (const key of this.templates.keys()) {
      const id = key.split('@')[0]
      ids.add(id)
    }
    return Array.from(ids)
  }

  /**
   * 检查特定ID的模板是否存在
   */
  hasTemplate(id: string): boolean {
    return this.getAllTemplateIds().includes(id)
  }

  /**
   * 生成模板键名
   */
  private getTemplateKey(id: string, version: string): string {
    return `${id}@${version}`
  }

  /**
   * 比较版本字符串
   * @returns 负数表示a<b，0表示a=b，正数表示a>b
   */
  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number)
    const partsB = b.split('.').map(Number)

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = i < partsA.length ? partsA[i] : 0
      const partB = i < partsB.length ? partsB[i] : 0

      if (partA !== partB) {
        return partA - partB
      }
    }

    return 0
  }
}
