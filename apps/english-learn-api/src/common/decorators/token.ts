import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const Token = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()

  const authHeader = request.headers.authorization
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
})
