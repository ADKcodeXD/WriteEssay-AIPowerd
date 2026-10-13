import { Injectable } from '@nestjs/common'
import { SupabaseClient, createClient } from '@supabase/supabase-js'
import configuration from 'src/config/configuration'
import { Database } from '@repo/entity-ts-definition'

@Injectable()
export class SupabaseService {
  public supabseInstance: SupabaseClient
  constructor() {
    this.supabseInstance = createClient<Database>(
      configuration().supabase.supabaseUrl,
      configuration().supabase.supabaseKey
    )
  }
}
