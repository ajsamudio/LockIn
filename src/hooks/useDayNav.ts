import { useState, useCallback } from 'react'
import { todayStr, addDays, EARLIEST_DATE } from '../lib/storage'

export function useDayNav() {
  const [viewDate, setViewDate] = useState(todayStr)

  const today = todayStr()
  const isPastDay = viewDate < today
  const isFutureDay = viewDate > today

  const navigate = useCallback((delta: number) => {
    setViewDate(prev => {
      const next = addDays(prev, delta)
      if (next < EARLIEST_DATE || next > addDays(todayStr(), 1)) return prev
      return next
    })
  }, [])

  const goToToday = useCallback(() => setViewDate(todayStr()), [])

  const canGoPrev = viewDate > EARLIEST_DATE
  const canGoNext = viewDate < addDays(today, 1)
  const isToday = viewDate === today

  return { viewDate, isPastDay, isFutureDay, isToday, navigate, goToToday, canGoPrev, canGoNext }
}
