import { Body, Controller, Get, Logger, Post, Query, UseGuards } from '@nestjs/common'
import { ArticleService } from './article.service'
import { CustomResponse } from 'src/common/response'
import { PageQueryParams, TablesInsert, TablesUpdate } from '@repo/entity-ts-definition'
import { TagService } from './tag.service'
import { CustomCache } from 'src/common/decorators/cache'
import { JwtUser, User } from 'src/common/decorators/current-user'
import { OptionalAuthGuard } from 'src/auth/optional-auth.guard'
import { QuestionSetService } from './questionset.service'

@Controller('essay')
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly tagService: TagService,
    private readonly questionSetService: QuestionSetService
  ) {}

  @Post('getList')
  @UseGuards(OptionalAuthGuard)
  @CustomCache(60, 'essay')
  async getEssayLists(@Body() params: PageQueryParams, @JwtUser() user?: any) {
    const dataList = await this.articleService.getEssayListByPageQuery(params, user)
    return CustomResponse.success(dataList)
  }

  /**
   * tag 直接获取全部tag
   * @param params
   * @returns
   */
  @Post('getTagList')
  @CustomCache(60, 'tag')
  async getTagList(@Body() params: PageQueryParams) {
    const dataList = await this.tagService.getTagList(params)
    return CustomResponse.success(dataList)
  }

  @Get('getEssayDetail')
  @UseGuards(OptionalAuthGuard)
  @CustomCache(60 * 60 * 24 * 1000, 'essay', false)
  async getEssayDetail(@Query('id') id: number, @User() user?: any) {
    const data = await this.articleService.getEssayDetail(id, user)
    return CustomResponse.success(data)
  }

  @Post('create')
  async createEssay(@Body() essays: TablesUpdate<'article'>) {
    const { data } = await this.articleService.createEssay(essays)
    return CustomResponse.success(data)
  }

  @Post('question/create')
  @UseGuards(OptionalAuthGuard)
  async createQuestion(@Body() question: TablesInsert<'questions'>, @JwtUser() user?: any) {
    const data = await this.questionSetService.createQuestion(question, user)
    return CustomResponse.success(data)
  }

  @Post('question/relate')
  async createQuestionRelation(@Body() params: { articleId: number; questionId: number }) {
    const data = await this.questionSetService.createQuestionRelation(
      params.articleId,
      params.questionId
    )
    return CustomResponse.success(data)
  }

  @Post('question/list')
  @UseGuards(OptionalAuthGuard)
  @CustomCache(60, 'question')
  async getQuestionList(@Body() params: PageQueryParams, @JwtUser() user?: any) {
    const data = await this.questionSetService.getQuestionSetList(params, user)
    return CustomResponse.success(data)
  }

  @Post('question/detail')
  async getQuestionDetail(@Body() params: { questionId: number }) {
    const data = await this.questionSetService.getQuestionDetail(params.questionId)
    return CustomResponse.success(data)
  }

  @Post('question/unrelate')
  async deleteQuestionRelation(@Body() params: { articleId: number; questionId: number }) {
    const data = await this.questionSetService.deleteQuestionRelation(
      params.articleId,
      params.questionId
    )
    return CustomResponse.success(data)
  }

  @Post('question/related')
  async getRelatedQuestions(@Body() params: { questionId: number }) {
    const data = await this.questionSetService.getRelatedArticles(params.questionId)
    return CustomResponse.success(data)
  }

  @Post('question/update')
  async updateQuestion(@Body() question: TablesUpdate<'questions'>) {
    const data = await this.questionSetService.updateQuestion(question)
    return CustomResponse.success(data)
  }
}
