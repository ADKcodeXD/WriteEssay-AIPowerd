import { RateLogService } from './ratelog.service'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { Logger } from '@nestjs/common'
import { ModelRecordService } from 'src/aiproxy/modeloutputrecord.service'
import { TablesInsert } from '@repo/entity-ts-definition'
import { AiProxyService } from './aiproxy.service'
import { TagService } from 'src/article/tag.service'
import { SupabaseService } from 'src/supabase/supabase.service'

@Injectable()
@Processor('record')
export class RecordProcessor extends WorkerHost {
  constructor(
    @Inject(forwardRef(() => ModelRecordService))
    private readonly modelRecordService: ModelRecordService,
    @Inject(forwardRef(() => RateLogService))
    private readonly rateLogService: RateLogService,
    @Inject(forwardRef(() => AiProxyService))
    private readonly aiproxyService: AiProxyService,
    @Inject(forwardRef(() => TagService))
    private readonly tagService: TagService,
    private readonly supabaseService: SupabaseService
  ) {
    super()
  }

  async process(job: Job<any, any, string>): Promise<any> {
    try {
      switch (job.name) {
        case 'modelOutputRecord':
          return this.record(job.data)
        case 'rateLog':
          return this.rateLog(job.data)
        case 'pickTags':
          return this.pickTags(job.data)
        case 'generateShortCut':
          return this.generateShortCut(job.data)
        default:
          throw new Error(`Unknown job name: ${job.name}`)
      }
    } catch (error) {
      Logger.error(`Error processing job ${job.id}:`, error)
      throw error
    }
  }

  private async record(data: TablesInsert<'modeloutputrecord'>) {
    try {
      await this.modelRecordService.recordModelOutput(data)
      Logger.log(`Translation record completed successfully`)
    } catch (error) {
      Logger.error(`Error processing translation record:`, error)
      throw error
    }
  }

  private async rateLog(data: TablesInsert<'ratelog'>) {
    try {
      await this.rateLogService.recordRateLog(data)
      Logger.log(`Rate log record completed successfully`)
    } catch (error) {
      Logger.error(`Error processing rate log record:`, error)
      throw error
    }
  }

  private async pickTags(data: any) {
    const id = data['id']
    const title = data.article_title

    try {
      const tags = await this.supabaseService.supabseInstance.from('tag').select('*').limit(100)
      const res = await this.aiproxyService.pickTagsByTitle(title, tags.data)
      await this.supabaseService.supabseInstance
        .from('article')
        .update({ article_tag: res.tags.map((tag) => tag.toString()) })
        .eq('id', id)
      Logger.log(`Pick tags record completed successfully`)
      return res
    } catch (error) {
      Logger.error(`Error processing pick tags record: ${error.message}`, error)
      throw error
    }
  }

  private async generateShortCut(data: any) {
    const id = data['id']
    const title = data.article_title

    try {
      const res = await this.aiproxyService.generateShortCutByTitle(title)
      await this.supabaseService.supabseInstance
        .from('article')
        .update({ article_shortcut: res })
        .eq('id', id)
      return res
    } catch (error) {
      Logger.error(`Error processing generate short cut record: ${error.message}`, error)
      throw error
    }
  }
}
