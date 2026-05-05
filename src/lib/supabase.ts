import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// If env vars are missing the app still runs — auth + cloud sync just won't work.
// Copy .env.example → .env and fill in your Supabase project credentials.
export const supabase = (url && key)
  ? createClient(url, key)
  : null

export const supabaseReady = Boolean(supabase)
