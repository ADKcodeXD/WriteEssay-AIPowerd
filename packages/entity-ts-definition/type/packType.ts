import { EssayFeedbackPartial } from './aiPromptType'
import { Tables } from './database'
import { AILLMModel, AiRateParams, Model } from './enumDefination'
/// 这是展示层 特别进行处理或者包装过后的类型定义文件

export type EssayListVO = Tables<'article'> & {
  isWrited: boolean
}

export type UserProfile = Tables<'users'> & {
  user_ext1: {
    tranlateModel: Model
    defaultLLMModel: AILLMModel
  }
}

export type RateLog = Tables<'ratelog'> & {
  record_output: EssayFeedbackPartial
  record_input: AiRateParams
}

export type PageResponse<T = any> = {
  rows: T[]
  count: number
}

export type MyResponseType<T = any> = {
  data: T | null
  msg: string
  code: number
}
