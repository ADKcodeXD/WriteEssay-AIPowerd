import { BasePromptTemplate } from '../../registry/base-prompt'
import { ModelCapability } from '../../registry/model-capabilities'
import { PromptParams } from '../../types/prompt-params'
import { ChatPromptTemplate } from '../../registry/chat-prompt'
import {
  IELTS_POLISH_SENTENCE_TEMPLATE,
  SYSTEM_PROMPT_TEMPLATE_POLISH_SENTENCE,
} from '../../template'
import { AiRateParams, PolishSentenceParams } from '@repo/entity-ts-definition'
import { langMap } from '../../englishWriteTemplate'

/**
 * 单句润色Prompt模板
 */
export class PolishSentencePrompt extends BasePromptTemplate {
  constructor() {
    super('polish-sentence', '1.0.0', 'Polishes a single sentence to improve writing quality', [
      ModelCapability.TEXT,
      ModelCapability.STRUCTURED_OUTPUT,
    ])
  }

  generatePrompt(params: PromptParams): ChatPromptTemplate {
    const polishParams = params as PolishSentenceParams

    // 创建基于变量的模板
    return ChatPromptTemplate.fromMessages([
      ['system', '{system_prompt}'],
      [
        'human',
        'The essay title is {title}, The origin sentence is {content}, please polish it to a good sentence',
      ],
    ])
  }
}

/**
 * 文章级别句子润色Prompt模板
 */
export class PolishSentenceEssayPrompt extends BasePromptTemplate {
  constructor() {
    super(
      'polish-sentence-essay',
      '1.0.0',
      'Polishes multiple sentences from an essay with detailed explanations',
      [ModelCapability.TEXT, ModelCapability.STRUCTURED_OUTPUT]
    )
  }

  async generatePrompt(params: PromptParams): Promise<ChatPromptTemplate> {
    const rateParams = params as AiRateParams

    // 创建基于变量的模板
    return ChatPromptTemplate.fromMessages([
      ['system', '{system_prompt}'],
      [
        'human',
        'The essay content is: {content}\nYour output results need to be internationalized, and this time you need to present them in {language}',
      ],
    ])
  }
}
