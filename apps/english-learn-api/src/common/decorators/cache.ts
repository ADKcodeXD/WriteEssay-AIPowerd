import { SetMetadata, UseInterceptors, applyDecorators } from '@nestjs/common'
import { CustomCacheInterceptor } from '../cacheInterceptor'

export function CustomCache(ttl: number = 300, keyPrefix: string = '', isPublic: boolean = true) {
  return applyDecorators(
    SetMetadata('custom:cacheTTL', ttl),
    SetMetadata('custom:cacheKeyPrefix', keyPrefix),
    SetMetadata('custom:isPublic', isPublic),
    UseInterceptors(CustomCacheInterceptor)
  )
}
