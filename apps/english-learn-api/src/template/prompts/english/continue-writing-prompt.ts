import { BasePromptTemplate } from '../../registry/base-prompt'
import { ModelCapability } from '../../registry/model-capabilities'
import { PromptParams } from '../../types/prompt-params'
import { ChatPromptTemplate } from '../../registry/chat-prompt'
import { SYSTEM_PROMPT_TEMPLATE_CONTINUE_WRITING } from '../../template'
import { ContinueWritingParams } from '@repo/entity-ts-definition'

/**
 * 继续写作Prompt模板
 */
export class ContinueWritingPrompt extends BasePromptTemplate {
  constructor() {
    super('continue-writing', '1.0.0', 'Continues writing an essay from a given context', [
      ModelCapability.TEXT,
      ModelCapability.STRUCTURED_OUTPUT,
    ])
  }

  generatePrompt(params: PromptParams): ChatPromptTemplate {
    const continueParams = params as ContinueWritingParams

    // 创建基于变量的模板
    return ChatPromptTemplate.fromMessages([
      ['system', '{system_prompt}'],
      [
        'human',
        'The essay title is {title}, Please continue the following sentence "{context}", this is a essay for {grade}',
      ],
    ])
  }
}
