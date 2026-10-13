import { Module } from '@nestjs/common'
import { SupabaseStrategy } from './SupabaseStrategy'
import { PassportModule } from '@nestjs/passport'
import { SupabaseService } from 'src/supabase/supabase.service'
import { CacheService } from 'src/cache/cache.service'
import { JwtModule } from '@nestjs/jwt'
import { JwtStrategy } from './jwt.strategy'

@Module({
  imports: [PassportModule, JwtModule],
  providers: [SupabaseStrategy, SupabaseService, CacheService, JwtStrategy],
  exports: [SupabaseStrategy, JwtModule],
})
export class AuthModule {}
