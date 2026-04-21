import { useEffect, useRef } from 'react'
import type { TimeBlock as TBlock } from '../types'
import { blockColor } from '../hooks/useBlocks'

interface Props {
  block: TBlock
  index: number
  isPastDay: boolean
  onUpdate: (id: string, patch: Partial<TBlock>) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  isNew?: boolean
}

export function TimeBlock({ block, index, isPastDay, onUpdate, onDelete, onToggle, isNew }: Props) {
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isNew && nameRef.current) nameRef.current.focus()
  }, [isNew])

  return (
    <div className={`time-block${block.completed ? ' completed' : ''}${isNew ? ' entering' : ''}`}>
      <div className="block-accent-bar" style={{ background: blockColor(index) }} />

      <div className="block-content">
        <input
          ref={nameRef}
          className="block-name"
          type="text"
          placeholder="What are you working on?"
          value={block.name}
          disabled={isPastDay}
          onChange={e => onUpdate(block.id, { name: e.target.value })}
        />
        <div className="block-meta">
          <span className="duration-icon">⏱</span>
          <input
            className="block-duration"
            type="number"
            min={1}
            max={480}
            value={block.duration}
            disabled={isPastDay}
            onChange={e => onUpdate(block.id, { duration: parseInt(e.target.value) || 30 })}
          />
          <span className="duration-label">min</span>
        </div>
      </div>

      <div className="block-actions">
        {!isPastDay && (
          <button className="delete-btn" onClick={() => onDelete(block.id)} title="Remove">✕</button>
        )}
        <input
          className="block-check"
          type="checkbox"
          checked={block.completed}
          disabled={isPastDay}
          onChange={() => onToggle(block.id)}
          title={block.completed ? 'Mark incomplete' : 'Mark complete'}
        />
      </div>
    </div>
  )
}
