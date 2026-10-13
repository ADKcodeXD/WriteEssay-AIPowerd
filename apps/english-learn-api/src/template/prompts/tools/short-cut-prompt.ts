import { BasePromptTemplate } from '../../registry/base-prompt'
import { ModelCapability } from '../../registry/model-capabilities'
import { PromptParams } from '../../types/prompt-params'
import { ChatPromptTemplate } from '../../registry/chat-prompt'
import { ShortCutParams } from '../../types/prompt-params'

/**
 * 短标题生成Prompt模板
 */
export class ShortCutTitlePrompt extends BasePromptTemplate {
  constructor() {
    super(
      'short-cut-title',
      '1.0.0',
      'Generates short titles in multiple languages based on a given title',
      [ModelCapability.TEXT, ModelCapability.STRUCTURED_OUTPUT, ModelCapability.MULTILINGUAL]
    )
  }

  generatePrompt(params: PromptParams): ChatPromptTemplate {
    const shortCutParams = params as ShortCutParams

    return ChatPromptTemplate.fromMessages([
      ['system', '{system_prompt}'],
      [
        'human',
        'Please create a shortened version of the following title in English, Japanese, and Simplified Chinese. Make sure the shortened titles are concise but still capture the main idea. The output should be in JSON format. Original Title: "{title}"',
      ],
    ])
  }
}
