import {
  Injectable,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import { Observable, of, tap } from 'rxjs'
import { Reflector } from '@nestjs/core'
import { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager'

@Injectable()
export class CustomCacheInterceptor implements NestInterceptor {
  constructor(
    protected readonly reflector: Reflector,
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const handler = context.getHandler()
    const methodTTL = await this.reflector.get<number>('custom:cacheTTL', handler)
    const isPublic = await this.reflector.get<boolean>('custom:isPublic', handler)
    const ttl = methodTTL ?? 300
    const methodKeyPrefix = await this.reflector.get<string>('custom:cacheKeyPrefix', handler)

    const request = context.switchToHttp().getRequest()
    let user_id = ''
    if (!isPublic) {
      if (request.user) {
        user_id = request.user?.id || request.user?.user?.id || request.user?.user?.user_uuid
      }
    }

    const keyPrefix = `${methodKeyPrefix || handler.name || ''}${user_id ? `:${user_id}` : ''}`

    const crypto = require('crypto')
    const queryHash = crypto
      .createHash('md5')
      .update(JSON.stringify(request.query) || '')
      .digest('hex')
    const bodyHash = crypto
      .createHash('md5')
      .update(JSON.stringify(request.body) || '')
      .digest('hex')

    const cacheKey = `${keyPrefix}:${bodyHash}:${queryHash}`

    const cachedResponse = await this.cacheManager.get(cacheKey)

    if (cachedResponse) {
      return of(cachedResponse)
    }

    return next.handle().pipe(
      tap(async (response) => {
        if (response.code !== 200 || response.statusCode >= 400 || !response.data) {
          return
        }
        await this.cacheManager.set(cacheKey, response, { ttl } as any)
      })
    )
  }
}
