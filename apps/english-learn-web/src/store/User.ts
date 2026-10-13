import { makeAutoObservable } from 'mobx'
import { createClient } from '@/utils/supabase/client'
import { Tables, UserProfile } from '@repo/entity-ts-definition'
import { getMyInfo } from '@/api/user'
import Cookies from 'js-cookie'

export class UserStore {
  userInfo: UserProfile | null = null
  loading: boolean = true
  error: any = null

  constructor() {
    makeAutoObservable(this)
  }

  get isLoggedIn() {
    return !!this.userInfo
  }

  get accessToken() {
    return Cookies.get('access_token')
  }

  get refreshToken() {
    return Cookies.get('refresh_token')
  }

  setAccessToken(token: string) {
    if (token) {
      Cookies.set('access_token', token)
    } else {
      Cookies.remove('access_token')
    }
  }

  setRefreshToken(token: string) {
    if (token) {
      Cookies.set('refresh_token', token)
    } else {
      Cookies.remove('refresh_token')
    }
  }

  setUserInfo(user: Tables<'users'> | null) {
    this.userInfo = user as UserProfile
    try {
      if (user?.user_ext1 && typeof user.user_ext1 === 'string') {
        this.userInfo.user_ext1 = JSON.parse(user.user_ext1)
      }
    } catch (error) {
      console.error('Failed to parse user settings:', error)
    }
  }

  setLoading(loading: boolean) {
    this.loading = loading
  }

  async refreshAccessToken() {
    const supabase = createClient()
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: this.refreshToken as string,
    })

    if (data.session) {
      this.setAccessToken(data.session.access_token)
      this.setRefreshToken(data.session.refresh_token)
      return true
    } else {
      console.error('Failed to refresh token:', error)
      return false
    }
  }

  async fetchUserInfo() {
    if (!this.accessToken) {
      this.setLoading(false)
      return
    }

    try {
      const response = await getMyInfo()
      if (response.code === 401) {
        const refreshed = await this.refreshAccessToken()
        if (refreshed) {
          const { data } = await getMyInfo()
          let user: Tables<'users'> | null = null
          if (data) {
            user = Array.isArray(data) ? data[0] : data
          }
          this.setUserInfo(user as UserProfile)
        } else {
          this.setUserInfo(null)
          this.setAccessToken('')
          this.setRefreshToken('')
        }
      } else {
        let user: Tables<'users'> | null = null
        if (response.data) {
          user = Array.isArray(response.data) ? response.data[0] : response.data
        }
        this.setUserInfo(user as UserProfile)
      }
    } finally {
      this.setLoading(false)
    }
  }

  logout = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (!error) {
      this.userInfo = null
      this.setAccessToken('')
      this.setRefreshToken('')
    }
  }
}

export const userStore = new UserStore()
