'use client'
import rootStore, { TRootStore } from '@/store'
import { createContext, useContext, ReactNode, useEffect } from 'react'
const StoreContext = createContext<TRootStore | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = rootStore

  useEffect(() => {
    rootStore.userStore.fetchUserInfo()
    rootStore.tagStore.fetchTags()
  }, [])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
