import { z } from 'zod'
import { langMap } from './englishWriteTemplate'
import { ChatPromptTemplate } from './registry/chat-prompt'

// 短标题
export const shortCutInterface = z.object({
  'zh-CN': z.string().describe('The short title of article in Chinese'),
  en: z.string().describe('The short title of article in English'),
  ja: z.string().describe('The short title of article in Japanese'),
})

export const pickTagsInterface = z.object({
  tags: z.array(z.number()).describe('The tags Id List'),
})

export const generateShortCutByTitlePromptGpt = (title: string) => {
  return ChatPromptTemplate.fromMessages([
    [
      'system',
      `You have to summarize the following title into a short title in Chinese, English and Japanese: ${title}`,
    ],
  ])
}

export const generatePickTagsByTitlePromptGpt = (title: string) => {
  return ChatPromptTemplate.fromMessages([
    [
      'system',
      `You have to pick 0-3 tags from the following tags: 
      ({tags}) 
      for the following title: ${title},
      You have to return the tags Id List`,
    ],
  ])
}
