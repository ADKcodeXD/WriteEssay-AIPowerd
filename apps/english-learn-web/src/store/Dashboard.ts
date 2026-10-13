import { makeAutoObservable } from 'mobx'
import { getMyStatistics } from '@/api/aiproxy'
import { EssayStatistics, PageQueryParams, PageResponse, Tables } from '@repo/entity-ts-definition'
import { getMyRateLog } from '@/api/essay'

export class DashboardStore {
  statistics: EssayStatistics | null = null
  myRateLog: PageResponse<Tables<'ratelog'>> | null = null
  loading: boolean = false

  constructor() {
    makeAutoObservable(this)
  }

  fetchStatistics = async (grade: string) => {
    this.loading = true
    try {
      const res = await getMyStatistics(grade)
      this.statistics = res?.data || null
    } catch (error) {
      console.error(error)
    } finally {
      this.loading = false
    }
  }

  fetchMyRateLog = async (params: PageQueryParams) => {
    try {
      const res = await getMyRateLog(params)
      this.myRateLog = res?.data || null
    } catch (error) {
      console.error(error)
    }
  }
}
