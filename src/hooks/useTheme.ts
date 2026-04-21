import { useState, useEffect } from 'react'
import type { Theme } from '../types'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('lockin_theme') as Theme) || 'warm'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('lockin_theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'warm' ? 'neon' : 'warm')

  return { theme, toggleTheme }
}
