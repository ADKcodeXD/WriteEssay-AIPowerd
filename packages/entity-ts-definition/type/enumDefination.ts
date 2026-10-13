export type Grade = 'elementary' | 'toefl' | 'graduate' | 'gre' | 'ielts' | 'cet6' | 'cet4'

// The provider is intentionally hidden from end users. Keeping the canonical
// value in the shared package prevents stale client defaults from reappearing.
export const DEFAULT_AI_MODEL = 'gemini-3.8-flash' as const

export type AILLMModel = typeof DEFAULT_AI_MODEL

export type LocaleCode = 'en_US' | 'ja_JP' | 'zh-CN' | 'ja' | 'en'

export type TranslateProvider = 'google' | 'youdao' | 'textgears' | 'openai' | 'deepl' | 'baidu'

export type Model = AILLMModel | TranslateProvider

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface AiRateParams {
  title: string
  content: string
  grade?: Grade
  locale?: LocaleCode
  model?: Model
  article_id?: number
  useTime?: number
  imageList?: string[]
  taskType?: 1 | 2
}

export interface PolishSentenceParams {
  content: string
  title?: string
  grade?: Grade
  locale?: LocaleCode
  model?: AILLMModel
}

export interface ContinueWritingParams {
  title: string
  context: string
  grade?: Grade
  model?: AILLMModel
  isCache?: boolean
}

export interface PageQueryParams {
  page?: number
  pageSize?: number
  id?: number
  keyword?: string
  grade?: Grade
  /* 仅用于ielts 的任务类型 */
  taskType?: number
  sortType?: 'asc' | 'desc'
  orderAccrodBy?: 'id' | 'date'
  tagList?: number[]
  themeList?: number[]
  userId?: number
  ext?: JSON
}
