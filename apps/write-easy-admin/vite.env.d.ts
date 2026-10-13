/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_PUBLIC_DOMAIN: string
  readonly VITE_PUBLIC_BASE_API_URL: string
  readonly VITE_APP_JWT_SECRET: string
  readonly VITE_NEXTAUTH_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
