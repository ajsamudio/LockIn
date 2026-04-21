import { useState, useRef, useCallback, useEffect } from 'react'
import { AMBIENT_TRACKS } from '../lib/sounds'
import type { AmbientTrack } from '../types'

type NoiseType = AmbientTrack['noiseType']

function createNoiseBuffer(ctx: AudioContext, type: NoiseType): AudioBuffer {
  const size = ctx.sampleRate * 4
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  if (type === 'brown') {
    let last = 0
    for (let i = 0; i < size; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (last + 0.02 * white) / 1.02
      last = data[i]
      data[i] *= 3.5
    }
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < size; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.96900 * b2 + w * 0.1538520
      b3 = 0.86650 * b3 + w * 0.3104856
      b4 = 0.55000 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
    }
  } else if (type === 'white') {
    for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * 0.4
  } else {
    // tone: 40 Hz low hum with subtle harmonics
    for (let i = 0; i < size; i++) {
      data[i] = (
        Math.sin(2 * Math.PI * 40 * i / ctx.sampleRate) * 0.15 +
        Math.sin(2 * Math.PI * 80 * i / ctx.sampleRate) * 0.07 +
        Math.sin(2 * Math.PI * 432 * i / ctx.sampleRate) * 0.05
      )
    }
  }
  return buffer
}

export function useAmbient() {
  const [trackId, setTrackId] = useState<string>(AMBIENT_TRACKS[0].id)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.4)
  const [muted, setMuted] = useState(false)

  const ctxRef   = useRef<AudioContext | null>(null)
  const srcRef   = useRef<AudioBufferSourceNode | null>(null)
  const gainRef  = useRef<GainNode | null>(null)

  const stopSource = useCallback(() => {
    try { srcRef.current?.stop() } catch { /* already stopped */ }
    srcRef.current = null
  }, [])

  const startSource = useCallback((id: string) => {
    const track = AMBIENT_TRACKS.find(t => t.id === id)
    if (!track) return

    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext()
    }
    const ctx = ctxRef.current
    if (ctx.state === 'suspended') ctx.resume()

    if (!gainRef.current) {
      gainRef.current = ctx.createGain()
      gainRef.current.connect(ctx.destination)
    }
    gainRef.current.gain.value = muted ? 0 : volume

    stopSource()
    const buffer = createNoiseBuffer(ctx, track.noiseType)
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.loop = true
    src.connect(gainRef.current)
    src.start()
    srcRef.current = src
  }, [volume, muted, stopSource])

  const play = useCallback((id?: string) => {
    const target = id ?? trackId
    if (id) setTrackId(id)
    startSource(target)
    setPlaying(true)
  }, [trackId, startSource])

  const pause = useCallback(() => {
    stopSource()
    setPlaying(false)
  }, [stopSource])

  const toggle = useCallback(() => {
    playing ? pause() : play()
  }, [playing, play, pause])

  const skip = useCallback(() => {
    const idx = AMBIENT_TRACKS.findIndex(t => t.id === trackId)
    const next = AMBIENT_TRACKS[(idx + 1) % AMBIENT_TRACKS.length]
    play(next.id)
  }, [trackId, play])

  const toggleMute = useCallback(() => {
    setMuted(m => {
      if (gainRef.current) gainRef.current.gain.value = m ? volume : 0
      return !m
    })
  }, [volume])

  const changeVolume = useCallback((v: number) => {
    setVolume(v)
    if (gainRef.current && !muted) gainRef.current.gain.value = v
  }, [muted])

  useEffect(() => () => { stopSource(); ctxRef.current?.close() }, [stopSource])

  const currentTrack = AMBIENT_TRACKS.find(t => t.id === trackId)!

  return { currentTrack, playing, volume, muted, play, pause, toggle, skip, toggleMute, changeVolume, tracks: AMBIENT_TRACKS }
}
