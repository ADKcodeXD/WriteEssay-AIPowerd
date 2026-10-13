declare global {
  interface Window {
    __WRITEESSAY_CONFIG__?: { supabaseUrl: string; supabaseAnonKey: string; apiBaseUrl: string }
  }
}

export const publicConfig = window.__WRITEESSAY_CONFIG__ || {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  apiBaseUrl: import.meta.env.VITE_PUBLIC_BASE_API_URL || '/api',
}
