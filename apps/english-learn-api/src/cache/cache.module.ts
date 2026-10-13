import { CacheModule, CacheStore } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { redisStore } from 'cache-manager-redis-store'
import { RedisClientOptions } from 'redis'
import configuration from 'src/config/configuration'
import { CacheService } from './cache.service'
import { ConfigService } from '@nestjs/config'

@Module({
  imports: [
    CacheModule.registerAsync<RedisClientOptions>({
      useFactory: async () => {
        const store = (await redisStore({
          socket: {
            host: configuration().redis.host,
            port: parseInt(configuration().redis.port),
          },
          password: configuration().redis.password,
          ttl: 60,
        })) as unknown as CacheStore
        return {
          store: store,
        }
      },
      isGlobal: true,
      inject: [ConfigService],
    }),
  ],
  exports: [CacheService],
  providers: [CacheService],
})
export class RedisCacheModule {}
