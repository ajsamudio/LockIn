import { useEffect, useRef, useState, useCallback } from 'react'
import { useTheme } from './hooks/useTheme'
import { useTimer } from './hooks/useTimer'
import { useBlocks } from './hooks/useBlocks'
import { useDayNav } from './hooks/useDayNav'
import { saveDay, getStreak, todayStr, addDays, EARLIEST_DATE } from './lib/storage'
import { Header } from './components/Header'
import { TimerPanel } from './components/TimerPanel'
import { BlocksPanel } from './components/BlocksPanel'
import { QuoteDisplay } from './components/QuoteDisplay'
import { AmbientPlayer } from './components/AmbientPlayer'

function App() {
  const { theme, toggleTheme } = useTheme()
  const { viewDate, isPastDay, isToday, navigate, goToToday, canGoPrev, canGoNext } = useDayNav()
  const [streak] = useState(() => getStreak())

  const [toast, setToast] = useState<{ msg: string; icon: string } | null>(null)
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string, icon = '✨') => {
    setToast({ msg, icon })
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3200)
  }, [])

  const handleSessionComplete = useCallback((_sessions: number) => {
    showToast('Session complete! Take a short break.', '🎯')
  }, [showToast])

  const timer = useTimer(handleSessionComplete)
  const { blocks, tasksDone, isLoaded, addBlock, updateBlock, deleteBlock, toggleBlock } = useBlocks(viewDate, isPastDay)

  // Persist whenever relevant state changes, but only after the day has loaded
  useEffect(() => {
    if (!isLoaded || isPastDay) return
    saveDay(viewDate, { blocks, sessions: timer.sessions, focusedMinutes: timer.focusedMinutes, tasksDone })
  }, [blocks, tasksDone, timer.sessions, timer.focusedMinutes, isLoaded, isPastDay, viewDate])

  // Reload timer state when day changes
  useEffect(() => {
    const { initFromData } = timer
    const data = (() => {
      const raw = localStorage.getItem('lockin_' + viewDate)
      if (raw) try { return JSON.parse(raw) } catch { /* empty */ }
      return null
    })()
    if (data) initFromData(data.sessions ?? 0, data.focusedMinutes ?? 0)
    else initFromData(0, 0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewDate])

  const handleToggleBlock = (id: string) => {
    toggleBlock(id)
    const block = blocks.find(b => b.id === id)
    if (block && !block.completed) showToast('Task locked in!', '✅')
  }

  const xp = timer.sessions * 10 + tasksDone * 5
  const completePct = blocks.length > 0 ? Math.round((tasksDone / blocks.length) * 100) : 0

  const tomorrow = addDays(todayStr(), 1)

  return (
    <>
      <Header theme={theme} onToggle={toggleTheme} dateStr={viewDate} streak={streak} xp={xp} />

      {/* Day completion progress bar */}
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${completePct}%` }} />
      </div>

      {/* Day navigation */}
      <nav className="day-nav-bar">
        <button
          className="day-nav-btn"
          onClick={() => navigate(-1)}
          disabled={!canGoPrev || viewDate <= EARLIEST_DATE}
          title="Previous day"
        >←</button>

        {!isToday && (
          <button className="day-nav-today" onClick={goToToday}>Today</button>
        )}
        {isPastDay && <span className="past-pill">Past Day</span>}

        <button
          className="day-nav-btn"
          onClick={() => navigate(1)}
          disabled={!canGoNext || viewDate >= tomorrow}
          title="Next day"
        >→</button>
      </nav>

      <main className="main">
        <TimerPanel timer={timer} isPastDay={isPastDay} />
        <BlocksPanel
          blocks={blocks}
          tasksDone={tasksDone}
          isPastDay={isPastDay}
          onAdd={addBlock}
          onUpdate={updateBlock}
          onDelete={deleteBlock}
          onToggle={handleToggleBlock}
        />
      </main>

      <footer className="footer">
        <QuoteDisplay />
        <AmbientPlayer />
      </footer>

      {toast && (
        <div className="toast show">
          <span className="toast-icon">{toast.icon}</span>
          {toast.msg}
        </div>
      )}
    </>
  )
}

export default App
