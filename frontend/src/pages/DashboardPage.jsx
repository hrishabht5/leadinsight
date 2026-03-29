import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { leadsApi, analyticsApi } from '../services/leads'
import { useDebounce } from '../hooks/useDebounce'
import StatCard    from '../components/StatCard'
import LeadCard    from '../components/LeadCard'
import LeadPanel   from '../components/LeadPanel'
import EmptyState  from '../components/EmptyState'
import { LeadListSkeleton, StatsSkeleton } from '../components/Skeletons'
import { Search, Zap, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const FILTERS = [
  { key: 'all',       label: 'All'          },
  { key: 'new',       label: '🟢 New'       },
  { key: 'contacted', label: '🟣 Contacted' },
  { key: 'converted', label: '🟡 Converted' },
  { key: 'lost',      label: '🔴 Lost'      },
]

export default function DashboardPage() {
  const { flashIds, setNewCount } = useOutletContext() || {}

  const [leads, setLeads]         = useState([])
  const [stats, setStats]         = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [leadsLoading, setLeadsLoading] = useState(true)
  const [filter, setFilter]       = useState('all')
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(null)
  const [page, setPage]           = useState(1)
  const [total, setTotal]         = useState(0)

  const debouncedSearch = useDebounce(search, 350)

  // ── Fetch helpers ────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const data = await analyticsApi.summary()
      setStats(data)
    } catch { /* silent */ } finally {
      setStatsLoading(false)
    }
  }, [])

  const fetchLeads = useCallback(async ({ f = filter, s = debouncedSearch, p = 1 } = {}) => {
    setLeadsLoading(true)
    try {
      const params = { page: p, page_size: 30 }
      if (f !== 'all') params.status = f
      if (s)           params.search = s
      const data = await leadsApi.list(params)
      if (p === 1) setLeads(data.leads)
      else         setLeads(prev => [...prev, ...data.leads])
      setTotal(data.total)
      setPage(p)
    } catch {
      toast.error('Failed to load leads')
    } finally {
      setLeadsLoading(false)
    }
  }, [filter, debouncedSearch])

  // Initial load
  useEffect(() => {
    fetchStats()
    fetchLeads({ p: 1 })
  }, [])

  // Re-fetch on filter / debounced search change
  useEffect(() => {
    fetchLeads({ f: filter, s: debouncedSearch, p: 1 })
  }, [filter, debouncedSearch])

  // ── SSE listeners (dispatched by AppLayout) ─────────────────────────────
  useEffect(() => {
    const onNew = (e) => {
      const lead = e.detail
      setLeads(prev => [lead, ...prev])
      setTotal(t => t + 1)
      setStats(s => s ? { ...s, total: (s.total||0)+1, new: (s.new||0)+1 } : s)
      setNewCount?.(c => Math.max(0, c - 1))
    }
    const onStatus = (e) => {
      const { lead_id, status } = e.detail
      setLeads(prev => prev.map(l => l.id === lead_id ? { ...l, status } : l))
    }
    window.addEventListener('lp:new_lead',      onNew)
    window.addEventListener('lp:status_updated', onStatus)
    return () => {
      window.removeEventListener('lp:new_lead',      onNew)
      window.removeEventListener('lp:status_updated', onStatus)
    }
  }, [setNewCount])

  // ── Handlers ────────────────────────────────────────────────────────────
  function handleFilterChange(f) {
    setFilter(f)
    // fetchLeads triggered by effect
  }

  function handleStatusChange(id, status) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    fetchStats()
  }

  async function openLead(lead) {
    try {
      const full = await leadsApi.get(lead.id)
      setSelected(full)
    } catch { setSelected(lead) }
  }

  function simulateLead() {
    const names = ['Priya Sharma','Rahul Verma','Neha Gupta','Arjun Mehta','Sunita Joshi','Vikram Patel']
    const campaigns = ['Summer Sale 2024','Brand Awareness','Lead Gen Mumbai','Free Consultation','Diwali Offer']
    const mock = {
      id:            'demo_' + Date.now(),
      name:          names[Math.floor(Math.random() * names.length)],
      phone:         '+91 98765 ' + Math.floor(10000 + Math.random() * 89999),
      email:         'demo@example.com',
      source:        Math.random() > 0.5 ? 'facebook' : 'instagram',
      status:        'new',
      campaign_name: campaigns[Math.floor(Math.random() * campaigns.length)],
      city:          ['Mumbai','Delhi','Bangalore','Pune'][Math.floor(Math.random()*4)],
      created_at:    new Date().toISOString(),
      notes:         [],
    }
    window.dispatchEvent(new CustomEvent('lp:new_lead', { detail: mock }))
    toast.success(`⚡ Simulated lead: ${mock.name}`)
  }

  const hasMore = leads.length < total

  return (
    <div className="p-5 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-syne font-bold text-2xl">Dashboard</h1>
          <p className="text-muted text-sm mt-0.5">Real-time leads from Facebook & Instagram</p>
        </div>
        <button
          onClick={() => { fetchLeads({ p: 1 }); fetchStats() }}
          className="btn-ghost flex items-center gap-1.5 text-xs"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats */}
      {statsLoading ? <StatsSkeleton /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="New Leads"  value={stats?.new}       color="green"  sub="Awaiting response" />
          <StatCard label="Contacted"  value={stats?.contacted} color="purple" sub="In conversation"   />
          <StatCard label="Converted"  value={stats?.converted} color="amber"  sub="Deals closed"      />
          <StatCard label="Total"      value={stats?.total}     color="blue"   sub="All time"          />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, campaign…"
            className="input pl-8"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all whitespace-nowrap
                ${filter === key
                  ? 'bg-green/10 border-green/30 text-green'
                  : 'bg-s2 border-white/[0.07] text-muted hover:border-white/[0.12] hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button onClick={simulateLead} className="btn-primary flex items-center gap-1.5 text-xs whitespace-nowrap">
          <Zap size={13} /> Simulate Lead
        </button>
      </div>

      {/* Lead list */}
      {leadsLoading && page === 1 ? (
        <LeadListSkeleton count={6} />
      ) : leads.length === 0 ? (
        <EmptyState
          icon="📭"
          title="No leads yet"
          description={
            search || filter !== 'all'
              ? 'No leads match your current filter. Try adjusting the search or status.'
              : 'Click ⚡ Simulate Lead to test the flow, or connect your Facebook Ads account in Settings.'
          }
          action={search || filter !== 'all'
            ? { label: 'Clear filters', onClick: () => { setSearch(''); setFilter('all') } }
            : undefined}
        />
      ) : (
        <div className="space-y-2">
          {leads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              flash={flashIds?.has(lead.id)}
              onClick={() => openLead(lead)}
            />
          ))}
          {hasMore && (
            <button
              onClick={() => fetchLeads({ f: filter, s: debouncedSearch, p: page + 1 })}
              disabled={leadsLoading}
              className="w-full btn-ghost py-3 text-sm disabled:opacity-50"
            >
              {leadsLoading ? 'Loading…' : `Load more (${total - leads.length} remaining)`}
            </button>
          )}
        </div>
      )}

      {/* Lead detail panel */}
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
