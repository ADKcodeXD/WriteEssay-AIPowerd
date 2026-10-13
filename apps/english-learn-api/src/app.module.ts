import { ArticleModule } from './article/article.module'
import { AiProxyModule } from './aiproxy/aiproxy.module'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import configuration from './config/configuration'
import { UsersModule } from './user/users.module'
import { AuthModule } from './auth/auth.module'
import { BullModule } from '@nestjs/bullmq'
import { RedisCacheModule } from './cache/cache.module'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { CustomCacheInterceptor } from './common/cacheInterceptor'
import { CacheService } from './cache/cache.service'
import { PromptService } from './template/prompt-service'

@Module({
  imports: [
    AiProxyModule,
    ArticleModule,
    UsersModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    BullModule.forRoot({
      connection: {
        host: configuration().redis.host,
        port: parseInt(configuration().redis.port),
        password: configuration().redis.password,
        db: 0, // 连接的那个库
      },
      prefix: 'bull_redis_queue',
      defaultJobOptions: {
        removeOnComplete: true,
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 10000,
        },
      },
    }),
    RedisCacheModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CustomCacheInterceptor,
    },
    CacheService,
    PromptService,
  ],
})
export class AppModule {}
