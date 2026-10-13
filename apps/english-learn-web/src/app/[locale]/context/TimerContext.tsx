import React, { createContext, useContext, ReactNode, useMemo } from 'react'
import useTimer from '@/hooks/useTimer'

type TimerContextType = ReturnType<typeof useTimer>

const TimerContext = createContext<TimerContextType | undefined>(undefined)

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const timer = useTimer()
  
  const memoizedTimer = useMemo(() => timer, [timer])

  return <TimerContext.Provider value={memoizedTimer}>{children}</TimerContext.Provider>
}

export const useTimerContext = () => {
  const context = useContext(TimerContext)
  if (context === undefined) {
    throw new Error('useTimerContext must be used within a TimerProvider')
  }
  return context
}
