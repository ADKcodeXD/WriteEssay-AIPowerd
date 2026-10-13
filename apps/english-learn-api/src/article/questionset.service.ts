import { Injectable, Logger } from '@nestjs/common'
import { PageQueryParams, Tables, TablesInsert, TablesUpdate } from '@repo/entity-ts-definition'
import { QueueService } from 'src/aiproxy/queue.service'
import { SupabaseService } from 'src/supabase/supabase.service'
import { PageResponse } from 'src/common/response'

@Injectable()
export class QuestionSetService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly queueService: QueueService
  ) {}
  // 创建新的题集
  async createQuestion(data: TablesInsert<'questions'>, user?: any) {
    const { data: questionData, error } = await this.supabaseService.supabseInstance
      .from('questions')
      .insert({
        set_name: data.set_name,
        set_desc: data.set_desc,
        set_type: data.set_type,
        created_by: user && user.id,
      })
      .select()
      .single()

    if (error) {
      Logger.error(error.message)
      throw new Error('Create question failed')
    }

    return questionData
  }

  // 创建文章和问题的关联关系
  async createQuestionRelation(articleId: number, questionId: number) {
    const { data, error } = await this.supabaseService.supabseInstance
      .from('question_relate')
      .insert({
        article_id: articleId,
        quetions_id: questionId,
      })
      .select()
      .single()

    if (error) {
      Logger.error(error.message)
      throw new Error('Create question relation failed')
    }

    return data
  }

  async deleteQuestionRelation(articleId: number, questionId: number) {
    const { error } = await this.supabaseService.supabseInstance
      .from('question_relate')
      .delete()
      .eq('article_id', articleId)
      .eq('quetions_id', questionId)

    if (error) {
      Logger.error(error.message)
      throw new Error('Delete question relation failed')
    }

    return true
  }

  async updateQuestion(question: TablesUpdate<'questions'>) {
    const { data, error } = await this.supabaseService.supabseInstance
      .from('questions')
      .update(question)
      .eq('id', question.id)

    if (error) {
      Logger.error(error.message)
      throw new Error('Update question failed')
    }

    return data
  }

  async getRelatedArticles(questionId: number) {
    const { data, error } = await this.supabaseService.supabseInstance
      .from('question_relate')
      .select(
        `
          *,
          article:article (
            id,
            article_title,
            article_shortcut,
            article_grade,
            article_tag,
            created_at,
            article_source,
            article_tasktype
          )
        `
      )
      .eq('quetions_id', questionId)

    if (error) {
      Logger.error(error.message)
      throw new Error('Get related articles failed')
    }

    return data
  }

  async getQuestionSetList(params: PageQueryParams, user?: any) {
    const { data, error } = await this.supabaseService.supabseInstance.rpc(
      'get_question_sets_simple',
      {
        p_page: params.page || 1,
        p_page_size: params.pageSize || 10,
        p_keyword: params.keyword || null,
        p_set_type: params.taskType || null,
        p_order_by: params.orderAccrodBy || 'created_at',
        p_sort_type: params.sortType || 'desc',
      }
    )

    if (error) {
      Logger.error('Error fetching question sets:', error.message)
      return new PageResponse([], 0)
    }

    const totalCount = data.length > 0 ? data[0].total_count : 0
    const formattedData = data.map((item) => {
      const { total_count, ...rest } = item
      return rest
    })

    return new PageResponse(formattedData, totalCount)
  }

  async getQuestionDetail(questionId: number) {
    const { data, error } = await this.supabaseService.supabseInstance
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (error) {
      Logger.error(error.message)
      throw new Error('Get question detail failed')
    }

    return data
  }
}
