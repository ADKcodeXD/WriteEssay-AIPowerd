'use client'
import { getMyInfo } from '@/api/user'
import { createClient } from '@/utils/supabase/client'
import { Tables } from '@repo/entity-ts-definition'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useCookie } from 'react-use'

const UserContext = createContext<{
  userInfo?: Tables<'users'> | null
  loading?: boolean
  error?: any
  logout?: () => Promise<void>
  refreshAccessToken?: () => Promise<void>
}>({})

export const UserProvider = ({ children }: any) => {
  const [accessToken, setAccessToken] = useCookie('access_token')
  const [refreshToken, setRefreshToken] = useCookie('refresh_token')
  const [userInfo, setUserInfo] = useState<Tables<'users'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error] = useState(null)

  const refreshAccessToken = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken as string,
    })

    if (data.session) {
      setAccessToken(data.session.access_token)
      setRefreshToken(data.session.refresh_token)
      return true
    } else {
      console.error('Failed to refresh token:', error)
      return false
    }
  }

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!accessToken) {
        setLoading(false)
        return
      }
      try {
        const response = await getMyInfo()
        if (response.code === 401) {
          // Token expired, try to refresh
          const refreshed = await refreshAccessToken()
          if (refreshed) {
            // Retry fetching user info with new token
            const { data } = await getMyInfo()
            setUserInfo(data || null)
          } else {
            // If refresh failed, clear user info and tokens
            setUserInfo(null)
            setAccessToken('')
            setRefreshToken('')
          }
        } else {
          setUserInfo(response.data || null)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchUserInfo()
  }, [accessToken])

  const logout = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (!error) {
      setUserInfo(null)
      setAccessToken('')
    }
  }

  return (
    <UserContext.Provider value={{ userInfo, loading, error, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  return useContext(UserContext)
}
