import { useRef } from 'react'
import type { TimeBlock } from '../types'
import { TimeBlock as TimeBlockCard } from './TimeBlock'

interface Props {
  blocks: TimeBlock[]
  tasksDone: number
  isPastDay: boolean
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<TimeBlock>) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
}

export function BlocksPanel({ blocks, tasksDone, isPastDay, onAdd, onUpdate, onDelete, onToggle }: Props) {
  const lastAddedIdRef = useRef<string | null>(null)

  const handleAdd = () => {
    onAdd()
    // mark next render's new block — resolved in TimeBlock via isNew prop
    lastAddedIdRef.current = 'next'
  }

  const completePct = blocks.length > 0 ? Math.round((tasksDone / blocks.length) * 100) : 0

  return (
    <section className="panel blocks-panel">
      <div className="blocks-header">
        <span className="blocks-title">Time Blocks</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {tasksDone > 0 && (
            <span className="completion-badge">✓ {tasksDone}/{blocks.length} · {completePct}%</span>
          )}
          <span className="blocks-count">{blocks.length} block{blocks.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="blocks-scroll">
        {blocks.length === 0 && (
          <div className="empty-day">
            {isPastDay ? 'No data recorded for this day.' : 'No blocks yet.\nAdd one below to get started.'}
          </div>
        )}

        {blocks.map((block, i) => (
          <TimeBlockCard
            key={block.id}
            block={block}
            index={i}
            isPastDay={isPastDay}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onToggle={onToggle}
            isNew={lastAddedIdRef.current === block.id}
          />
        ))}

        {!isPastDay && (
          <button className="add-btn" onClick={handleAdd}>
            <span style={{ fontSize: '1rem' }}>+</span>
            Add time block
          </button>
        )}
      </div>
    </section>
  )
}
