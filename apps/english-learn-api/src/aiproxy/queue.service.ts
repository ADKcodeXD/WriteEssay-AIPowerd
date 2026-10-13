import { Injectable } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { JobType, Queue } from 'bullmq'

@Injectable()
export class QueueService {
  constructor(@InjectQueue('record') private readonly recordQueue: Queue) {}

  async addJob(name: string, data: any, opts?: any) {
    return this.recordQueue.add(name, data, opts)
  }

  async getJob(jobId: string) {
    return this.recordQueue.getJob(jobId)
  }

  async getJobs(types: JobType[], start = 0, end = -1, asc = false) {
    return this.recordQueue.getJobs(types, start, end, asc)
  }

  async removeJob(jobId: string) {
    const job = await this.recordQueue.getJob(jobId)
    if (job) {
      await job.remove()
      return true
    }
    return false
  }

  async getQueueStatus() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.recordQueue.getWaitingCount(),
      this.recordQueue.getActiveCount(),
      this.recordQueue.getCompletedCount(),
      this.recordQueue.getFailedCount(),
    ])

    return {
      waiting,
      active,
      completed,
      failed,
    }
  }
}
