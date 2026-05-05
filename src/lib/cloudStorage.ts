import { supabase } from './supabase'
import type { DayData } from '../types'

// ---------- helpers ----------

function rowToDay(row: Record<string, unknown>): DayData {
  return {
    blocks:         (row.blocks         as DayData['blocks']) ?? [],
    sessions:       (row.sessions       as number)            ?? 0,
    focusedMinutes: (row.focused_minutes as number)           ?? 0,
    tasksDone:      (row.tasks_done     as number)            ?? 0,
  }
}

// ---------- public API ----------

/** Fetch a single day for the logged-in user. Returns null if not found. */
export async function cloudFetchDay(userId: string, date: string): Promise<DayData | null> {
  const { data, error } = await supabase
    .from('day_data')
    .select('blocks, sessions, focused_minutes, tasks_done')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()

  if (error || !data) return null
  return rowToDay(data as Record<string, unknown>)
}

/** Upsert (create or overwrite) a day for the logged-in user. */
export async function cloudUpsertDay(userId: string, date: string, data: DayData): Promise<void> {
  await supabase
    .from('day_data')
    .upsert(
      {
        user_id:         userId,
        date,
        blocks:          data.blocks,
        sessions:        data.sessions,
        focused_minutes: data.focusedMinutes,
        tasks_done:      data.tasksDone,
      },
      { onConflict: 'user_id,date' },
    )
}

/** Fetch every day ever saved for this user. Returns a date→DayData map. */
export async function cloudFetchAll(userId: string): Promise<Record<string, DayData>> {
  const { data, error } = await supabase
    .from('day_data')
    .select('date, blocks, sessions, focused_minutes, tasks_done')
    .eq('user_id', userId)

  if (error || !data) return {}

  return Object.fromEntries(
    (data as Array<Record<string, unknown>>).map(row => [
      row.date as string,
      rowToDay(row),
    ]),
  )
}
