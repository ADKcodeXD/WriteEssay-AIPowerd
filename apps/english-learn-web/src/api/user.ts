import { customFetchApi } from '@/hooks/useFetch'
import { Tables, TablesUpdate } from '@repo/entity-ts-definition'

export function getMyInfo(headers?: Record<string, string>) {
  return customFetchApi<Tables<'users'>>({
    url: '/users/getProfile',
    options: headers ? { headers } : {},
    method: 'POST',
  })
}

export function updateUserInfo(data: TablesUpdate<'users'>) {
  return customFetchApi<Tables<'users'>>({
    url: '/users/updateProfile',
    method: 'POST',
    body: data,
  })
}
