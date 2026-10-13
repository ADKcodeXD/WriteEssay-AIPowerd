import { BasePromptTemplate } from '../../registry/base-prompt'
import { ModelCapability } from '../../registry/model-capabilities'
import { PromptParams } from '../../types/prompt-params'
import { ChatPromptTemplate } from '../../registry/chat-prompt'
import { IELTS_EXTRACT_GOOD_WORDS_AND_SENTENCE_TEMPLATE } from '../../template'
import { AiRateParams } from '@repo/entity-ts-definition'

/**
 * 提取好词好句Prompt模板
 */
export class ExtractGoodWordsPrompt extends BasePromptTemplate {
  constructor() {
    super(
      'extract-good-words',
      '1.0.0',
      'Extracts good words and sentences from an essay with explanations',
      [ModelCapability.TEXT, ModelCapability.STRUCTURED_OUTPUT]
    )
  }

  async generatePrompt(params: PromptParams): Promise<ChatPromptTemplate> {
    const rateParams = params as AiRateParams

    // 获取系统提示模板
    const systemPrompt = IELTS_EXTRACT_GOOD_WORDS_AND_SENTENCE_TEMPLATE.CHATGPT

    // 创建基于变量的模板
    return ChatPromptTemplate.fromMessages([
      ['system', '{system_prompt}'],
      ['human', 'The essay content is: {content}'],
    ])
  }
}
