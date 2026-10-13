import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import configuration from 'src/config/configuration'
import {
  continueWritingInterface,
  englishRateInterface,
  extractGoodWordsAndSentenceInterface,
  getExpampleArticleInterface,
  langMap,
  polishSentenceInterface,
  polishSentnceRatingInterface,
  synonymInterface,
  translateInterface,
} from 'src/template/englishWriteTemplate'
import {
  AILLMModel,
  AiRateParams,
  ContinueWritingParams,
  DEFAULT_AI_MODEL,
  LocaleCode,
  PolishSentenceParams,
  Tables,
  TablesInsert,
} from '@repo/entity-ts-definition'
import { QueueService } from './queue.service'
import { isNil } from 'lodash'
import { pickTagsInterface, shortCutInterface } from 'src/template/tools'
import {
  DefaultModelAdapterFactory,
  GeminiAdapter,
} from './adapters'
import { PromptService } from 'src/template/prompt-service'

@Injectable()
export class AiProxyService {
  private readonly modelAdapterFactory: DefaultModelAdapterFactory

  constructor(
    private readonly httpService: HttpService,
    private readonly queueService: QueueService,
    private readonly promptService: PromptService
  ) {
    this.modelAdapterFactory = new DefaultModelAdapterFactory()
    // Keep provider selection server-side. Client supplied model names are
    // accepted only for backwards compatibility and are normalized below.
    this.modelAdapterFactory.registerAdapter(new GeminiAdapter())
  }

  private async processAiRequest<T, U>(config: {
    params: T
    userInfo: Tables<'users'>
    promptId: string // 使用promptId代替promptGenerator
    outputInterface: any
    type: string
    modelConfig?: {
      model?: string
      temperature?: number
      maxTokens?: number
    }
    needRecord?: boolean
    isCache?: boolean
  }): Promise<U> {
    const {
      params,
      userInfo,
      promptId,
      outputInterface,
      type,
      modelConfig = {},
      isCache = true,
    } = config
    const { maxTokens = 3200 } = modelConfig
    const model = DEFAULT_AI_MODEL

    // 使用模型适配器工厂获取对应的适配器
    try {
      const adapter = this.modelAdapterFactory.getAdapter(model)
      adapter.initialize({
        model: configuration().aiModel || model,
        temperature: 0,
        maxTokens,
        timeout: 60000,
        cache: isCache,
        images: (params as any).imageList,
      })
      // Capture this invocation's options before another concurrent request
      // initializes the shared adapter.
      const aiModelInvoker = adapter.createModelInvoker()

      // 获取模型能力
      const modelCapabilities = adapter.getCapabilities()

      // 使用Prompt服务获取适合当前模型能力的Prompt
      const promptTemplate = await this.promptService.getPrompt(
        promptId,
        params,
        modelCapabilities,
        model
      )

      // 使用适配器创建对应的模型调用器

      // 创建结构化输出处理器
      const outputProcessor = aiModelInvoker.withStructuredOutput(outputInterface, {
        includeRaw: true,
      })

      // 处理提示和输出，通过管道连接
      const chain = promptTemplate.pipe(outputProcessor)

      // 调用模型
      const res = await chain.invoke(params)

      // 记录使用情况
      const record: TablesInsert<'modeloutputrecord'> = {
        model_input: params as any,
        model_output: res.parsed,
        model: configuration().aiModel || model,
        user_uuid: userInfo && userInfo.id.toString(),
        type,
        usage:
          res.raw.response_metadata?.usage_metadata ||
          res.raw.response_metadata?.tokenUsage ||
          res.raw.response_metadata?.usage ||
          res.raw.usage_metadata,
      }

      if (isNil(config.needRecord)) {
        await this.queueService.addJob('modelOutputRecord', record)
      } else if (config.needRecord) {
        await this.queueService.addJob('modelOutputRecord', record)
      }

      return res.parsed
    } catch (error) {
      console.error(`Error processing AI request with model ${model}:`, error)
      throw new Error(`Failed to process request with model ${model}: ${error.message}`)
    }
  }

  async getResultByOpenAi(params: AiRateParams, userInfo?: Tables<'users'>): Promise<any> {
    // 使用新的Prompt ID
    const ratingGeneralPromise = this.getRatingGeneral(params, userInfo)
    const polishSentenceWithEssayPromise = this.polishSentenceWithEssay(params, userInfo)
    const extractGoodWordsAndSentencePromise = this.extractGoodWordsAndSentence(params, userInfo)
    const synonymPromise = this.synonym(params, userInfo)
    const getExpampleArticlePromise = this.getExpampleArticle(params, userInfo)

    const [
      ratingGeneralRes,
      polishSentenceWithEssayRes,
      extractGoodWordsAndSentenceRes,
      synonymRes,
      getExpampleArticleRes,
    ] = await Promise.all([
      ratingGeneralPromise,
      polishSentenceWithEssayPromise,
      extractGoodWordsAndSentencePromise,
      synonymPromise,
      getExpampleArticlePromise,
    ])

    const res = {
      ...ratingGeneralRes,
      polishSentence: polishSentenceWithEssayRes,
      extractGoodWordsAndSentence: extractGoodWordsAndSentenceRes,
      synonym: synonymRes,
      exampleArticle: getExpampleArticleRes,
    }

    const rateRecord: TablesInsert<'ratelog'> = {
      record_id: params.article_id,
      user_uuid: userInfo.id.toString(),
      record_input: params as any,
      record_output: res,
      article_id: params.article_id,
      status: 2,
    }

    await this.queueService.addJob('rateLog', rateRecord)

    return res
  }

  async spellCheckByTextGears(sentence: string, locale: LocaleCode = 'en_US'): Promise<any> {
    const apiurl = 'https://sg.api.textgears.com/spelling'
    const params = {
      text: sentence,
      ai: true,
      language: locale,
      key: configuration().textGears.apikey,
    }
    const { data } = await this.httpService.axiosRef.post(apiurl, params)
    return data.status ? { errors: data.response?.errors } : data.response
  }

  async polishSentenceWithEssay(params: AiRateParams, userInfo?: Tables<'users'>): Promise<any> {
    return await this.processAiRequest({
      params,
      userInfo,
      promptId: 'polish-sentence-essay',
      outputInterface: polishSentnceRatingInterface,
      type: 'polishSentence',
      modelConfig: {
        model: DEFAULT_AI_MODEL,
      },
    })
  }

  async extractGoodWordsAndSentence(
    params: AiRateParams,
    userInfo?: Tables<'users'>
  ): Promise<any> {
    return await this.processAiRequest({
      params,
      userInfo,
      promptId: 'extract-good-words',
      outputInterface: extractGoodWordsAndSentenceInterface,
      type: 'extractGoodWordsAndSentence',
      modelConfig: {
        model: DEFAULT_AI_MODEL,
      },
    })
  }

  async synonym(params: AiRateParams, userInfo?: Tables<'users'>): Promise<any> {
    return await this.processAiRequest({
      params,
      userInfo,
      promptId: 'synonym-analysis',
      outputInterface: synonymInterface,
      type: 'synonym',
      modelConfig: {
        model: DEFAULT_AI_MODEL,
        maxTokens: 3200,
      },
    })
  }

  async getExpampleArticle(params: AiRateParams, userInfo?: Tables<'users'>): Promise<any> {
    return await this.processAiRequest({
      params,
      userInfo,
      promptId: 'example-article',
      outputInterface: getExpampleArticleInterface,
      type: 'getExpampleArticle',
      modelConfig: {
        model: DEFAULT_AI_MODEL,
      },
    })
  }

  async getRatingGeneral(params: AiRateParams, userInfo?: Tables<'users'>): Promise<any> {
    // 根据是否有图片选择合适的Prompt ID
    const promptId =
      params.imageList && params.imageList.length > 0
        ? 'english-rate-with-image' // 使用支持图片的模板
        : 'english-rate' // 使用普通模板

    return await this.processAiRequest({
      params,
      userInfo,
      promptId,
      outputInterface: englishRateInterface,
      type: 'ratingGeneral',
      modelConfig: {
        model: DEFAULT_AI_MODEL,
        maxTokens: 3200,
      },
    })
  }

  // 辅助工具
  async continueWriting(params: ContinueWritingParams, userInfo: Tables<'users'>): Promise<any> {
    return await this.processAiRequest({
      params,
      userInfo,
      promptId: 'continue-writing',
      outputInterface: continueWritingInterface,
      type: 'continueWriting',
      modelConfig: {
        model: DEFAULT_AI_MODEL,
        maxTokens: 320,
      },
      isCache: params.isCache,
    })
  }

  async polishSentence(params: PolishSentenceParams, userInfo?: Tables<'users'>): Promise<any> {
    return await this.processAiRequest({
      params,
      userInfo,
      promptId: 'polish-sentence',
      outputInterface: polishSentenceInterface,
      type: 'polishSentence',
      modelConfig: {
        model: DEFAULT_AI_MODEL,
        maxTokens: 640,
      },
    })
  }

  async translateByLLM(params: AiRateParams, userInfo: Tables<'users'>): Promise<any> {
    const res: any = await this.processAiRequest({
      params: {
        content: params.content,
        locale: params.locale,
      },
      userInfo,
      promptId: 'translate',
      outputInterface: translateInterface,
      type: 'translate',
      modelConfig: {
        model: DEFAULT_AI_MODEL,
        maxTokens: 1024,
      },
    })

    return res.translatedContent
  }

  // 内部使用工具
  async generateShortCutByTitle(
    title: string
  ): Promise<{ ja: string; en: string; 'zh-CN': string }> {
    return await this.processAiRequest({
      params: {
        title,
      },
      userInfo: null,
      promptId: 'short-cut-title',
      outputInterface: shortCutInterface,
      type: 'shortCut',
      modelConfig: {
        model: DEFAULT_AI_MODEL,
        maxTokens: 640,
      },
      needRecord: false,
    })
  }

  async pickTagsByTitle(title: string, tags: Tables<'tag'>[]): Promise<{ tags: number[] }> {
    return await this.processAiRequest({
      params: {
        title,
        tags: JSON.stringify(
          tags.map((tag) => {
            return {
              id: tag.id,
              name: tag.tag_name,
            }
          })
        ),
      },
      userInfo: null,
      promptId: 'pick-tags',
      outputInterface: pickTagsInterface,
      type: 'pickTags',
      modelConfig: {
        model: DEFAULT_AI_MODEL,
        maxTokens: 640,
      },
      needRecord: false,
    })
  }
}
