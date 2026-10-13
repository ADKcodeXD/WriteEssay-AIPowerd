import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { AiProxyService } from './aiproxy.service'
import { AiProxyController } from './aiproxy.controller'
import {
  DefaultModelAdapterFactory,
  GeminiAdapter,
} from './adapters'
import { PromptService } from 'src/template/prompt-service'
import { BullModule } from '@nestjs/bullmq'
import { RecordProcessor } from './record.processor'
import { RateLogService } from './ratelog.service'
import { ModelRecordService } from './modeloutputrecord.service'
import { TagService } from 'src/article/tag.service'
import { SupabaseService } from 'src/supabase/supabase.service'
import { QueueService } from './queue.service'
import { CacheService } from 'src/cache/cache.service'
import { StatisticsService } from './statistics.service'

@Module({
  imports: [
    HttpModule.register({
      timeout: 90000,
    }),
    BullModule.registerQueue({ name: 'record' }),
  ],
  controllers: [AiProxyController],
  providers: [
    AiProxyService,
    DefaultModelAdapterFactory,
    GeminiAdapter,
    PromptService,
    QueueService,
    RecordProcessor,
    RateLogService,
    TagService,
    SupabaseService,
    ModelRecordService,
    CacheService,
    StatisticsService,
  ],
  exports: [
    AiProxyService,
    DefaultModelAdapterFactory,
    GeminiAdapter,
    PromptService,
    QueueService,
    RecordProcessor,
    RateLogService,
    TagService,
    SupabaseService,
    ModelRecordService,
    CacheService,
  ],
})
export class AiProxyModule {}
