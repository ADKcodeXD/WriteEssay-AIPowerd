import { Module, forwardRef } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ArticleController } from './article.controller'
import { ArticleService } from './article.service'
import { SupabaseService } from 'src/supabase/supabase.service'
import { TagService } from './tag.service'
import { AiProxyModule } from '../aiproxy/aiproxy.module'
import { QuestionSetService } from './questionset.service'
@Module({
  imports: [
    forwardRef(() => AiProxyModule),
    HttpModule.register({
      timeout: 90000,
      maxRedirects: 5,
    }),
  ],
  controllers: [ArticleController],
  providers: [ArticleService, SupabaseService, TagService, QuestionSetService],
  exports: [ArticleService],
})
export class ArticleModule {}
