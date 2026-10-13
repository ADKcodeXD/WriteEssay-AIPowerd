import { z } from 'zod'
import {
  IELTS_EXAMPLE_ESSAY_TEMPLATE,
  IELTS_EXTRACT_GOOD_WORDS_AND_SENTENCE_TEMPLATE,
  IELTS_POLISH_SENTENCE_TEMPLATE,
  IELTS_RATING_DEEP_REASON_TEMPLATE,
  IELTS_SYNONYM_TEMPLATE,
  IELTS_SYSTEM_PROMPT_TEMPLATE,
  SYSTEM_PROMPT_TEMPLATE_CONTINUE_WRITING,
  SYSTEM_PROMPT_TEMPLATE_POLISH_SENTENCE,
} from './template'
import { ChatPromptTemplate } from './registry/chat-prompt'
import { AiRateParams, LocaleCode } from '@repo/entity-ts-definition'
import { BaseMessageFields, HumanMessage } from './registry/chat-prompt'

export const langMap = {
  en: 'English',
  ja: '日本語',
  'zh-CN': '简体中文',
}

const I18NPROMPT: any = [
  'human',
  `Your output results need to be internationalized, and this time you need to present them in {language}`,
]

export const englishRateInterface = z.object({
  score: z.object({
    taskAchievement: z.number().describe('Task Achievement Score, '),
    coherence: z.number().describe('Coherence Score'),
    lexicalResource: z.number().describe('Lexical Resource Score'),
    grammaticalRangeAccuracy: z.number().describe('Grammatical Range Accuracy Score'),
    overall: z.number().describe('Overall Score'),
  }),
  scoreReason: z.object({
    taskAchievement: z.string().describe('The reason of task achievement score, short brief'),
    coherence: z.string().describe('The reason of coherence score, short brief'),
    lexicalResource: z.string().describe('The reason of lexical resource score, short brief'),
    grammaticalRangeAccuracy: z
      .string()
      .describe('The reason of grammatical range accuracy score, short brief'),
  }),
  ratingDeepReason: z.object({
    taskAchievement: z
      .string()
      .describe('The reason of task achievement score, at least 50 words, use specific language'),
    coherence: z
      .string()
      .describe('The reason of coherence score, at least 50 words, use specific language'),
    lexicalResource: z
      .string()
      .describe('The reason of lexical resource score, at least 50 words, use specific language'),
    grammaticalRangeAccuracy: z
      .string()
      .describe(
        'The reason of grammatical range accuracy score, at least 50 words, use specific language'
      ),
  }),
})

export const polishSentenceInterface = z.object({
  origin: z.string().describe('This is origin sentence from essay'),
  polished: z.string().describe('Output a good sentence better than origin'),
  explain: z.string().describe('Give a reason why change that, use specific language'),
})

export const continueWritingInterface = z.object({
  continueContent: z.string().describe('The continue Content'),
})

// 分层评分 句子评分
export const polishSentnceRatingInterface = z.object({
  polishSentence: z
    .array(
      z.object({
        origin: z.string().describe('This is origin sentence from essay'),
        polished: z
          .string()
          .describe('Output a good sentence better than origin, must use English'),
        explain: z.string().describe('Give a reason why change that, use specific language'),
      })
    )
    .describe(
      'If the essay is very bad, try polish more sentences, If its very perfect, polish less sentences, range from 1 to 10 sentences'
    ),
})

// 分层评分 抽取好词好句
export const extractGoodWordsAndSentenceInterface = z.object({
  curatedSentences: z
    .array(
      z.object({
        sentence: z.string().describe('The good sentences in essay.'),
        explain: z.string().describe('Why it is good, use specific language'),
      })
    )
    .describe(
      'Range from 1 to 10 sentences. Try extract best sentences, if essay is too short, less sentences'
    ),
  curatedWords: z
    .array(
      z.object({
        word: z.string().describe('The good words in essay.'),
        context: z
          .string()
          .describe(
            'The context of the word in input essay Content, not too long, about 10 words, must include the word'
          ),
        explain: z.string().describe('Why it is good, use specific language'),
      })
    )
    .describe(
      'Range from 1 to 10 words. Try extract best words, if essay is too short, less words'
    ),
})

// 同义词
export const synonymInterface = z.object({
  synonymList: z
    .array(
      z.object({
        word: z.string().describe('The original word from essay'),
        synonym: z.string().describe('The synonym of word, must use English'),
        explain: z
          .string()
          .describe('Explain why you choose the synonym,must output specific language'),
        context: z
          .string()
          .describe(
            'The context of the word in input essay Content, not too long, about 10 words, must include the word'
          ),
      })
    )
    .describe('Range from 1 to 10 words. Depends on essay length'),
})

// 获取范例文章
export const getExpampleArticleInterface = z.object({
  title: z.string().describe('The title of article'),
  example: z.string().describe('The content of article'),
})

export const translateInterface = z.object({
  translatedContent: z.string().describe('The translated content'),
})

// 以下是各个评分的prompt生成函数
async function downloadAndConvertToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Image fetch failed with status ${response.status}`)
    const bytes = new Uint8Array(await response.arrayBuffer())
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    return `data:${response.headers.get('content-type') || 'image/jpeg'};base64,${btoa(binary)}`
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error)
    return ''
  }
}

export const generatePromptParamsGpt = async (inputMesage: AiRateParams) => {
  let promptTemplate

  switch (inputMesage.grade) {
    case 'ielts':
      promptTemplate = IELTS_SYSTEM_PROMPT_TEMPLATE.IELTS(inputMesage.taskType)
      break
    default:
      promptTemplate = IELTS_SYSTEM_PROMPT_TEMPLATE.IELTS(2)
      break
  }

  let imageMsgContent: any[] = []
  if (inputMesage.imageList && inputMesage.imageList.length > 0) {
    for (const url of inputMesage.imageList) {
      const base64Image = await downloadAndConvertToBase64(url)
      if (base64Image) {
        imageMsgContent.push({
          type: 'image_url',
          image_url: base64Image,
        })
      }
    }
  }

  let humanMessageContent: BaseMessageFields = {
    content: [
      {
        type: 'text',
        text: promptTemplate,
      },
      {
        type: 'text',
        text: `Your output results need to be internationalized, and this time you need to present them in ${langMap[inputMesage.locale || 'zh-CN']}`,
      },
      {
        type: 'text',
        text: `The article title is '${inputMesage.title}', please evaluate the band of below essay: '${inputMesage.content}'`,
      },
      ...(imageMsgContent.length > 0 ? [imageMsgContent] : []),
    ],
  }

  const humanMessage = new HumanMessage(humanMessageContent)

  return ChatPromptTemplate.fromMessages([humanMessage])
}

export const generateTranslatePromptGpt = (params: { content: string; locale: LocaleCode }) => {
  return ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are a professional translator, please translate the following content to ${langMap[params.locale || 'zh-CN']}: ${params.content}`,
    ],
  ])
}

export const generateExpampleArticlePromptGpt = async (params: AiRateParams) => {
  let promptTemplate

  switch (params.grade) {
    case 'ielts':
      promptTemplate = IELTS_EXAMPLE_ESSAY_TEMPLATE.IELTS(params.taskType)
      break
    default:
      promptTemplate = IELTS_EXAMPLE_ESSAY_TEMPLATE.IELTS(2)
      break
  }

  let imageMsgContent: any[] = []
  if (params.imageList && params.imageList.length > 0) {
    for (const url of params.imageList) {
      const base64Image = await downloadAndConvertToBase64(url)
      if (base64Image) {
        imageMsgContent.push({
          type: 'image_url',
          image_url: params.model.includes('gemini')
            ? `data:image/png;base64,${base64Image}`
            : { url: base64Image },
        })
      }
    }
  }

  let humanMessageContent: BaseMessageFields = {
    content: [
      {
        type: 'text',
        text: promptTemplate,
      },
      {
        type: 'text',
        text: `Essay Title is: ${params.title}. Grade is: ${params.grade}. 
        Please write an example article based on this information.`,
      },
      ...(imageMsgContent.length > 0 ? [imageMsgContent] : []),
    ],
  }

  const humanMessage = new HumanMessage(humanMessageContent)

  return ChatPromptTemplate.fromMessages([humanMessage])
}

export const generateSynonymPromptGpt = (params: AiRateParams) => {
  let promptTemplate
  switch (params.grade) {
    case 'ielts':
      promptTemplate = IELTS_SYNONYM_TEMPLATE.CHATGPT
      break
    default:
      promptTemplate = IELTS_SYNONYM_TEMPLATE.CHATGPT
      break
  }
  return ChatPromptTemplate.fromMessages([
    ['system', promptTemplate],
    I18NPROMPT,
    ['human', 'The essay topic is {title},The essay content is {content}'],
  ])
}

export const generateExtractGoodWordsAndSentencePromptGpt = (params: AiRateParams) => {
  let promptTemplate
  switch (params.grade) {
    case 'ielts':
      promptTemplate = IELTS_EXTRACT_GOOD_WORDS_AND_SENTENCE_TEMPLATE.CHATGPT
      break
    default:
      promptTemplate = IELTS_EXTRACT_GOOD_WORDS_AND_SENTENCE_TEMPLATE.CHATGPT
      break
  }
  return ChatPromptTemplate.fromMessages([
    ['system', promptTemplate],
    ['human', 'The essay content is: {content}'],
  ])
}

export const generatePolishSentencePromptGpt = (params: AiRateParams) => {
  let promptTemplate
  switch (params.grade) {
    case 'ielts':
      promptTemplate = IELTS_POLISH_SENTENCE_TEMPLATE.CHATGPT
      break
    default:
      promptTemplate = IELTS_POLISH_SENTENCE_TEMPLATE.CHATGPT
      break
  }

  let humanMessageContent: BaseMessageFields = {
    content: [
      {
        type: 'text',
        text: promptTemplate,
      },
      {
        type: 'text',
        text: `The essay content is: ${params.content}`,
      },
      {
        type: 'text',
        text: `Your output results need to be internationalized, and this time you need to present them in ${langMap[params.locale || 'zh-CN']}`,
      },
    ],
  }

  const humanMessage = new HumanMessage(humanMessageContent)

  return ChatPromptTemplate.fromMessages([humanMessage])
}

export const generateContinueWritingSinglePromptGpt = () => {
  return ChatPromptTemplate.fromMessages([
    ['system', SYSTEM_PROMPT_TEMPLATE_POLISH_SENTENCE.CHATGPT],
    [
      'human',
      'The essay title is {title}, The origin sentence is {content}, please polish it to a good sentence',
    ],
  ])
}

export const generateContinueWritingPromptGpt = () => {
  return ChatPromptTemplate.fromMessages([
    ['system', SYSTEM_PROMPT_TEMPLATE_CONTINUE_WRITING.CHATGPT],
    [
      'human',
      'The essay title is {title}, Please continue the following sentence "{context}", this is a essay for {grade}',
    ],
  ])
}

export const generatePromptParamsSparkle = (inputMesage: AiRateParams): any => {
  return {
    model: '4.0Ultra',
    messages: [
      {
        role: 'system',
        content: IELTS_SYSTEM_PROMPT_TEMPLATE.SPAKLE(inputMesage.locale),
      },
      {
        role: 'system',
        content: `你的输出必须是国际化的，并且不能够影响功能本身，只在解释说明的部分进行国际化，这次你需要输出的语言是 ${langMap[inputMesage.locale || 'zh-CN']}`,
      },
      {
        role: 'user',
        content: `文章标题是${inputMesage.title}, 请对以下文章进行评分: ${inputMesage.content}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 6400,
  }
}
