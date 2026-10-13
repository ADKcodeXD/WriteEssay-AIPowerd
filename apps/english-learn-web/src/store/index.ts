import { makeAutoObservable } from 'mobx'
import { UserStore } from './User'
import { DashboardStore } from './Dashboard'
import { TagStore } from './Tag'
class RootStore {
  isLoading: boolean = false
  userStore: UserStore
  dashboardStore: DashboardStore
  tagStore: TagStore

  constructor() {
    this.userStore = new UserStore()
    this.dashboardStore = new DashboardStore()
    this.tagStore = new TagStore()
    makeAutoObservable(this)
  }

  setLoading = (status: boolean): void => {
    this.isLoading = status
  }
}

// 创建单例
const rootStore = new RootStore()

// 导出类型
export type TRootStore = InstanceType<typeof RootStore>

export default rootStore
