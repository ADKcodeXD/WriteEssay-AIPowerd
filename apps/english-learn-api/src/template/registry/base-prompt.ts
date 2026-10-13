import { ChatPromptTemplate } from './chat-prompt'
import { PromptParams } from '../types/prompt-params'
import { ModelCapability } from './model-capabilities'
import { BaseMessageFields, HumanMessage } from './chat-prompt'
import { langMap } from '../englishWriteTemplate'
import {
  IELTS_EXTRACT_GOOD_WORDS_AND_SENTENCE_TEMPLATE,
  IELTS_POLISH_SENTENCE_TEMPLATE,
  SYSTEM_PROMPT_TEMPLATE_CONTINUE_WRITING,
  SYSTEM_PROMPT_TEMPLATE_POLISH_SENTENCE,
} from '../template'

/**
 * 基础Prompt模板抽象类
 * 所有prompt模板都应该继承这个类
 */
export abstract class BasePromptTemplate {
  protected readonly name: string
  protected readonly version: string
  protected readonly description: string
  protected readonly capabilities: ModelCapability[]

  /**
   * 构造函数
   * @param name prompt模板的唯一名称
   * @param version 版本号
   * @param description 描述
   * @param capabilities 此prompt需要的模型能力
   */
  constructor(
    name: string,
    version: string,
    description: string,
    capabilities: ModelCapability[] = []
  ) {
    this.name = name
    this.version = version
    this.description = description
    this.capabilities = capabilities
  }

  /**
   * 获取prompt模板的名称
   * @returns prompt模板的名称
   */
  getName(): string {
    return this.name
  }

  /**
   * 获取prompt模板的版本
   * @returns prompt模板的版本
   */
  getVersion(): string {
    return this.version
  }

  /**
   * 获取prompt模板的描述
   * @returns prompt模板的描述
   */
  getDescription(): string {
    return this.description
  }

  /**
   * 获取prompt模板所需的模型能力
   * @returns 模型能力数组
   */
  getCapabilities(): ModelCapability[] {
    return this.capabilities
  }

  /**
   * 检查prompt模板是否需要特定的模型能力
   * @param capability 要检查的模型能力
   * @returns 是否需要此能力
   */
  hasCapability(capability: ModelCapability): boolean {
    return this.capabilities.includes(capability)
  }

  /**
   * 生成prompt消息
   * @param params prompt所需的参数
   * @returns 生成的prompt
   */
  abstract generatePrompt(params: PromptParams): Promise<ChatPromptTemplate> | ChatPromptTemplate

  /**
   * 处理管道操作，将此prompt与其他处理步骤链接
   * @param next 下一个处理步骤
   * @returns 组合后的处理器
   */
  pipe(next: any): any {
    return {
      invoke: async (params: PromptParams) => {
        try {
          // 获取ChatPromptTemplate
          const promptTemplate = await Promise.resolve(this.generatePrompt(params))
          // 确定系统提示模板
          let systemPrompt = params.system_prompt
          if (!systemPrompt) {
            // 根据prompt ID选择适当的系统提示
            if (this.name === 'polish-sentence') {
              systemPrompt = SYSTEM_PROMPT_TEMPLATE_POLISH_SENTENCE.CHATGPT
            } else if (this.name === 'polish-sentence-essay') {
              systemPrompt = IELTS_POLISH_SENTENCE_TEMPLATE.CHATGPT
            } else if (this.name === 'extract-good-words') {
              systemPrompt = IELTS_EXTRACT_GOOD_WORDS_AND_SENTENCE_TEMPLATE.CHATGPT
            } else if (this.name === 'continue-writing') {
              systemPrompt = SYSTEM_PROMPT_TEMPLATE_CONTINUE_WRITING.CHATGPT
            } else if (this.name === 'short-cut-title') {
              systemPrompt =
                'You are an AI assistant specialized in creating concise and engaging titles in multiple languages. Your task is to generate a shortened version of a title in English, Japanese, and Simplified Chinese. Keep the essential meaning while making it more concise.'
            } else if (this.name === 'pick-tags') {
              systemPrompt =
                'You are an AI assistant specialized in categorizing content with appropriate tags. Your task is to select the most relevant tags for an article based on its title. Select from the provided list of tags and return the IDs of the most appropriate ones.'
            } else if (this.name === 'translate') {
              systemPrompt =
                'You are a professional translator. Your task is to translate content accurately while preserving the original meaning and tone. Provide translations that are both linguistically correct and contextually appropriate.'
            }
          }

          // 准备模板变量
          const templateVariables = {
            system_prompt: systemPrompt || '',
            language: params.locale ? langMap[params.locale] || 'English' : 'English',
            title: params.title || '',
            content: params.content || '',
            context: params.context || '',
            grade: params.grade || '',
            tags: params.tags || '',
            ...params,
          }

          // 检查是否有图片需要处理
          if ((promptTemplate as any).hasImages && (promptTemplate as any).imageUrls) {
            // 特殊处理带图片的消息
            const formattedText = await promptTemplate.format(templateVariables)
            const imageUrls = (promptTemplate as any).imageUrls

            // 创建带图片的消息
            const messages = [
              { role: 'system', content: templateVariables.system_prompt },
              {
                role: 'human',
                content: [
                  { type: 'text', text: formattedText },
                  ...imageUrls.map((url) => ({
                    type: 'image_url',
                    image_url: { url },
                  })),
                ],
              },
            ]

            // 调用模型处理器
            return await next.invoke(messages)
          } else {
            // 标准处理：格式化消息
            const formattedMessages = await promptTemplate.formatMessages(templateVariables)

            // 调用模型处理器
            return await next.invoke(formattedMessages)
          }
        } catch (error) {
          console.error('Error in pipe method:', error)
          throw error
        }
      },
    }
  }

  /**
   * 是否支持图片处理
   */
  supportsImages(): boolean {
    return this.capabilities.includes(ModelCapability.IMAGE)
  }

  /**
   * 下载并转换图片为Base64
   * @param url 图片URL
   */
  protected async downloadAndConvertToBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Image fetch failed with status ${response.status}`)
      const bytes = new Uint8Array(await response.arrayBuffer())
      let binary = ''
      for (const byte of bytes) binary += String.fromCharCode(byte)
      return `data:${response.headers.get('content-type') || 'image/jpeg'};base64,${btoa(binary)}`
    } catch (error) {
      console.error(`Error downloading image from ${url}:`, error)
      return ''
    }
  }

  /**
   * 处理图片内容，根据不同模型类型转换为适当格式
   * @param images 图片URL数组
   * @param modelType 模型类型
   */
  async processImages(images: string[], modelType: string): Promise<any[]> {
    if (!this.supportsImages() || !images || images.length === 0) {
      return []
    }

    const processedImages = []
    for (const url of images) {
      const base64Image = await this.downloadAndConvertToBase64(url)
      if (base64Image) {
        // Gemini's native API accepts a data URL which the adapter converts
        // into an inlineData part before calling generateContent.
        processedImages.push({ type: 'image_url', image_url: base64Image })
      }
    }
    return processedImages
  }

  /**
   * 创建包含文本和图片的消息内容
   */
  protected async createMessageContent(
    textContent: string | string[],
    images?: string[],
    modelType?: string
  ): Promise<BaseMessageFields> {
    const textParts = Array.isArray(textContent)
      ? textContent.map((text) => ({ type: 'text', text }))
      : [{ type: 'text', text: textContent }]

    const content: any[] = [...textParts]

    // 处理图片
    if (images && images.length > 0 && this.supportsImages()) {
      const imageContent = await this.processImages(images, modelType || '')
      if (imageContent.length > 0) {
        content.push(...imageContent)
      }
    }

    return { content }
  }

  /**
   * 创建人类消息
   */
  protected async createHumanMessage(
    textContent: string | string[],
    images?: string[],
    modelType?: string
  ): Promise<HumanMessage> {
    const messageContent = await this.createMessageContent(textContent, images, modelType)
    return new HumanMessage(messageContent)
  }
}
