import { ErrorCode } from "src/enum/errorCode"

export class CustomResponse<T> {
  code: number
  message: string
  data: T | null

  constructor(code: number, message: string, data: T | null = null) {
    this.code = code
    this.message = message
    this.data = data
  }

  // 成功返回
  static success<T>(data: T): CustomResponse<T> {
    return new CustomResponse(200, 'Success', data)
  }

  // 参数错误
  static badRequest(message: string = 'Bad Request'): CustomResponse<null> {
    return new CustomResponse(400, message, null)
  }

  // 认证失败
  static unauthorized(message: string = 'Unauthorized'): CustomResponse<null> {
    return new CustomResponse(401, message, null)
  }

  // 用户配额不足
  static userQuotaExceeded(): CustomResponse<null> {
    return new CustomResponse(402, ErrorCode.USER_QUOTA_EXCEEDED, null)
  }

  // 资源未找到
  static notFound(message: string = 'Not Found'): CustomResponse<null> {
    return new CustomResponse(404, message, null)
  }

  // 服务器内部错误
  static internalServerError(message: string = 'Internal Server Error'): CustomResponse<null> {
    return new CustomResponse(500, message, null)
  }
}

export class PageResponse<T> {
  count: number
  rows: T[] | null

  constructor(rows = [], count = 0) {
    this.rows = rows
    this.count = count
  }
}
