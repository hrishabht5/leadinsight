import { useEffect, useRef, useCallback, useState } from 'react'

/**
 * useSSE — connects to the backend SSE stream and fires callbacks.
 * Automatically reconnects with exponential backoff.
 *
 * @param {Function} onNewLead       - called with lead data object
 * @param {Function} onStatusUpdate  - called with { lead_id, status }
 * @param {boolean}  enabled         - set false to skip (e.g. not logged in)
 */
const MAX_RETRIES = 20
const INITIAL_DELAY = 5000   // 5 seconds
const MAX_DELAY = 60000      // 60 seconds

export function useSSE({ onNewLead, onStatusUpdate, enabled = true }) {
  const esRef       = useRef(null)
  const retryTimer  = useRef(null)
  const retryCount  = useRef(0)
  const [connected, setConnected] = useState(false)

  const connect = useCallback(() => {
    if (!enabled) return
    const token = localStorage.getItem('lp_token')
    if (!token) return

    // Don't exceed max retries
    if (retryCount.current >= MAX_RETRIES) {
      console.warn('[SSE] Max reconnect attempts reached. Call support or refresh the page.')
      return
    }

    // EventSource doesn't support headers natively in all browsers.
    // We pass the token as a query param — the backend reads it.
    const baseUrl = import.meta.env.VITE_API_URL || ''
    const url = `${baseUrl}/api/v1/leads/stream?token=${token}`
    const es  = new EventSource(url)
    esRef.current = es

    es.onopen = () => {
      retryCount.current = 0  // Reset on successful connection
      setConnected(true)
    }

    es.onmessage = (e) => {
      try {
        const { type, data } = JSON.parse(e.data)
        if (type === 'new_lead' && onNewLead)          onNewLead(data)
        if (type === 'status_updated' && onStatusUpdate) onStatusUpdate(data)
      } catch { /* malformed event — ignore */ }
    }

    es.onerror = () => {
      es.close()
      setConnected(false)
      retryCount.current += 1

      // Exponential backoff: 5s, 10s, 20s, 40s, ... capped at 60s
      const delay = Math.min(INITIAL_DELAY * Math.pow(2, retryCount.current - 1), MAX_DELAY)
      console.debug(`[SSE] Reconnecting in ${delay / 1000}s (attempt ${retryCount.current}/${MAX_RETRIES})`)
      retryTimer.current = setTimeout(connect, delay)
    }
  }, [enabled, onNewLead, onStatusUpdate])

  useEffect(() => {
    connect()
    return () => {
      esRef.current?.close()
      clearTimeout(retryTimer.current)
    }
  }, [connect])

  return { connected }
}

