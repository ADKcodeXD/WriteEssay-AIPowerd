import { customFetchApi } from '@/hooks/useFetch'
import { EssayListVO, PageQueryParams, PageResponse, Tables } from '@repo/entity-ts-definition'

export function getEssayList(params: PageQueryParams) {
  return customFetchApi<PageResponse<EssayListVO>>({
    url: '/essay/getList',
    body: params,
  })
}

export function getEssayDetail(id: number) {
  return customFetchApi<EssayListVO>({
    url: `/essay/getEssayDetail?id=${id}`,
    method: 'GET',
  })
}

/**
 * 获取我的评分记录
 * @param params 分页参数
 * @returns 评分记录
 */
export function getMyRateLog(params: PageQueryParams) {
  return customFetchApi<PageResponse<Tables<'ratelog'>>>({
    url: '/aiproxy/getMyRateLog',
    body: params,
  })
}

/**
 * 获取文章评分记录
 * @param id 文章id
 * @returns 评分记录
 */
export function getArticleRateLog(id: number) {
  return customFetchApi<Tables<'ratelog'>[]>({
    url: `/aiproxy/getArticleRateLog?id=${id}`,
  })
}

export function getTagList(params: PageQueryParams) {
  return customFetchApi<Tables<'tag'>[]>({
    url: '/essay/getTagList',
    body: params,
  })
}

/**
 * 获取题集列表
 * @param params 分页参数
 * @returns 题集列表
 */
export function getQuestionSetList(params: PageQueryParams) {
  return customFetchApi<
    PageResponse<Tables<'questions'> & { created_by: Tables<'users'>; article_count: number }>
  >({
    url: '/essay/question/list',
    body: params,
  })
}

/**
 * 获取题集关联文章
 * @param questionId 题集id
 * @returns 关联文章列表
 */
export function getQuestionSetRelatedArticles(questionId: number) {
  return customFetchApi<Tables<'article'>[]>({
    url: `/essay/question/related`,
    body: { questionId },
  })
}

/**
 * 获取题集详情
 * @param questionId 题集id
 * @returns 题集详情
 */
export function getQuestionSetDetail(questionId: number) {
  return customFetchApi<Tables<'questions'>>({
    url: `/essay/question/detail`,
    body: { questionId },
  })
}
