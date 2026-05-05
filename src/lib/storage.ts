import type { DayData, TimeBlock } from '../types'

const PREFIX = 'lockin_'

export const EARLIEST_DATE = '2026-01-01'

export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + delta)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function formatBadge(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

const DEFAULT_BLOCKS: TimeBlock[] = [
  { id: '1', name: 'Morning Planning', duration: 30,  completed: false, counted: false },
  { id: '2', name: 'Deep Work',        duration: 90,  completed: false, counted: false },
  { id: '3', name: 'Review & Wrap-up', duration: 30,  completed: false, counted: false },
]

export function loadDayData(dateStr: string): DayData | null {
  const raw = localStorage.getItem(PREFIX + dateStr)
  if (raw) {
    try { return JSON.parse(raw) as DayData } catch { /* empty */ }
  }
  if (dateStr === todayStr()) {
    return { blocks: DEFAULT_BLOCKS, sessions: 0, focusedMinutes: 0, tasksDone: 0 }
  }
  return null
}

export function saveDay(dateStr: string, data: DayData): void {
  localStorage.setItem(PREFIX + dateStr, JSON.stringify(data))
}

export function getStreak(): number {
  let streak = 0
  let date = todayStr()
  while (true) {
    const data = loadDayData(date)
    if (!data || (data.sessions === 0 && data.tasksDone === 0)) break
    streak++
    date = addDays(date, -1)
    if (date < EARLIEST_DATE) break
  }
  return streak
}

export function parseBraindumpLine(raw: string): { name: string; duration: number } | null {
  const line = raw.trim()
  if (!line) return null
  const prefix = line.match(/^\[(\d+)\]\s*(.+)/)
  if (prefix) return { name: prefix[2].trim(), duration: Math.min(480, Math.max(1, parseInt(prefix[1]))) }
  const suffix = line.match(/^(.+?)\s*\((\d+)m\)\s*$/)
  if (suffix) return { name: suffix[1].trim(), duration: Math.min(480, Math.max(1, parseInt(suffix[2]))) }
  return { name: line, duration: 25 }
}
