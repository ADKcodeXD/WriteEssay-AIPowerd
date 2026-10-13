import { TablesInsert, TablesUpdate } from '@repo/entity-ts-definition'
import { authenticatedFetch } from '.'

export const createEssay = async (data: TablesInsert<'article'>) => {
  const response = await authenticatedFetch('/essay/create', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return response
}

// 创建新的题目
export const createQuestion = async (data: TablesInsert<'questions'>) => {
  const response = await authenticatedFetch('/essay/question/create', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return response
}

// 创建文章和题目的关联关系
export const createQuestionRelation = async (articleId: number, questionId: number) => {
  const response = await authenticatedFetch('/essay/question/relate', {
    method: 'POST',
    body: JSON.stringify({ articleId, questionId }),
  })
  return response
}

// 删除文章和题目的关联关系
export const deleteQuestionRelation = async (articleId: number, questionId: number) => {
  const response = await authenticatedFetch('/essay/question/unrelate', {
    method: 'POST',
    body: JSON.stringify({ articleId, questionId }),
  })
  return response
}

// 获取关联问题
export const getRelatedQuestion = async (questionId: number) => {
  const response = await authenticatedFetch('/essay/question/related', {
    method: 'POST',
    body: JSON.stringify({ questionId }),
  })
  return response
}

// 更新题目
export const updateQuestion = async (question: TablesUpdate<'questions'>) => {
  const response = await authenticatedFetch('/essay/question/update', {
    method: 'POST',
    body: JSON.stringify(question),
  })
  return response
}
