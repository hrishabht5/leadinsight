import { useState, useEffect } from 'react'

/**
 * useDebounce — delays updating a value until after `delay` ms of inactivity.
 *
 * Usage:
 *   const debouncedSearch = useDebounce(searchInput, 350)
 *   useEffect(() => { fetchLeads(debouncedSearch) }, [debouncedSearch])
 */
export function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
