import { useState, useCallback, useRef, useEffect } from 'react'
import type { TimeBlock } from '../types'
import { loadDayData } from '../lib/storage'

let _counter = 0
function uid() { return `b${++_counter}_${Math.random().toString(36).slice(2)}` }

export const ACCENT_COLORS = [
  'var(--accent-1)',
  'var(--accent-2)',
  'var(--accent-3)',
  'var(--accent-4)',
  'var(--accent-5)',
]

export function blockColor(index: number) {
  return ACCENT_COLORS[index % ACCENT_COLORS.length]
}

export function useBlocks(dateStr: string, isPastDay: boolean) {
  const [blocks, setBlocks] = useState<TimeBlock[]>([])
  const [tasksDone, setTasksDone] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const loadingRef = useRef(false)

  useEffect(() => {
    setIsLoaded(false)
    loadingRef.current = true
    const data = loadDayData(dateStr)
    if (data) {
      setBlocks(data.blocks)
      setTasksDone(data.tasksDone)
    } else {
      setBlocks([])
      setTasksDone(0)
    }
    loadingRef.current = false
    setIsLoaded(true)
  }, [dateStr])

  const addBlock = useCallback(() => {
    if (isPastDay) return
    setBlocks(prev => [...prev, { id: uid(), name: '', duration: 30, completed: false, counted: false }])
  }, [isPastDay])

  const updateBlock = useCallback((id: string, patch: Partial<TimeBlock>) => {
    if (isPastDay) return
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
  }, [isPastDay])

  const deleteBlock = useCallback((id: string) => {
    if (isPastDay) return
    setBlocks(prev => {
      const block = prev.find(b => b.id === id)
      if (block?.counted) setTasksDone(t => Math.max(0, t - 1))
      return prev.filter(b => b.id !== id)
    })
  }, [isPastDay])

  const toggleBlock = useCallback((id: string) => {
    if (isPastDay) return
    setBlocks(prev => prev.map(b => {
      if (b.id !== id) return b
      if (!b.completed && !b.counted) {
        setTasksDone(t => t + 1)
        return { ...b, completed: true, counted: true }
      }
      if (b.completed && b.counted) {
        setTasksDone(t => Math.max(0, t - 1))
        return { ...b, completed: false, counted: false }
      }
      return { ...b, completed: !b.completed }
    }))
  }, [isPastDay])

  return { blocks, tasksDone, isLoaded, addBlock, updateBlock, deleteBlock, toggleBlock }
}
