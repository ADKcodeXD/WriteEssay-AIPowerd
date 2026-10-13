import { ChatPromptTemplate } from './chat-prompt'
import { ModelCapabilities } from './model-capabilities'
import {
  AiRateParams,
  ContinueWritingParams,
  LocaleCode,
  PolishSentenceParams,
} from '@repo/entity-ts-definition'

/**
 * Prompt支持的参数类型
 */
export type PromptParams =
  | AiRateParams // 评分参数
  | ContinueWritingParams // 续写参数
  | PolishSentenceParams // 润色参数
  | { content: string; locale?: LocaleCode } // 翻译参数
  | { title: string } // 标题相关参数
  | { title: string; tags: string } // 标签相关参数
  | Record<string, any> // 其他参数类型

/**
 * Prompt模板接口定义
 */
export interface PromptTemplate {
  /**
   * 模板唯一标识
   */
  id: string

  /**
   * 模板版本
   */
  version: string

  /**
   * 模板名称
   */
  name: string

  /**
   * 模板描述
   */
  description: string

  /**
   * 模板所需的模型能力
   */
  requiredCapabilities: ModelCapabilities

  /**
   * 生成Prompt模板
   * @param params 参数
   * @returns ChatPromptTemplate
   */
  generatePrompt(params: PromptParams): Promise<ChatPromptTemplate>

  /**
   * 判断该模板是否支持图片
   */
  supportsImages(): boolean

  /**
   * 处理图片处理逻辑
   * @param images 图片URL数组
   * @param modelType 模型类型，用于适配不同模型的图片处理
   * @returns 处理后的图片内容
   */
  processImages?(images: string[], modelType: string): Promise<any[]>
}
