import { useEffect, useRef, useCallback } from 'react'

/**
 * useSSE — connects to the backend SSE stream and fires callbacks.
 * Automatically reconnects on disconnect.
 *
 * @param {Function} onNewLead       - called with lead data object
 * @param {Function} onStatusUpdate  - called with { lead_id, status }
 * @param {boolean}  enabled         - set false to skip (e.g. not logged in)
 */
export function useSSE({ onNewLead, onStatusUpdate, enabled = true }) {
  const esRef      = useRef(null)
  const retryTimer = useRef(null)

  const connect = useCallback(() => {
    if (!enabled) return
    const token = localStorage.getItem('lp_token')
    if (!token) return

    // EventSource doesn't support headers natively in all browsers.
    // We pass the token as a query param — the backend reads it.
    const url = `/api/v1/leads/stream?token=${token}`
    const es  = new EventSource(url)
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const { type, data } = JSON.parse(e.data)
        if (type === 'new_lead' && onNewLead)          onNewLead(data)
        if (type === 'status_updated' && onStatusUpdate) onStatusUpdate(data)
      } catch { /* malformed event — ignore */ }
    }

    es.onerror = () => {
      es.close()
      // Reconnect after 5 seconds
      retryTimer.current = setTimeout(connect, 5000)
    }
  }, [enabled, onNewLead, onStatusUpdate])

  useEffect(() => {
    connect()
    return () => {
      esRef.current?.close()
      clearTimeout(retryTimer.current)
    }
  }, [connect])
}
