import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt } from 'passport-jwt'
import { Strategy } from 'passport-strategy'
import { CacheService } from 'src/cache/cache.service'
import { SupabaseService } from 'src/supabase/supabase.service'

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  success: (user: any, info: any) => void
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  fail: Strategy['fail']

  public constructor(
    private readonly supabaseService: SupabaseService,
    private readonly cacheService: CacheService
  ) {
    super()
  }

  async validate(payload: any): Promise<any> {
    const { data, error } = await this.supabaseService.supabseInstance.auth.getUser(payload.sub)
    if (error) {
      throw new Error('Unauthorized')
    }
    return data
  }

  async authenticate(req) {
    if (!this.supabaseService) {
      return this.fail(401)
    }

    const getUser = async (req) => {
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req)
      if (!token) {
        return this.fail(401)
      }
      const cachedUser = await this.cacheService.get(`user:${token}`)
      if (cachedUser) {
        return cachedUser
      }
      const { data, error } = await this.supabaseService.supabseInstance.auth.getUser(token)
      if (error) {
        console.error('Error fetching user:', error)
        return this.fail(401)
      }

      await this.cacheService.set(`user:${token}`, data, 24 * 60 * 60)
      return data
    }

    const user = await getUser(req)
    if (!user) {
      return this.fail(401, 'Unauthorized' as any)
    }

    this.success(user, {})
  }
}
