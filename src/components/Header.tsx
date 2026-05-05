import type { Theme } from '../types'
import type { User } from '@supabase/supabase-js'
import { formatBadge } from '../lib/storage'

interface Props {
  theme: Theme
  onToggle: () => void
  dateStr: string
  streak: number
  xp: number
  user: User | null
  authLoading: boolean
  onSignIn: () => void
  onSignOut: () => void
}

export function Header({ theme, onToggle, dateStr, streak, xp, user, authLoading, onSignIn, onSignOut }: Props) {
  return (
    <header className="header">
      <span className="header-logo">LockIn</span>
      <div className="header-spacer" />
      <span className="header-date">{formatBadge(dateStr)}</span>
      {streak > 0 && (
        <span className="header-streak">🔥 {streak} day{streak !== 1 ? 's' : ''}</span>
      )}
      <span className="header-xp">⚡ {xp} XP</span>

      {/* Auth */}
      {!authLoading && (
        user ? (
          <button className="auth-btn" onClick={onSignOut} title="Sign out">
            {user.user_metadata?.avatar_url
              ? <img className="user-avatar" src={user.user_metadata.avatar_url as string} alt="avatar" referrerPolicy="no-referrer" />
              : <span className="user-initial">{(user.email ?? 'U')[0].toUpperCase()}</span>
            }
          </button>
        ) : (
          <button className="auth-btn auth-btn--signin" onClick={onSignIn} title="Sign in with Google">
            <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.2-2.7-.5-4z"/>
            </svg>
            Sign in
          </button>
        )
      )}

      <button
        className="theme-toggle"
        onClick={onToggle}
        title={`Switch to ${theme === 'warm' ? 'neon' : 'warm'} mode`}
      >
        {theme === 'warm' ? '🌙' : '☀️'}
      </button>
    </header>
  )
}
