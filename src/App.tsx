import { useEffect, useRef, useState, useCallback } from 'react'
import { useTheme } from './hooks/useTheme'
import { useTimer } from './hooks/useTimer'
import { useBlocks } from './hooks/useBlocks'
import { useDayNav } from './hooks/useDayNav'
import { useAuth } from './hooks/useAuth'
import { useNotifications } from './hooks/useNotifications'
import { saveDay, loadDayData, getStreak, todayStr, addDays, EARLIEST_DATE } from './lib/storage'
import { cloudFetchDay, cloudFetchAll, cloudUpsertDay } from './lib/cloudStorage'
import { Header } from './components/Header'
import { TimerPanel } from './components/TimerPanel'
import { BlocksPanel } from './components/BlocksPanel'
import { QuoteDisplay } from './components/QuoteDisplay'
import { AmbientPlayer } from './components/AmbientPlayer'

function App() {
  const { theme, toggleTheme } = useTheme()
  const { viewDate, isPastDay, isToday, navigate, goToToday, canGoPrev, canGoNext } = useDayNav()
  const [streak] = useState(() => getStreak())
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth()
  const { requestPermission, notify } = useNotifications()

  const [toast, setToast] = useState<{ msg: string; icon: string } | null>(null)
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Notification permission on first click ──────────────────────────────
  useEffect(() => {
    const handler = () => {
      requestPermission()
      document.removeEventListener('click', handler)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [requestPermission])

  // ── Toast helper ────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string, icon = '✨') => {
    setToast({ msg, icon })
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3200)
  }, [])

  // ── Timer ───────────────────────────────────────────────────────────────
  const handleSessionComplete = useCallback((_sessions: number) => {
    showToast('Session complete! Take a short break.', '🎯')
    notify('LockIn – Session Complete', 'Great work! Time to take a short break.')
  }, [showToast, notify])

  const timer = useTimer(handleSessionComplete)

  // ── Blocks ──────────────────────────────────────────────────────────────
  const {
    blocks, tasksDone, isLoaded,
    addBlock, updateBlock, deleteBlock, toggleBlock, syncFromCloud,
  } = useBlocks(viewDate, isPastDay)

  // Keep stable refs so async callbacks always see latest values
  const syncFromCloudRef = useRef(syncFromCloud)
  useEffect(() => { syncFromCloudRef.current = syncFromCloud }, [syncFromCloud])

  const timerRef = useRef(timer)
  useEffect(() => { timerRef.current = timer }, [timer])

  const viewDateRef = useRef(viewDate)
  useEffect(() => { viewDateRef.current = viewDate }, [viewDate])

  // ── Cloud sync helpers ──────────────────────────────────────────────────

  /** Apply a cloud DayData snapshot to the live UI for the current view. */
  const applyCloudSnapshot = useCallback((data: { blocks: typeof blocks; sessions: number; focusedMinutes: number; tasksDone: number }) => {
    syncFromCloudRef.current(data as Parameters<typeof syncFromCloud>[0])
    // Don't overwrite a running timer's session count
    if (!timerRef.current.running) {
      timerRef.current.initFromData(data.sessions, data.focusedMinutes)
    }
  }, [syncFromCloud])

  // ── On login: pull ALL cloud days, merge with local, push local-only days ──
  useEffect(() => {
    if (!user) return
    let cancelled = false

    const syncOnLogin = async () => {
      const allCloud = await cloudFetchAll(user.id)
      if (cancelled) return

      // Write every cloud day into localStorage (cloud wins on conflict)
      for (const [date, data] of Object.entries(allCloud)) {
        saveDay(date, data)
      }

      // Push any localStorage days the cloud doesn't have yet (first login migration)
      const localDates = Object.keys(localStorage)
        .filter(k => k.startsWith('lockin_'))
        .map(k => k.slice('lockin_'.length))

      for (const date of localDates) {
        if (!allCloud[date]) {
          const local = loadDayData(date)
          if (local) cloudUpsertDay(user.id, date, local)   // fire-and-forget
        }
      }

      // Refresh the currently viewed date in the UI
      const current = allCloud[viewDateRef.current] ?? loadDayData(viewDateRef.current)
      if (current && !cancelled) applyCloudSnapshot(current)
    }

    syncOnLogin()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])   // intentionally only on login/logout

  // ── On tab/window focus: re-fetch the viewed day (cross-device updates) ──
  useEffect(() => {
    if (!user) return

    const onFocus = async () => {
      const cloud = await cloudFetchDay(user.id, viewDateRef.current)
      if (!cloud) return
      saveDay(viewDateRef.current, cloud)
      applyCloudSnapshot(cloud)
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onFocus()
    })
    return () => {
      window.removeEventListener('focus', onFocus)
    }
  }, [user, applyCloudSnapshot])

  // ── Save: localStorage immediately + debounced cloud upsert ────────────
  const cloudSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isLoaded || isPastDay) return
    const data = { blocks, sessions: timer.sessions, focusedMinutes: timer.focusedMinutes, tasksDone }

    // Always persist locally
    saveDay(viewDate, data)

    // Debounced cloud save (only when logged in)
    if (!user) return
    if (cloudSaveTimer.current) clearTimeout(cloudSaveTimer.current)
    cloudSaveTimer.current = setTimeout(() => {
      cloudUpsertDay(user.id, viewDate, data)
    }, 800)
  }, [blocks, tasksDone, timer.sessions, timer.focusedMinutes, isLoaded, isPastDay, viewDate, user])

  // ── Reload timer stats when viewed day changes ──────────────────────────
  useEffect(() => {
    const { initFromData } = timer
    const raw = localStorage.getItem('lockin_' + viewDate)
    const data = raw ? (() => { try { return JSON.parse(raw) } catch { return null } })() : null
    if (data) initFromData(data.sessions ?? 0, data.focusedMinutes ?? 0)
    else initFromData(0, 0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewDate])

  // ── UI ──────────────────────────────────────────────────────────────────
  const handleToggleBlock = (id: string) => {
    toggleBlock(id)
    const block = blocks.find(b => b.id === id)
    if (block && !block.completed) showToast('Task locked in!', '✅')
  }

  const xp          = timer.sessions * 10 + tasksDone * 5
  const completePct = blocks.length > 0 ? Math.round((tasksDone / blocks.length) * 100) : 0
  const tomorrow    = addDays(todayStr(), 1)

  return (
    <>
      <Header
        theme={theme}
        onToggle={toggleTheme}
        dateStr={viewDate}
        streak={streak}
        xp={xp}
        user={user}
        authLoading={authLoading}
        onSignIn={signInWithGoogle}
        onSignOut={signOut}
      />

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
