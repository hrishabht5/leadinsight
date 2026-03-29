import { useState, useCallback } from 'react'
import { leadsApi } from '../services/leads'
import { usePagination } from '../hooks/usePagination'
import { useDebounce } from '../hooks/useDebounce'
import LeadCard   from '../components/LeadCard'
import LeadPanel  from '../components/LeadPanel'
import EmptyState from '../components/EmptyState'
import { LeadListSkeleton } from '../components/Skeletons'
import { Search, SlidersHorizontal } from 'lucide-react'

const STATUSES = ['all','new','contacted','converted','lost']
const SOURCES  = ['all','facebook','instagram']

export default function LeadsPage() {
  const [filters, setFilters]   = useState({ status: 'all', source: 'all' })
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const debouncedSearch = useDebounce(search, 350)

  const fetchFn = useCallback(({ page, page_size }) => {
    const params = { page, page_size }
    if (filters.status !== 'all') params.status = filters.status
    if (debouncedSearch)          params.search = debouncedSearch
    return leadsApi.list(params)
  }, [filters.status, debouncedSearch])

  const { items: leads, total, loading, hasMore, reset, loadMore } = usePagination(fetchFn, { pageSize: 50 })

  // Trigger reset when filters / debounced search change
  const [prevKey, setPrevKey] = useState('')
  const key = `${filters.status}:${filters.source}:${debouncedSearch}`
  if (key !== prevKey) { setPrevKey(key); reset() }

  // Filter by source client-side (API doesn't expose source param directly)
  const displayed = filters.source !== 'all'
    ? leads.filter(l => l.source === filters.source)
    : leads

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: v })) }

  async function openLead(lead) {
    try { setSelected(await leadsApi.get(lead.id)) }
    catch { setSelected(lead) }
  }

  function handleStatusChange(id, status) {
    // Optimistic update — no need to re-fetch
    leads.forEach((l, i) => { if (l.id === id) leads[i] = { ...l, status } })
  }

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div>
        <h1 className="font-syne font-bold text-2xl">All Leads</h1>
        <p className="text-muted text-sm mt-0.5">{total} total leads</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, campaign…"
            className="input pl-8"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal size={14} className="text-dim" />
          <select
            value={filters.status}
            onChange={e => setFilter('status', e.target.value)}
            className="input py-2 text-xs cursor-pointer w-auto"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
          <select
            value={filters.source}
            onChange={e => setFilter('source', e.target.value)}
            className="input py-2 text-xs cursor-pointer w-auto"
          >
            {SOURCES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sources' : s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
          {(filters.status !== 'all' || filters.source !== 'all' || search) && (
            <button
              onClick={() => { setFilters({ status:'all', source:'all' }); setSearch('') }}
              className="text-xs text-muted hover:text-white underline underline-offset-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading && leads.length === 0 ? (
        <LeadListSkeleton count={8} />
      ) : displayed.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No leads found"
          description="Try adjusting your filters or search term."
          action={{ label: 'Clear filters', onClick: () => { setFilters({ status:'all', source:'all' }); setSearch('') } }}
        />
      ) : (
        <>
          <div className="space-y-2">
            {displayed.map(lead => (
              <LeadCard key={lead.id} lead={lead} onClick={() => openLead(lead)} />
            ))}
          </div>
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full btn-ghost py-3 text-sm disabled:opacity-50"
            >
              {loading ? 'Loading…' : `Load more (${total - leads.length} remaining)`}
            </button>
          )}
        </>
      )}

      {selected && (
        <LeadPanel
          lead={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
