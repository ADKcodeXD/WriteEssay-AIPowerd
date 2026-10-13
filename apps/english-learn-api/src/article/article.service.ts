import { Injectable, Logger } from '@nestjs/common'
import { PageResponse } from 'src/common/response'
import { SupabaseService } from 'src/supabase/supabase.service'
import { PageQueryParams, EssayListVO, TablesInsert } from '@repo/entity-ts-definition'
import { QueueService } from 'src/aiproxy/queue.service'
import { cloneDeep } from 'lodash'

@Injectable()
export class ArticleService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly queueService: QueueService
  ) {}

  async getEssayListByPageQuery(params: PageQueryParams, user?: any) {
    let query = this.supabaseService.supabseInstance.from('article').select(
      `
        article_cover,
        article_grade,
        article_tag,
        article_tasktype,
        article_shortcut,
        id,
        created_at,
        article_title
      `,
      { count: 'exact' }
    )

    if (params.id) {
      query = query.eq('id', params.id)
    }
    if (params.keyword) {
      query = query.ilike('article_title', `%${params.keyword}%`)
    }
    if (params.grade) {
      query = query.eq('article_grade', params.grade)
    }
    if (params.taskType) {
      query = query.eq('article_tasktype', params.taskType)
    }
    if (params.tagList && params.tagList.length > 0) {
      query = query.overlaps('article_tag', params.tagList)
    }

    // 排序
    if (params.orderAccrodBy === 'date') {
      query = query.order('created_at', {
        ascending: params.sortType === 'asc',
      })
    }

    if (params.orderAccrodBy === 'id') {
      query = query.order('id', {
        ascending: params.sortType === 'asc',
      })
    }

    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      Logger.error(error.message)
      throw new Error('Failed to read articles')
    }

    // 如果有用户，单独查询 ratelog
    if (user && data.length > 0) {
      const ratelogQuery = await this.supabaseService.supabseInstance
        .from('ratelog')
        .select('article_id')
        .eq('user_uuid', user.id)
        .in(
          'article_id',
          data.map((item) => item.id)
        )

      const writtenArticleIds = new Set(ratelogQuery.data?.map((log) => log.article_id))

      return new PageResponse<EssayListVO>(
        data.map((item) => ({
          ...item,
          isWrited: writtenArticleIds.has(item.id),
        })),
        count
      )
    }

    return new PageResponse<EssayListVO>(
      data.map((item) => ({
        ...item,
        isWrited: false,
      })),
      count
    )
  }

  async getEssayDetail(id: number, user?: any): Promise<EssayListVO> {
    const { data: articleData, error } = await this.supabaseService.supabseInstance
      .from('article')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      Logger.error(error.message)
      throw new Error('Failed to read articles')
    }

    // 如果有用户，单独查询 ratelog
    if (user) {
      const { data: ratelogData } = await this.supabaseService.supabseInstance
        .from('ratelog')
        .select('article_id')
        .eq('user_uuid', user.id)
        .eq('article_id', id)
        .single()

      return {
        ...articleData,
        isWrited: !!ratelogData,
      }
    }

    return {
      ...articleData,
      isWrited: false,
    }
  }

  async createEssay(data: TablesInsert<'article'>) {
    const { data: essayData, error } = await this.supabaseService.supabseInstance
      .from('article')
      .insert(data)
      .select()
      .limit(1)
    if (error || !essayData?.length) {
      throw new Error('Create essay failed')
    }
    if (
      essayData[0] &&
      (!essayData[0].article_shortcut || !essayData[0].article_shortcut['zh-CN'])
    ) {
      await this.queueService.addJob('generateShortCut', cloneDeep(essayData[0]))
    }

    if (essayData[0] && !essayData[0].article_tag) {
      await this.queueService.addJob('pickTags', cloneDeep(essayData[0]))
    }

    return essayData[0]
  }
}
