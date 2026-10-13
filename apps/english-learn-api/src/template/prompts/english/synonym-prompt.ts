import { BasePromptTemplate } from '../../registry/base-prompt'
import { ModelCapability } from '../../registry/model-capabilities'
import { PromptParams } from '../../types/prompt-params'
import { ChatPromptTemplate } from '../../registry/chat-prompt'
import { IELTS_SYNONYM_TEMPLATE } from '../../template'
import { AiRateParams } from '@repo/entity-ts-definition'
import { langMap } from '../../englishWriteTemplate'

/**
 * 同义词分析Prompt模板
 */
export class SynonymAnalysisPrompt extends BasePromptTemplate {
  constructor() {
    super(
      'synonym-analysis',
      '1.0.0',
      'Analyzes an essay and provides synonyms for key words with context and explanations',
      [ModelCapability.TEXT, ModelCapability.STRUCTURED_OUTPUT, ModelCapability.MULTILINGUAL]
    )
  }

  generatePrompt(params: PromptParams): ChatPromptTemplate {
    const rateParams = params as AiRateParams

    let promptTemplate = IELTS_SYNONYM_TEMPLATE.CHATGPT

    return ChatPromptTemplate.fromMessages([
      ['system', promptTemplate],
      [
        'human',
        `Your output results need to be internationalized, and this time you need to present them in ${langMap[rateParams.locale || 'zh-CN']}`,
      ],
      [
        'human',
        `The essay topic is ${rateParams.title}, The essay content is ${rateParams.content}`,
      ],
    ])
  }
}
