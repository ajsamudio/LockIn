import { useState, useEffect, useRef } from 'react'
import { getRandomQuote } from '../lib/quotes'
import type { Quote } from '../lib/quotes'

const INTERVAL_MS = 35_000

export function QuoteDisplay() {
  const [quote, setQuote] = useState<Quote>(() => getRandomQuote())
  const [fading, setFading] = useState(false)
  const quoteRef = useRef(quote)
  quoteRef.current = quote

  const nextQuote = () => {
    setFading(true)
    setTimeout(() => {
      setQuote(getRandomQuote(quoteRef.current))
      setFading(false)
    }, 400)
  }

  useEffect(() => {
    const id = setInterval(nextQuote, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={`quote-wrap${fading ? ' fading' : ''}`} onClick={nextQuote} title="Click for next quote">
      <div className="quote-text">"{quote.text}"</div>
      <div className="quote-author">— {quote.author}</div>
    </div>
  )
}
