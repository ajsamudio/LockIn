export interface TimeBlock {
  id: string
  name: string
  duration: number
  completed: boolean
  counted: boolean
}

export interface DayData {
  blocks: TimeBlock[]
  sessions: number
  focusedMinutes: number
  tasksDone: number
}

export type Theme = 'warm' | 'neon'
export type TimerPhase = 'ready' | 'focusing' | 'paused' | 'done'

export interface AmbientTrack {
  id: string
  label: string
  icon: string
  noiseType: 'brown' | 'pink' | 'white' | 'tone'
}
