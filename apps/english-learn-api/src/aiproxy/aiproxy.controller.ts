import { Body, Controller, Get, Logger, Post, Query, UseGuards } from '@nestjs/common'
import { AiProxyService } from './aiproxy.service'
import { CustomResponse } from 'src/common/response'
import {
  AiRateParams,
  ContinueWritingParams,
  DEFAULT_AI_MODEL,
  LocaleCode,
  PageQueryParams,
  PolishSentenceParams,
  TranslateProvider,
} from '@repo/entity-ts-definition'
import { User } from 'src/common/decorators/current-user'
import { AuthGuard } from '@nestjs/passport'
import { RateLogService } from './ratelog.service'
import { CustomCache } from 'src/common/decorators/cache'
import { StatisticsService } from './statistics.service'
import { ModelRecordService } from './modeloutputrecord.service'

@Controller('aiproxy')
export class AiProxyController {
  constructor(
    private readonly aiProxyService: AiProxyService,
    private readonly rateLogService: RateLogService,
    private readonly statisticsService: StatisticsService,
    private readonly modelRecordService: ModelRecordService
  ) {}

  @Post('getResult')
  @UseGuards(AuthGuard('supabase'))
  async getResult(@Body() params: AiRateParams, @User() userInfo): Promise<any> {
    params.model = DEFAULT_AI_MODEL
    const quotaCheck = await this.modelRecordService.checkQuota(userInfo.id, DEFAULT_AI_MODEL)
    if (!quotaCheck) {
      return CustomResponse.userQuotaExceeded()
    }
    let res = await this.aiProxyService.getResultByOpenAi(params, userInfo)
    return CustomResponse.success(res)
  }

  @Post('getIncorrectWords')
  async getIncorrectWord(@Body() params: { content: string }): Promise<any> {
    if (params.content.length > 5000) return CustomResponse.badRequest()
    const res = await this.aiProxyService.spellCheckByTextGears(params.content)
    return CustomResponse.success(res)
  }

  @Get('getRateLogByArticleId')
  @UseGuards(AuthGuard('supabase'))
  @CustomCache(60 * 60 * 24, 'rateLogByArticleId', false)
  async getRateLogByArticleId(@Query('id') id: number, @User() userInfo): Promise<any> {
    const res = await this.rateLogService.getRateLogByArticleId(id, userInfo.id)
    return CustomResponse.success(res)
  }

  @Get('getRateLogById')
  @CustomCache(60 * 60 * 24, 'rateLogById')
  async getRateLogById(@Query('id') id: number): Promise<any> {
    const res = await this.rateLogService.getRateLogById(id)
    return CustomResponse.success(res)
  }

  @Post('getMyRateLog')
  @UseGuards(AuthGuard('supabase'))
  @CustomCache(60 * 60 * 24, 'myRateLog', false)
  async getMyRateLog(@User() userInfo, @Body() pageParams: PageQueryParams): Promise<any> {
    const res = await this.rateLogService.getRateLogByUserId(pageParams, userInfo.id)
    return CustomResponse.success(res)
  }

  @Post('translate')
  @UseGuards(AuthGuard('supabase'))
  @CustomCache(60, 'translate')
  async tranlate(
    @Body() params: { content: string; locale: LocaleCode; provider?: string },
    @User() userInfo
  ): Promise<any> {
    const quotaCheck = await this.modelRecordService.checkQuota(userInfo.id, DEFAULT_AI_MODEL)
    if (!quotaCheck) {
      return CustomResponse.userQuotaExceeded()
    }
    const res = await this.aiProxyService.translateByLLM(
      { content: params.content, locale: params.locale, model: DEFAULT_AI_MODEL } as AiRateParams,
      userInfo
    )
    return CustomResponse.success(res)
  }

  @Post('polishSentence')
  @UseGuards(AuthGuard('supabase'))
  async polishSentence(@Body() params: PolishSentenceParams, @User() userInfo): Promise<any> {
    const res = await this.aiProxyService.polishSentence(params, userInfo)
    return CustomResponse.success(res)
  }

  @Post('continueWriting')
  @UseGuards(AuthGuard('supabase'))
  async continueSentence(@Body() params: ContinueWritingParams, @User() userInfo): Promise<any> {
    const res = await this.aiProxyService.continueWriting(params, userInfo)
    return CustomResponse.success(res)
  }

  @Get('getStatistics')
  @CustomCache(60 * 60, 'statistics', false)
  @UseGuards(AuthGuard('supabase'))
  async getStatistics(@User() userInfo, @Query('grade') grade: string): Promise<any> {
    const res = await this.statisticsService.getEssayStatistics(userInfo.id, grade)
    return CustomResponse.success(res)
  }
}
