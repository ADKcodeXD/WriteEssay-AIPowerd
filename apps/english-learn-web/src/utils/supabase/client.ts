import { getPublicConfig } from '@/utils/public-config'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    getPublicConfig().supabaseUrl,
    getPublicConfig().supabaseAnonKey
  )
}
