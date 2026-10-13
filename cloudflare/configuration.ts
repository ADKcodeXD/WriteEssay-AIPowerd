import { currentEnv } from './context'
export default () => {
  const env = currentEnv()
  return {
    workerRuntime: true,
    geminiApiKey: env.GEMINI_API_KEY || env.GOOGLE_GEMINI_API_KEY || env.OPENAI_API_KEY,
    geminiBaseUrl: env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta',
    aiModel: env.AI_MODEL || 'gemini-3.8-flash',
    gptApiKey: env.OPENAI_API_KEY,
    proxyUrl: undefined,
    textGears: { apikey: env.TEXT_GEARS_SECRET },
  }
}
