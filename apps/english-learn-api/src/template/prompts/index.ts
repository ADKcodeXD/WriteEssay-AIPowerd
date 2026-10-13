import { BasePromptTemplate } from '../registry/base-prompt'
import { EnglishRatePrompt, EnglishRateWithImagePrompt } from './english/rate-prompt'
import { TranslatePrompt } from './translation/translate-prompt'
import { PolishSentencePrompt, PolishSentenceEssayPrompt } from './english/polish-sentence-prompt'
import { ExtractGoodWordsPrompt } from './english/extract-good-words-prompt'
import { SynonymAnalysisPrompt } from './english/synonym-prompt'
import { ExampleArticlePrompt } from './english/example-article-prompt'
import { ContinueWritingPrompt } from './english/continue-writing-prompt'
import { ShortCutTitlePrompt } from './tools/short-cut-prompt'
import { PickTagsPrompt } from './tools/pick-tags-prompt'

/**
 * 所有注册的Prompt模板
 */
export const registeredPrompts: BasePromptTemplate[] = [
  // 英语评分相关
  new EnglishRatePrompt(),
  new EnglishRateWithImagePrompt(),
  new PolishSentencePrompt(),
  new PolishSentenceEssayPrompt(),
  new ExtractGoodWordsPrompt(),
  new SynonymAnalysisPrompt(),
  new ExampleArticlePrompt(),
  new ContinueWritingPrompt(),

  // 翻译相关
  new TranslatePrompt(),

  // 工具相关
  new ShortCutTitlePrompt(),
  new PickTagsPrompt(),
]
