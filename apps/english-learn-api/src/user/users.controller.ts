import { Body, Controller, Logger, Post, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { CustomResponse } from 'src/common/response'
import { AuthGuard } from '@nestjs/passport'
import { User } from 'src/common/decorators/current-user'
import { Token } from 'src/common/decorators/token'
import { TablesUpdate } from '@repo/entity-ts-definition'

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('getProfile')
  @UseGuards(AuthGuard('supabase'))
  async getUserProfile(@User() user, @Token() token) {
    const userInfo = await this.usersService.getUsersByUuidOrToken(user && user.id, token)
    return CustomResponse.success(userInfo)
  }

  @Post('updateProfile')
  @UseGuards(AuthGuard('supabase'))
  async updateUserProfile(@User() user, @Body() data: TablesUpdate<'users'>) {
    try {
      const userInfo = await this.usersService.updateUserProfile(user && user.id, data)
      return CustomResponse.success(userInfo)
    } catch (error) {
      return CustomResponse.badRequest(error.message)
    }
  }

  @Post('logout')
  @UseGuards(AuthGuard('supabase'))
  async logout(@User() user, @Token() token) {
    await this.usersService.logout(user.id, token)
    return CustomResponse.success(null)
  }
}
