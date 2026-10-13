import { Injectable, Logger } from '@nestjs/common'
import { PageQueryParams, Tables } from '@repo/entity-ts-definition'
import { SupabaseService } from 'src/supabase/supabase.service'

@Injectable()
export class TagService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getTagList(params: PageQueryParams): Promise<Tables<'tag'>[]> {
    const query = this.supabaseService.supabseInstance.from('tag').select()
    if (params.id) query.eq('id', params.id)
    if (params.keyword) {
      query.ilike('tag_i18n->>jp', `%${params.keyword}%`)
      query.ilike('tag_i18n->>en', `%${params.keyword}%`)
      query.ilike('tag_i18n->>zh-CN', `%${params.keyword}%`)
    }

    const { data, error } = await query

    if (error) {
      Logger.error(error.message)
    } else return data
  }
}
