import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { parseBraindumpLine } from '../lib/storage'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (items: Array<{ name: string; duration: number }>) => void
}

type Step = 'input' | 'preview'

export default function BraindumpModal({ isOpen, onClose, onConfirm }: Props) {
  const [step, setStep] = useState<Step>('input')
  const [raw, setRaw] = useState('')
  const [items, setItems] = useState<Array<{ name: string; duration: number }>>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      setStep('input')
      setRaw('')
      setItems([])
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handlePreview = () => {
    const parsed = raw
      .split('\n')
      .map(parseBraindumpLine)
      .filter((x): x is { name: string; duration: number } => x !== null)
    setItems(parsed)
    setStep('preview')
  }

  const handleDurationChange = (index: number, val: string) => {
    const parsed = parseInt(val)
    const duration = isNaN(parsed) ? 25 : Math.min(480, Math.max(1, parsed))
    setItems(prev => prev.map((item, i) => i === index ? { ...item, duration } : item))
  }

  const handleNameChange = (index: number, val: string) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, name: val } : item))
  }

  const handleConfirm = () => {
    const valid = items.filter(item => item.name.trim())
    onConfirm(valid)
    onClose()
  }

  const hasInput = raw.trim().length > 0
  const validCount = items.filter(item => item.name.trim()).length

  const modal = (
    <div className="braindump-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="braindump-modal">
        <div className="braindump-title">
          {step === 'input' ? '⚡ Braindump' : `Preview — ${validCount} block${validCount !== 1 ? 's' : ''}`}
        </div>

        {step === 'input' && (
          <>
            <p className="braindump-hint">One thought per line. Use <code>[30] task</code> or <code>task (30m)</code> to set duration. Default is 25 min.</p>
            <textarea
              ref={textareaRef}
              className="braindump-textarea"
              value={raw}
              onChange={e => setRaw(e.target.value)}
              placeholder={"Review PR from Jake\n[45] Write auth service\nUpdate deployment docs (15m)\nFix login bug"}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && hasInput) {
                  e.preventDefault()
                  handlePreview()
                }
              }}
            />
            <div className="braindump-actions">
              <button className="braindump-back-btn" onClick={onClose}>Cancel</button>
              <button className="braindump-confirm-btn" onClick={handlePreview} disabled={!hasInput}>
                Preview →
              </button>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <div className="braindump-preview">
              {items.map((item, i) => (
                <div key={i} className="braindump-item">
                  <input
                    className="braindump-item-name"
                    value={item.name}
                    onChange={e => handleNameChange(i, e.target.value)}
                    placeholder="Task name"
                  />
                  <input
                    className="braindump-item-duration"
                    type="number"
                    min={1}
                    max={480}
                    value={item.duration}
                    onChange={e => handleDurationChange(i, e.target.value)}
                  />
                  <span className="braindump-item-label">min</span>
                  <button
                    className="braindump-item-delete"
                    onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
                    title="Remove"
                  >×</button>
                </div>
              ))}
            </div>
            <div className="braindump-actions">
              <button className="braindump-back-btn" onClick={() => setStep('input')}>← Back</button>
              <button className="braindump-confirm-btn" onClick={handleConfirm} disabled={validCount === 0}>
                Add {validCount} block{validCount !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
