import { SupabaseService } from 'src/supabase/supabase.service'
import { Injectable, Logger } from '@nestjs/common'
import { PageQueryParams, Tables, TablesInsert } from '@repo/entity-ts-definition'
import { PageResponse } from 'src/common/response'
import { CacheService } from 'src/cache/cache.service'

@Injectable()
export class RateLogService {
  constructor(
    private readonly SupabaseService: SupabaseService,
    private readonly cacheService: CacheService
  ) {}

  async recordRateLog(rateLog: TablesInsert<'ratelog'>) {
    const { data, error } = await this.SupabaseService.supabseInstance
      .from('ratelog')
      .insert(rateLog)
      .select()

    this.cacheService.delByPrefix(`myRateLog:${rateLog.user_uuid}`)
    this.cacheService.delByPrefix(`statistics:${rateLog.user_uuid}`)
    this.cacheService.delByPrefix(`essay:${rateLog.user_uuid}`)
    this.cacheService.delByPrefix(`rateLogByArticleId:${rateLog.user_uuid}`)
    if (error) return null
    return data[0]
  }

  async getRateLogByArticleId(id: number, userUuid: string) {
    const { data, error, count } = await this.SupabaseService.supabseInstance
      .from('ratelog')
      .select('*', { count: 'exact' })
      .eq('article_id', id)
      .eq('user_uuid', userUuid)
      .order('created_at', { ascending: false })
    if (error) return null

    return data
  }

  async getRateLogById(id: number) {
    const { data, error } = await this.SupabaseService.supabseInstance
      .from('ratelog')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data
  }

  async getRateLogByUserId(
    pageParams: PageQueryParams,
    userUuid: string
  ): Promise<PageResponse<Tables<'ratelog'>>> {
    const query = this.SupabaseService.supabseInstance
      .from('ratelog')
      .select('*', { count: 'exact' })
      .eq('user_uuid', userUuid)

    if (pageParams.orderAccrodBy) {
      if (pageParams.orderAccrodBy === 'id') {
        query.order('id', { ascending: pageParams.sortType === 'asc' })
      }

      if (pageParams.orderAccrodBy === 'date') {
        query.order('created_at', { ascending: pageParams.sortType === 'asc' })
      }
    }

    if (pageParams.page) {
      query.range(
        (pageParams.page - 1) * pageParams.pageSize,
        pageParams.page * pageParams.pageSize
      )
    }

    const { data, error, count } = await query

    if (error) return null

    return new PageResponse(data, count)
  }
}
