import { LocaleCode } from '@repo/entity-ts-definition'

/**
 * 基础Prompt参数接口
 * 所有prompt参数都应该扩展这个接口
 */
export interface PromptParams {
  locale?: LocaleCode
  [key: string]: any
}

/**
 * 英语评分Prompt参数
 */
export interface EnglishRateParams extends PromptParams {
  content: string
  title: string
  grade?: string
  imageList?: string[]
}

/**
 * 翻译Prompt参数
 */
export interface TranslateParams extends PromptParams {
  content: string
  locale: LocaleCode
}

/**
 * 继续写作Prompt参数
 */
export interface ContinueWritingParams extends PromptParams {
  content: string
  model?: string
  isCache?: boolean
}

/**
 * 润色句子Prompt参数
 */
export interface PolishSentenceParams extends PromptParams {
  content: string
  model?: string
}

/**
 * 标签选择Prompt参数
 */
export interface PickTagsParams extends PromptParams {
  title: string
  tags: string
}

/**
 * 短标题生成Prompt参数
 */
export interface ShortCutParams extends PromptParams {
  title: string
}
