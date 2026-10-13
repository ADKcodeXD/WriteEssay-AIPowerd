import { getTranslator } from '@/i18n'
import { MyResponseType } from '@repo/entity-ts-definition'
import { toast } from 'react-toastify'
import { getPublicConfig } from '@/utils/public-config'

async function getAccessToken() {
  let token
  if (typeof window === 'undefined') {
    const { cookies: serverCookies } = await import('next/headers')
    const authToken = serverCookies().get('access_token')
    token = authToken ? authToken.value : undefined
  } else {
    const clientCookies = (await import('js-cookie')).default
    token = clientCookies.get('access_token')
  }
  return token
}

export const customFetchApi = async <T = any>({ url, method, body, options = {}, signal }: any) => {
  try {
    const accessToken = await getAccessToken()
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    }
    const baseUrl = typeof window === 'undefined'
      ? process.env.INTERNAL_API_URL || getPublicConfig().apiBaseUrl
      : getPublicConfig().apiBaseUrl
    const response = await fetch(`${baseUrl}${url}`, {
      ...options,
      method: method || 'POST',
      headers,
      signal: signal || options.signal,
      cache: !options.cache ? 'no-store' : undefined,
      params: method === 'GET' ? body : undefined,
      body: method === 'GET' ? undefined : body ? JSON.stringify(body) : undefined,
    })
    if (!response.ok && response.status === 401) {
      return {
        code: 401,
        msg: 'Unauthorized',
      } as MyResponseType<T>
    } else if (!response.ok) {
      throw new Error(
        `Network response was not ok ${response.status} ${response.url} ${response.headers} ${process.env.NEXT_PUBLIC_BASE_API_URL}${url}`
      )
    }
    const result = await response.json()
    if (result.code !== 200) {
      let t
      if (typeof window !== 'undefined') {
        t = getTranslator()
      }
      if (options.needToast) {
        toast.error((t && t(`error-code-${result.code}`)) || 'Unknown error')
      }
      return result as MyResponseType<T>
    }
    return result as MyResponseType<T>
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err
    }
    throw err
  }
}
