import { Injectable } from '@nestjs/common'
import { TablesUpdate } from '@repo/entity-ts-definition'
import { omit } from 'lodash'
import { CacheService } from 'src/cache/cache.service'
import { CustomResponse } from 'src/common/response'
import { SupabaseService } from 'src/supabase/supabase.service'

@Injectable()
export class UsersService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly cacheService: CacheService
  ) {}

  async getUsersByUuidOrToken(uuid: string, token?: string) {
    if (token) {
      const cacheKey = `user:${uuid}`
      const cachedData = await this.cacheService.get(cacheKey)
      if (cachedData) {
        return cachedData
      }
    }

    const { data, error } = await this.supabase.supabseInstance
      .from('users')
      .select('*')
      .eq('user_uuid', uuid)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    await this.cacheService.set(`user:${uuid}`, data, 24 * 60 * 60)

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async updateUserProfile(uuid: string, data: TablesUpdate<'users'>) {
    const newData = omit(data, ['user_uuid', 'user_id', 'high_quota', 'normal_quota', 'created_at'])
    const { data: updatedData, error } = await this.supabase.supabseInstance
      .from('users')
      .update(newData)
      .eq('user_uuid', uuid)
      .select()

    if (error) {
      throw new Error(error.message)
    }

    await this.cacheService.set(`user:${uuid}`, updatedData, 24 * 60 * 60)

    return updatedData
  }

  async logout(uuid: string, token: string) {
    await this.cacheService.del(`user:${token}`)
    await this.cacheService.del(`user:${uuid}`)
    return CustomResponse.success(null)
  }
}
