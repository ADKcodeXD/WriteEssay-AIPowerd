import { SupabaseService } from 'src/supabase/supabase.service'
import { Injectable } from '@nestjs/common'
import { AILLMModel, Model, Tables, TablesInsert, TokenUsage } from '@repo/entity-ts-definition'
import { CacheService } from 'src/cache/cache.service'
import { ErrorCode } from 'src/enum/errorCode'
import {
  calculateModelPrice,
  calculateTokenUsageByModel,
  normalizeTokenUsage,
} from './model-config'

@Injectable()
export class ModelRecordService {
  constructor(
    private readonly SupabaseService: SupabaseService,
    private readonly cacheService: CacheService
  ) {}

  async recordModelOutput(
    modelRecord: TablesInsert<'modeloutputrecord'>
  ): Promise<Tables<'modeloutputrecord'>> {
    const model = modelRecord.model as AILLMModel

    // 标准化token使用情况
    const usage = normalizeTokenUsage(model as Model, modelRecord.usage)

    if (usage.totalTokens > 0) {
      // 计算价格
      const { price } = calculateModelPrice(model as Model, usage)
      // 将TokenUsage转换为普通对象，以兼容Json类型
      modelRecord.usage = {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
      }
      modelRecord.price = price
    }

    const { data, error } = await this.SupabaseService.supabseInstance
      .from('modeloutputrecord')
      .insert(modelRecord)
      .select()

    if (error || !data?.[0]) throw new Error('Failed to persist model usage')

    // 计算配额类型和调整后的token使用量
    const { quotaType } = calculateModelPrice(model as Model, usage)
    const newUsage = calculateTokenUsageByModel(model as Model, usage)

    // 根据配额类型扣减用户配额
    let quotaResult
    if (quotaType === 'standard') {
      quotaResult = await this.SupabaseService.supabseInstance.rpc('deduct_user_normal_quota', {
        p_user_uuid: modelRecord.user_uuid,
        p_tokens: newUsage.totalTokens,
      })
    } else {
      quotaResult = await this.SupabaseService.supabseInstance.rpc('deduct_user_high_quota', {
        p_user_uuid: modelRecord.user_uuid,
        p_tokens: newUsage.totalTokens,
      })
    }

    if (quotaResult.error) throw new Error('Failed to deduct user quota')

    // 更新用户缓存
    const { data: userData } = await this.SupabaseService.supabseInstance
      .from('users')
      .select('*')
      .eq('user_uuid', modelRecord.user_uuid)
      .single()

    if (userData) {
      await this.cacheService.set(`user:${modelRecord.user_uuid}`, userData, 24 * 60 * 60)
    }

    return data[0]
  }

  async updateQuotaByUserUuid(
    userUuid: string,
    quota: number
  ): Promise<Tables<'modeloutputrecord'>> {
    const { data, error } = await this.SupabaseService.supabseInstance
      .from('modeloutputrecord')
      .update({ quota })
      .eq('user_uuid', userUuid)
      .select()
    if (error) return null

    return data[0]
  }

  async checkQuota(userUuid: string, model: Model) {
    const userProfile = await this.cacheService.get<Tables<'users'>>(`user:${userUuid}`)
    const { quotaType } = calculateModelPrice(model)

    if (!userProfile) {
      return ErrorCode.USER_PROFILE_NOT_FOUND
    }

    if (quotaType === 'standard') {
      return userProfile.normal_quota > 0
    } else if (quotaType === 'advanced') {
      return userProfile.high_quota > 0
    }

    return false
  }
}
