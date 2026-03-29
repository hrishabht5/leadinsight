import { useState, useCallback } from 'react'

/**
 * usePagination — manages page state and exposes a loadMore helper.
 *
 * Usage:
 *   const { items, total, loading, loadMore, reset } = usePagination(fetchFn, { pageSize: 50 })
 *
 * fetchFn receives ({ page, pageSize, ...extra }) and must return { data: [], total: N }
 */
export function usePagination(fetchFn, { pageSize = 50 } = {}) {
  const [items, setItems]     = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const load = useCallback(async (p = 1, extra = {}) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn({ page: p, page_size: pageSize, ...extra })
      if (p === 1) setItems(result.leads ?? result.data ?? [])
      else         setItems(prev => [...prev, ...(result.leads ?? result.data ?? [])])
      setTotal(result.total ?? 0)
      setPage(p)
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchFn, pageSize])

  const loadMore = useCallback((extra = {}) => load(page + 1, extra), [load, page])

  const reset = useCallback((extra = {}) => {
    setItems([])
    setTotal(0)
    setPage(1)
    return load(1, extra)
  }, [load])

  const hasMore = items.length < total

  return { items, total, loading, error, page, hasMore, load, loadMore, reset }
}
