import { useState, useEffect } from 'react'
import { analyticsApi } from '../services/leads'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

const COLORS = { new:'#00f5a0', contacted:'#9d7cf8', converted:'#fbbf24', lost:'#f87171', facebook:'#1877f2', instagram:'#e1306c' }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-s2 border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-muted mb-1 font-mono">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState(null)
  const [trend, setTrend]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([analyticsApi.summary(), analyticsApi.trend(30)])
      .then(([s, t]) => {
        setSummary(s)
        setTrend((t.trend || []).map(d => ({
          day: format(parseISO(d.day), 'MMM d'),
          count: Number(d.count),
        })))
      })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => <div key={i} className="card h-64 animate-pulse" />)}
    </div>
  )

  const statusData = summary ? [
    { name: 'New',       value: summary.new       || 0, color: COLORS.new       },
    { name: 'Contacted', value: summary.contacted  || 0, color: COLORS.contacted },
    { name: 'Converted', value: summary.converted  || 0, color: COLORS.converted },
    { name: 'Lost',      value: summary.lost       || 0, color: COLORS.lost      },
  ] : []

  const sourceData = summary ? [
    { name: 'Facebook',  value: summary.facebook  || 0, color: COLORS.facebook  },
    { name: 'Instagram', value: summary.instagram || 0, color: COLORS.instagram },
  ] : []

  const convRate = summary?.total
    ? ((summary.converted / summary.total) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div>
        <h1 className="font-syne font-bold text-2xl">Analytics</h1>
        <p className="text-muted text-sm mt-0.5">Last 30 days overview</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads',       value: summary?.total,     color: '#4d9eff' },
          { label: 'Conversion Rate',   value: convRate + '%',     color: '#fbbf24' },
          { label: 'Converted',         value: summary?.converted, color: '#00f5a0' },
          { label: 'Avg Response Time', value: summary?.avg_response_minutes != null
            ? (summary.avg_response_minutes < 60
              ? `${Math.round(summary.avg_response_minutes)} min`
              : `${(summary.avg_response_minutes / 60).toFixed(1)} hr`)
            : '—',
            color: '#9d7cf8' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <p className="text-[10px] text-dim font-mono uppercase tracking-wider mb-2">{label}</p>
            <p className="font-syne font-extrabold text-2xl" style={{ color }}>{value ?? '—'}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lead Trend */}
        <div className="card p-5">
          <p className="font-syne font-bold text-sm mb-4">📈 Lead Volume — Last 30 Days</p>
          {trend.length === 0 ? (
            <p className="text-dim text-sm text-center py-10">No trend data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00f5a0" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#00f5a0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill:'#6b6b80', fontSize:10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill:'#6b6b80', fontSize:10 }} axisLine={false} tickLine={false} width={25} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Leads" stroke="#00f5a0" strokeWidth={2} fill="url(#grad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="card p-5">
          <p className="font-syne font-bold text-sm mb-4">🎯 Status Breakdown</p>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" strokeWidth={0}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {statusData.map(({ name, value, color }) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-xs text-muted">{name}</span>
                  </div>
                  <span className="font-mono text-xs font-bold" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Source Breakdown */}
        <div className="card p-5">
          <p className="font-syne font-bold text-sm mb-4">📱 Leads by Source</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={sourceData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill:'#6b6b80', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#6b6b80', fontSize:10 }} axisLine={false} tickLine={false} width={25} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Leads" radius={[6,6,0,0]}>
                {sourceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Funnel */}
        <div className="card p-5">
          <p className="font-syne font-bold text-sm mb-5">🔻 Conversion Funnel</p>
          <div className="space-y-2.5">
            {(() => {
              const funnelData = [
                { label: 'Total Leads', value: summary?.total     || 0, color: '#4d9eff' },
                { label: 'New',         value: summary?.new       || 0, color: '#00f5a0' },
                { label: 'Contacted',   value: summary?.contacted || 0, color: '#9d7cf8' },
                { label: 'Converted',   value: summary?.converted || 0, color: '#fbbf24' },
              ]
              const maxVal = Math.max(funnelData[0].value, 1) // Avoid division by zero
              return funnelData.map(({ label, value, color }) => {
                const widthPct = Math.max((value / maxVal) * 100, 8) // Minimum 8% so labels are visible
                return (
                  <div key={label} className="flex items-center gap-3" style={{ width: `${widthPct}%` }}>
                    <div
                      className="flex items-center justify-between flex-1 px-3 py-2 rounded-xl border"
                      style={{ background: color+'12', borderColor: color+'30' }}
                    >
                      <span className="text-xs font-medium" style={{ color }}>{label}</span>
                      <span className="font-syne font-bold text-sm" style={{ color }}>{value}</span>
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
