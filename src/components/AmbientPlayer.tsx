import { useAmbient } from '../hooks/useAmbient'

export function AmbientPlayer() {
  const { currentTrack, playing, volume, muted, toggle, skip, toggleMute, changeVolume, tracks, play } = useAmbient()

  return (
    <div className="ambient-player">
      <span className="ambient-track-icon">{currentTrack.icon}</span>
      <span className="ambient-track-name">{currentTrack.label}</span>

      {/* Track selector */}
      {tracks.map(t => (
        <button
          key={t.id}
          className={`ambient-btn${currentTrack.id === t.id ? ' active' : ''}`}
          onClick={() => play(t.id)}
          title={t.label}
        >
          {t.icon}
        </button>
      ))}

      <button className={`ambient-btn${playing ? ' active' : ''}`} onClick={toggle} title={playing ? 'Pause' : 'Play'}>
        {playing ? '⏸' : '▶'}
      </button>

      <button className="ambient-btn" onClick={skip} title="Next sound">
        ⏭
      </button>

      <button className={`ambient-btn${muted ? ' active' : ''}`} onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
        {muted ? '🔇' : '🔊'}
      </button>

      <input
        className="volume-slider"
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={e => changeVolume(parseFloat(e.target.value))}
        title="Volume"
      />
    </div>
  )
}
