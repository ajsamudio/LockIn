import { useState, useEffect, useRef, useCallback } from 'react'
import type { TimerPhase } from '../types'

const CIRCUMFERENCE = 2 * Math.PI * 80
const SESSIONS_PER_ROUND = 4

export function useTimer(onSessionComplete: (totalSessions: number) => void) {
  const [totalSeconds, setTotalSeconds] = useState(30 * 60)
  const [remaining, setRemaining] = useState(30 * 60)
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState<TimerPhase>('ready')
  const [sessions, setSessions] = useState(0)
  const [focusedMinutes, setFocusedMinutes] = useState(0)

  const sessionStartRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionsRef = useRef(sessions)
  sessionsRef.current = sessions

  const clearTick = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const accrueFocus = () => {
    if (sessionStartRef.current) {
      const mins = Math.floor((Date.now() - sessionStartRef.current) / 60000)
      setFocusedMinutes(m => m + mins)
      sessionStartRef.current = null
    }
  }

  const completeSession = useCallback(() => {
    clearTick()
    setRunning(false)
    accrueFocus()
    const next = sessionsRef.current + 1
    setSessions(next)
    setRemaining(totalSeconds)
    setPhase('done')
    onSessionComplete(next)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSeconds])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { completeSession(); return 0 }
        return r - 1
      })
    }, 1000)
    return clearTick
  }, [running, completeSession])

  const start = () => {
    sessionStartRef.current = Date.now()
    setRunning(true)
    setPhase('focusing')
  }

  const pause = () => {
    clearTick()
    setRunning(false)
    accrueFocus()
    setPhase('paused')
  }

  const reset = () => {
    clearTick()
    setRunning(false)
    accrueFocus()
    setRemaining(totalSeconds)
    setPhase('ready')
  }

  const skip = () => completeSession()

  const setDuration = (mins: number) => {
    const secs = mins * 60
    clearTick()
    setRunning(false)
    setTotalSeconds(secs)
    setRemaining(secs)
    setPhase('ready')
  }

  const initFromData = (s: number, fm: number) => {
    setSessions(s)
    setFocusedMinutes(fm)
  }

  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0
  const ringOffset = CIRCUMFERENCE * (1 - progress)
  const dotsFilled = sessions % SESSIONS_PER_ROUND

  return {
    remaining, running, phase, sessions, focusedMinutes,
    progress, ringOffset, dotsFilled,
    totalSeconds, CIRCUMFERENCE, SESSIONS_PER_ROUND,
    start, pause, reset, skip, setDuration, initFromData,
  }
}
