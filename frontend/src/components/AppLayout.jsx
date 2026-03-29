import { useState, useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSSE } from '../hooks/useSSE'
import Sidebar from './Sidebar'
import toast from 'react-hot-toast'
import { LayoutDashboard, Users, BarChart3, Settings } from 'lucide-react'

export default function AppLayout() {
  const { user } = useAuth()
  const [newCount, setNewCount]   = useState(0)
  const [flashIds, setFlashIds]   = useState(new Set())
  const navigate = useNavigate()

  // Inject new lead into any page listening via window event
  const handleNewLead = useCallback((lead) => {
    setNewCount(c => c + 1)
    setFlashIds(s => new Set([...s, lead.id]))
    setTimeout(() => setFlashIds(s => { const n = new Set(s); n.delete(lead.id); return n }), 1500)

    // Dispatch so DashboardPage can prepend it
    window.dispatchEvent(new CustomEvent('lp:new_lead', { detail: lead }))

    toast(
      <div className="cursor-pointer" onClick={() => navigate('/dashboard')}>
        <p className="font-syne font-bold text-sm">⚡ New Lead</p>
        <p className="text-muted text-xs mt-0.5">{lead.name} · {lead.phone}</p>
      </div>,
      { duration: 5000 }
    )
  }, [navigate])

  const handleStatusUpdate = useCallback(({ lead_id, status }) => {
    window.dispatchEvent(new CustomEvent('lp:status_updated', { detail: { lead_id, status } }))
  }, [])

  useSSE({ onNewLead: handleNewLead, onStatusUpdate: handleStatusUpdate, enabled: !!user })

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar newCount={newCount} />
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-[220px] flex flex-col pb-16 md:pb-0">
        <Outlet context={{ flashIds, setNewCount }} />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-s1 border-t border-white/[0.07] flex justify-around items-center py-2 z-50 pb-safe">
        {[
          { to: '/dashboard', icon: LayoutDashboard, label: 'Leads'     },
          { to: '/analytics', icon: BarChart3,       label: 'Analytics' },
          { to: '/settings',  icon: Settings,        label: 'Settings'  },
        ].map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl text-[10px] transition-all
             ${isActive ? 'text-green' : 'text-dim'}`
          }>
            {({ isActive }) => (
              <>
                <Icon size={20} className={isActive ? 'text-green' : 'text-dim'} />
                <span>{label}</span>
                {to === '/dashboard' && newCount > 0 && (
                  <span className="absolute top-1 right-1 bg-green text-black text-[9px] font-bold rounded-full px-1">{newCount}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
