import { useTimer } from '../hooks/useTimer'

const PRESETS = [15, 25, 30, 45, 60]
const R = 96
const CIRC = 2 * Math.PI * R

interface Props {
  timer: ReturnType<typeof useTimer>
  isPastDay: boolean
}

function ringColor(progress: number): string {
  if (progress > 0.5) return 'var(--ring-color)'
  if (progress > 0.2) return 'var(--ring-mid)'
  return 'var(--ring-low)'
}

export function TimerPanel({ timer, isPastDay }: Props) {
  const {
    remaining, running, phase, sessions, focusedMinutes,
    progress, ringOffset, dotsFilled,
    totalSeconds, SESSIONS_PER_ROUND,
    start, pause, reset, skip, setDuration,
  } = timer

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const currentPreset = PRESETS.find(p => p * 60 === totalSeconds) ?? null

  const phaseLabel: Record<typeof phase, string> = {
    ready: 'Ready',
    focusing: 'Focusing…',
    paused: 'Paused',
    done: 'Session done!',
  }

  return (
    <section className={`panel timer-panel${isPastDay ? ' past-day' : ''}`}>
      <span className="timer-label">Pomodoro</span>

      {/* Ring */}
      <div className="ring-wrap">
        <svg className="timer-svg" width="220" height="220" viewBox="0 0 220 220">
          <circle className="ring-bg-circle" cx="110" cy="110" r={R} />
          <circle
            className="ring-progress-circle"
            cx="110" cy="110" r={R}
            strokeDasharray={CIRC}
            strokeDashoffset={ringOffset}
            stroke={ringColor(progress)}
          />
        </svg>
        <div className="timer-inner">
          <div className="timer-display">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
          <div className="timer-phase">{phaseLabel[phase]}</div>
        </div>
      </div>

      {/* Session dots */}
      <div className="session-dots">
        {Array.from({ length: SESSIONS_PER_ROUND }, (_, i) => (
          <div
            key={i}
            className={`dot${i < dotsFilled ? ' done' : i === dotsFilled && running ? ' current' : ''}`}
          />
        ))}
      </div>

      {/* Presets */}
      <div className="presets-row">
        {PRESETS.map(p => (
          <button
            key={p}
            className={`preset-btn${currentPreset === p ? ' active' : ''}`}
            onClick={() => setDuration(p)}
          >
            {p}m
          </button>
        ))}
      </div>

      {/* Custom duration */}
      <div className="custom-row">
        <label htmlFor="custom-dur">Custom:</label>
        <input
          id="custom-dur"
          className="custom-input"
          type="number"
          min={1}
          max={180}
          value={Math.floor(totalSeconds / 60)}
          onChange={e => setDuration(Math.max(1, Math.min(180, parseInt(e.target.value) || 1)))}
        />
        <span>min</span>
      </div>

      {/* Controls */}
      <div className="ctrl-row">
        <button className="ctrl-btn secondary" onClick={reset} title="Reset">↺</button>
        <button
          className={`ctrl-btn primary${running ? ' running' : ''}`}
          onClick={running ? pause : start}
          title={running ? 'Pause' : 'Start'}
        >
          {running ? '⏸' : '▶'}
        </button>
        <button className="ctrl-btn secondary" onClick={skip} title="Skip session">⏭</button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat">
          <span className="stat-val">{sessions}</span>
          <span className="stat-label">Sessions</span>
        </div>
        <div className="stat">
          <span className="stat-val">{focusedMinutes}m</span>
          <span className="stat-label">Focused</span>
        </div>
      </div>
    </section>
  )
}
