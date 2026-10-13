import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

export default () => ({
  workerRuntime: false,
  aiModel: process.env.AI_MODEL || 'gemini-3.8-flash',
  // Gemini is the only runtime model. OPENAI_API_KEY remains a short-term
  // compatibility fallback for existing deployments.
  geminiApiKey:
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.OPENAI_API_KEY,
  geminiBaseUrl:
    process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta',
  gptApiKey: process.env.OPENAI_API_KEY || process.env.CHATGPT_SERCET,
  textGears: {
    apikey: process.env.TEXT_GEARS_SECRET,
  },
  jwtSecret: process.env.SUPABASE_JWT_SECRET,
  supabase: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
    supabaseSecret: process.env.SUPABASE_JWT_SECRET,
    schema: process.env.SUPABASE_SCHEMA,
  },
  proxyUrl: process.env.PROXY_URL,
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },
})
