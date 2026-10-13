export type PublicConfig = { supabaseUrl: string; supabaseAnonKey: string; apiBaseUrl: string }

declare global {
  interface Window { __WRITEESSAY_CONFIG__?: PublicConfig }
}

// Only these public values may reach the browser. Never include the service-role key.
export function getPublicConfig(): PublicConfig {
  if (typeof window !== 'undefined' && window.__WRITEESSAY_CONFIG__) {
    return window.__WRITEESSAY_CONFIG__
  }
  return {
    supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANNO_KEY || 'build-placeholder',
    apiBaseUrl: process.env.PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_BASE_API_URL || '/api',
  }
}

export function getSiteOrigin() {
  return typeof window !== 'undefined' ? window.location.origin : process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'
}
