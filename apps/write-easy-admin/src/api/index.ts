import { publicConfig } from '../config'
const SUPABASE_PROJECT_ID = new URL(publicConfig.supabaseUrl).hostname.split('.')[0]

// 封装 fetch 方法
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  // 从 localStorage 获取 token
  const authKey = `sb-${SUPABASE_PROJECT_ID}-auth-token`
  const authData = JSON.parse(localStorage.getItem(authKey) || '{}')
  const accessToken = authData.access_token

  // 合并默认配置和传入的配置
  const finalOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  }

  const response = await fetch(`${publicConfig.apiBaseUrl}${url}`, finalOptions)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}
