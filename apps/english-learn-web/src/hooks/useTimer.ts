import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatShortTime as formatShortTimeUtil, formatTime } from '@/utils'

const useTimer = () => {
  const timerRef = useRef<any>(null)
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    const startTimer = () => {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    }
    if (isActive) {
      startTimer()
    }
    return () => {
      clearInterval(timerRef.current)
    }
  }, [isActive])

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsActive(!document.hidden)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const formatShortTime = useMemo(() => formatShortTimeUtil(seconds), [seconds])

  const formattedTime: any = formatTime(seconds)

  const toggleActive = useCallback(() => {
    setIsActive((prev) => !prev)
  }, [])

  return {
    seconds,
    formattedTime,
    timerRef,
    isActive,
    toggleActive,
    formatShortTime,
  }
}

export default useTimer
