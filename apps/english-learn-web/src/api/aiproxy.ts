import { customFetchApi } from '@/hooks/useFetch'
import {
  AiRateParams,
  ContinueWritingParams,
  LocaleCode,
  Model,
  PolishSentenceParams,
} from '@repo/entity-ts-definition'

export function tranlate(params: { content: string; locale: LocaleCode; provider?: Model }, signal?: AbortSignal) {
  const { provider: _provider, ...input } = params
  return customFetchApi<string>({
    url: `/aiproxy/translate`,
    method: 'POST',
    body: input,
    signal,
    options: {
      needToast: true,
    },
  })
}

export function polish(params: PolishSentenceParams) {
  const { model: _model, ...input } = params
  const controller = new AbortController()

  const promise = customFetchApi<any>({
    url: `/aiproxy/polishSentence`,
    method: 'POST',
    body: input,
    options: {
      needToast: true,
      signal: controller.signal,
    },
  })

  return {
    promise,
    abort: () => controller.abort(),
  }
}

export function continueWriteApi(params: ContinueWritingParams) {
  const { model: _model, ...input } = params
  return customFetchApi<{ continueContent: string }>({
    url: `/aiproxy/continueWriting`,
    method: 'POST',
    body: input,
    options: {
      needToast: true,
    },
  })
}

export function rateEssay(params: AiRateParams) {
  const { model: _model, ...input } = params
  return customFetchApi<any>({
    url: `/aiproxy/getResult`,
    method: 'POST',
    body: input,
    options: {
      needToast: true,
    },
  })
}

export function getRateLogByArticleId(article_id: number) {
  return customFetchApi<any>({
    url: `/aiproxy/getRateLogByArticleId?id=${article_id}`,
    method: 'GET',
  })
}

export function getRateLogById(id: number) {
  return customFetchApi<any>({
    url: `/aiproxy/getRateLogById?id=${id}`,
    method: 'GET',
  })
}

export function getMyStatistics(grade: string) {
  return customFetchApi<any>({
    url: `/aiproxy/getStatistics?grade=${grade}`,
    method: 'GET',
  })
}
