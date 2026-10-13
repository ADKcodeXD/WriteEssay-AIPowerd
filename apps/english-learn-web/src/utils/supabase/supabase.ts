import { getPublicConfig } from '@/utils/public-config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  getPublicConfig().supabaseUrl,
  getPublicConfig().supabaseAnonKey
)

export default supabase
