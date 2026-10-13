import { LocaleCode } from '@repo/entity-ts-definition'
import { BasePromptTemplate } from '../../registry/base-prompt'
import { ModelCapability } from '../../registry/model-capabilities'
import { PromptParams } from '../../registry/prompt-template'
import { ChatPromptTemplate } from '../../registry/chat-prompt'
import { langMap } from '../../englishWriteTemplate'
import { z } from 'zod'

/**
 * 翻译结果接口定义
 */
export const translateInterface = z.object({
  translatedContent: z.string().describe('The translated content'),
})

/**
 * 翻译Prompt模板
 */
export class TranslatePrompt extends BasePromptTemplate {
  constructor() {
    super('translate', '1.0.0', 'Content Translation', [
      ModelCapability.TEXT,
      ModelCapability.STRUCTURED_OUTPUT,
      ModelCapability.MULTILINGUAL,
    ])
  }

  async generatePrompt(params: PromptParams): Promise<ChatPromptTemplate> {
    const translationParams = params as { content: string; locale?: LocaleCode }

    // 创建基于变量的模板
    return ChatPromptTemplate.fromMessages([
      ['system', '{system_prompt}'],
      ['human', 'Please translate the following content to {language}: {content}'],
    ])
  }
}
