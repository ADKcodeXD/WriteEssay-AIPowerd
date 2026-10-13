import { Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import configuration from 'src/config/configuration'

@Injectable()
export class CacheService {
  private readonly redisClient: Redis

  constructor() {
    this.redisClient = new Redis({
      host: configuration().redis.host,
      port: Number(configuration().redis.port),
      password: configuration().redis.password,
    })
  }

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.redisClient.get(key)
    return value ? JSON.parse(value) : undefined
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.set(key, JSON.stringify(value), 'EX', ttl)
    } else {
      await this.redisClient.set(key, JSON.stringify(value))
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key)
  }

  async delByPrefix(prefix: string): Promise<void> {
    const keys = await this.redisClient.keys(`${prefix}*`)
    if (keys.length > 0) {
      await this.redisClient.del(...keys)
    }
  }
}
