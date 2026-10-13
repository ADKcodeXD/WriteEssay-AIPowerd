declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      NEXTAUTH_SECRET: string //Session Secret
      APP_JWT_SECRET: string //Authorization Token secret
      NEXTAUTH_URL: string
      GOOGLE_CLIENT_ID: string
      GOOGLE_CLIENT_SECRET: string

      SUPABASE_SERVICE_ROLE_KEY: string
      NEXT_PUBLIC_SUPABASE_URL: string
      NEXT_PUBLIC_SUPABASE_ANNO_KEY: string
      NEXT_PUBLIC_DOMAIN: string
      NEXT_PUBLIC_BASE_API_URL: string
    }
  }
}

export {}
