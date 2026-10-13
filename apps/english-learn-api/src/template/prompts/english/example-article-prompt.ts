import { BasePromptTemplate } from '../../registry/base-prompt'
import { ModelCapability } from '../../registry/model-capabilities'
import { PromptParams } from '../../types/prompt-params'
import { ChatPromptTemplate } from '../../registry/chat-prompt'
import { IELTS_EXAMPLE_ESSAY_TEMPLATE } from '../../template'
import { AiRateParams } from '@repo/entity-ts-definition'

/**
 * 示例文章Prompt模板
 */
export class ExampleArticlePrompt extends BasePromptTemplate {
  constructor() {
    super(
      'example-article',
      '1.0.0',
      'Generates an example article based on a given topic and grade level',
      [ModelCapability.TEXT, ModelCapability.STRUCTURED_OUTPUT]
    )
  }

  async generatePrompt(params: PromptParams): Promise<ChatPromptTemplate> {
    const rateParams = params as AiRateParams

    // 获取对应Grade的模板
    let systemPrompt
    switch (rateParams.grade) {
      case 'ielts':
        systemPrompt = IELTS_EXAMPLE_ESSAY_TEMPLATE.IELTS(rateParams.taskType)
        break
      default:
        systemPrompt = IELTS_EXAMPLE_ESSAY_TEMPLATE.IELTS(2)
        break
    }

    // 如果有图片，并且模型支持图片，创建特殊模板
    if (rateParams.imageList && rateParams.imageList.length > 0 && this.supportsImages()) {
      // 创建带图片标记的模板
      const template = ChatPromptTemplate.fromMessages([
        ['system', '{system_prompt}'],
        [
          'human',
          'Essay Title is: {title}. Grade is: {grade}. Please write an example article based on this information.',
        ],
      ])

      // 标记这个模板需要处理图片
      ;(template as any).hasImages = true
      ;(template as any).imageUrls = rateParams.imageList

      return template
    }

    // 无图片情况，创建标准模板
    return ChatPromptTemplate.fromMessages([
      ['system', '{system_prompt}'],
      [
        'human',
        'Essay Title is: {title}. Grade is: {grade}. Please write an example article based on this information.',
      ],
    ])
  }
}
