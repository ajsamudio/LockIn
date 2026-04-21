import type { Theme } from '../types'
import { formatBadge } from '../lib/storage'

interface Props {
  theme: Theme
  onToggle: () => void
  dateStr: string
  streak: number
  xp: number
}

export function Header({ theme, onToggle, dateStr, streak, xp }: Props) {
  return (
    <header className="header">
      <span className="header-logo">LockIn</span>
      <div className="header-spacer" />
      <span className="header-date">{formatBadge(dateStr)}</span>
      {streak > 0 && (
        <span className="header-streak">🔥 {streak} day{streak !== 1 ? 's' : ''}</span>
      )}
      <span className="header-xp">⚡ {xp} XP</span>
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
