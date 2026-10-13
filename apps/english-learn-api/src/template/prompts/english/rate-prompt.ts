import { AiRateParams } from '@repo/entity-ts-definition'
import { BasePromptTemplate } from '../../registry/base-prompt'
import { ModelCapability } from '../../registry/model-capabilities'
import { PromptParams } from '../../registry/prompt-template'
import { ChatPromptTemplate } from '../../registry/chat-prompt'
import { IELTS_SYSTEM_PROMPT_TEMPLATE } from '../../template'
import { langMap } from '../../englishWriteTemplate'
import { z } from 'zod'

/**
 * 英语评分输出接口定义
 */
export const englishRateInterface = z.object({
  score: z.object({
    taskAchievement: z.number().describe('Task Achievement Score, '),
    coherence: z.number().describe('Coherence Score'),
    lexicalResource: z.number().describe('Lexical Resource Score'),
    grammaticalRangeAccuracy: z.number().describe('Grammatical Range Accuracy Score'),
    overall: z.number().describe('Overall Score'),
  }),
  scoreReason: z.object({
    taskAchievement: z.string().describe('The reason of task achievement score, short brief'),
    coherence: z.string().describe('The reason of coherence score, short brief'),
    lexicalResource: z.string().describe('The reason of lexical resource score, short brief'),
    grammaticalRangeAccuracy: z
      .string()
      .describe('The reason of grammatical range accuracy score, short brief'),
  }),
  ratingDeepReason: z.object({
    taskAchievement: z
      .string()
      .describe('The reason of task achievement score, at least 50 words, use specific language'),
    coherence: z
      .string()
      .describe('The reason of coherence score, at least 50 words, use specific language'),
    lexicalResource: z
      .string()
      .describe('The reason of lexical resource score, at least 50 words, use specific language'),
    grammaticalRangeAccuracy: z
      .string()
      .describe(
        'The reason of grammatical range accuracy score, at least 50 words, use specific language'
      ),
  }),
})

/**
 * 英语评分Prompt模板 - 纯文本版本
 */
export class EnglishRatePrompt extends BasePromptTemplate {
  constructor() {
    super(
      'english-rate',
      '1.0.0',
      'Evaluates English essays and provides scoring with detailed feedback',
      [ModelCapability.TEXT, ModelCapability.STRUCTURED_OUTPUT]
    )
  }

  async generatePrompt(params: PromptParams): Promise<ChatPromptTemplate> {
    const rateParams = params as AiRateParams
    // 获取对应Grade的评分模板
    let systemPrompt
    switch (rateParams.grade) {
      case 'ielts':
        systemPrompt = IELTS_SYSTEM_PROMPT_TEMPLATE.IELTS(rateParams.taskType)
        break
      default:
        systemPrompt = IELTS_SYSTEM_PROMPT_TEMPLATE.IELTS(2)
        break
    }

    let language = langMap[rateParams.locale || 'zh-CN']
    const template = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      [
        'human',
        `Your output results need to be internationalized, and this time you need to present them in ${language}`,
      ],
      [
        'human',
        "The article title is '{title}', please evaluate the band of below essay: '{content}'",
      ],
    ])

    // 返回完整的模板，后续会在pipe方法中处理
    return template
  }
}

/**
 * 英语评分Prompt模板 - 带图片版本
 */
export class EnglishRateWithImagePrompt extends BasePromptTemplate {
  constructor() {
    super('english-rate-with-image', '1.0.0', 'English Essay Rating with Image Support', [
      ModelCapability.TEXT,
      ModelCapability.STRUCTURED_OUTPUT,
      ModelCapability.IMAGE,
    ])
  }

  async generatePrompt(params: PromptParams): Promise<ChatPromptTemplate> {
    const rateParams = params as AiRateParams
    let systemPrompt
    let language = langMap[rateParams.locale || 'zh-CN']
    switch (rateParams.grade) {
      case 'ielts':
        systemPrompt = IELTS_SYSTEM_PROMPT_TEMPLATE.IELTS(rateParams.taskType)
        break
      default:
        systemPrompt = IELTS_SYSTEM_PROMPT_TEMPLATE.IELTS(2)
        break
    }

    // 如果有图片，并且模型支持图片，创建特殊模板
    if (rateParams.imageList && rateParams.imageList.length > 0 && this.supportsImages()) {
      // 对于带图片的处理，我们需要在BasePromptTemplate中的pipe方法中特殊处理
      // 这里返回一个标准模板，后续会由pipe方法处理图片
      const template = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        [
          'human',
          `Your output results need to be internationalized, and this time you need to present them in ${language}. The article title is '{title}', please evaluate the band of below essay: '{content}'`,
        ],
      ])

      // 标记这个模板需要处理图片
      ;(template as any).hasImages = true
      ;(template as any).imageUrls = rateParams.imageList

      return template
    }

    // 无图片情况，创建标准模板
    const template = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      [
        'human',
        `Your output results need to be internationalized, and this time you need to present them in ${language}`,
      ],
      [
        'human',
        "The article title is '{title}', please evaluate the band of below essay: '{content}'",
      ],
    ])

    return template
  }
}
