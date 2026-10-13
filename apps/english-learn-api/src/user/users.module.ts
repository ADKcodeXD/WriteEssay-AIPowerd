import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { SupabaseService } from 'src/supabase/supabase.service'
import { CacheService } from 'src/cache/cache.service'

@Module({
  imports: [],
  providers: [UsersService, SupabaseService, CacheService],
  controllers: [UsersController],
})
export class UsersModule {}
