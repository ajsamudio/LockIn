# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LockIn** — a gamified productivity dashboard for deep focus work. Users plan time blocks, run a Pomodoro timer to stay locked in, and check off completed blocks for visual progress. Built with Vite + React + TypeScript, Supabase for Google auth and cloud sync.

## Product Vision

- **Feel**: Calm focus with gamified engagement — warm and human by default, neon/cyberpunk in dark mode
- **Core loop**: Plan time blocks → run Pomodoro timer → check off blocks → see progress
- **Target**: Personal use first, designed to scale for public launch
- **Features**: Motivational/philosophy quotes (auto-rotating, click to skip), ambient sounds via Web Audio API (brown/pink/white noise + tone), dual-theme toggle (moon/sun), streaks, XP system, day navigation with past-day read-only view
- **Design inspiration**: lifeat.io — immersive, calm, focus-oriented

## Tech Stack

- **Vite + React 19 + TypeScript** — no build step complexity, pure static output
- **Supabase** — Google OAuth + cloud sync (config via `.env`, see `.env.example`)
- **CSS custom properties** — all theming via `:root` and `[data-theme]` overrides, no CSS-in-JS
- **Web Audio API** — procedural ambient noise generation (no external audio files)
- **localStorage** — per-day persistence keyed `lockin_YYYY-MM-DD`

## Development

```bash
npm install
npm run dev        # dev server, hot-reload
npm run build      # TypeScript check + production build
npm run preview    # preview production build
```

Copy `.env.example` → `.env` and fill in your Supabase credentials before running.

## Architecture

### File structure
```
src/
  types.ts              — shared TypeScript interfaces (TimeBlock, DayData, Theme, AmbientTrack)
  App.tsx               — root component, orchestrates all state + persistence
  index.css             — all styles; both themes via CSS custom properties
  lib/
    storage.ts          — localStorage helpers, date utilities, getStreak()
    quotes.ts           — QUOTES array + getRandomQuote()
    sounds.ts           — AMBIENT_TRACKS definitions (noiseType drives Web Audio generation)
    supabase.ts         — Supabase client (reads VITE_ env vars)
  hooks/
    useTheme.ts         — theme toggle, persists to localStorage, sets data-theme on <html>
    useTimer.ts         — all Pomodoro state (remaining, running, phase, sessions, focusedMinutes)
    useBlocks.ts        — blocks CRUD + tasksDone, loads from storage on dateStr change
    useDayNav.ts        — viewDate, navigate(), goToToday(), canGoPrev/canGoNext
    useAmbient.ts       — Web Audio API ambient sound player (create, loop, gain, skip)
  components/
    Header.tsx          — logo, date badge, streak, XP, theme toggle
    TimerPanel.tsx      — SVG ring, presets, controls, session dots, stats
    BlocksPanel.tsx     — scrollable block list, add button, completion badge
    TimeBlock.tsx       — individual block card (name input, duration, checkbox, delete)
    AmbientPlayer.tsx   — sound track selector, play/pause/skip/mute, volume slider
    QuoteDisplay.tsx    — auto-rotating quote with fade transition, click to skip
```

### State + persistence flow
App.tsx owns the persistence layer. `useBlocks` and `useTimer` expose state; App.tsx writes to localStorage via `saveDay()` in a `useEffect` gated on `isLoaded` (prevents saving empty state before the day loads). Timer stats (sessions, focusedMinutes) are reloaded via `timer.initFromData()` when the day changes.

### CSS theming
Two themes: `warm` (light, earthy) and `neon` (dark, cyberpunk). All colors are CSS custom properties on `:root` (warm default) and `[data-theme="neon"]`. `useTheme.ts` sets `data-theme` on `document.documentElement`. To add a third theme, add a `[data-theme="x"]` block overriding the same variable set.

## Key Constraints

- `EARLIEST_DATE` in `storage.ts` gates how far back day navigation goes
- `useBlocks` must expose `isLoaded` — App.tsx's save effect checks it to avoid overwriting real data with empty initial state
- Web Audio `AudioContext` requires user interaction before starting — `useAmbient` initializes lazily on first `play()` call
- The SVG ring circumference (`2π×96`) must match `r="96"` in `TimerPanel.tsx` if ring size changes
- Past days are fully read-only: inputs disabled, add/delete buttons hidden, timer controls dimmed
