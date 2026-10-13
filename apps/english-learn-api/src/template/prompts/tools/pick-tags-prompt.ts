import { BasePromptTemplate } from '../../registry/base-prompt'
import { ModelCapability } from '../../registry/model-capabilities'
import { PromptParams } from '../../types/prompt-params'
import { ChatPromptTemplate } from '../../registry/chat-prompt'
import { PickTagsParams } from '../../types/prompt-params'

/**
 * 选择标签Prompt模板
 */
export class PickTagsPrompt extends BasePromptTemplate {
  constructor() {
    super('pick-tags', '1.0.0', 'Selects relevant tags for an article based on its title', [
      ModelCapability.TEXT,
      ModelCapability.STRUCTURED_OUTPUT,
    ])
  }

  generatePrompt(params: PromptParams): ChatPromptTemplate {
    const tagParams = params as PickTagsParams

    // 创建基于变量的模板
    return ChatPromptTemplate.fromMessages([
      ['system', '{system_prompt}'],
      [
        'human',
        'Given the article title: "{title}", please select the most relevant tags from the following list: {tags}\n\nReturn only the IDs of the selected tags in a JSON format with a single "tags" array containing the tag IDs as numbers.',
      ],
    ])
  }
}
