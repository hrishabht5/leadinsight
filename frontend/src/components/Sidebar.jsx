import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usersApi } from '../services/leads'
import {
  LayoutDashboard, Users, BarChart3, Settings, LogOut, Zap
} from 'lucide-react'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads',     icon: Users,           label: 'All Leads'  },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics'  },
  { to: '/settings',  icon: Settings,        label: 'Settings'   },
]

export default function Sidebar({ newCount }) {
  const { logout } = useAuth()
  const navigate   = useNavigate()
  const [connStatus, setConnStatus] = useState({ connected: false, pageCount: 0 })

  // Fetch actual connection status on mount
  useEffect(() => {
    usersApi.getConnectionStatus()
      .then(setConnStatus)
      .catch(() => {})
  }, [])

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[220px] bg-s1 border-r border-white/[0.07] flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.07] flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-green shadow-[0_0_8px_#00f5a0] animate-pulse-slow" />
        <span className="font-syne font-extrabold text-xl tracking-tight">Lead<span className="text-green">Pulse</span></span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        <p className="px-5 py-2 text-[10px] text-dim uppercase tracking-[0.1em] font-mono">Main</p>
        {links.slice(0, 2).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} />
            <span>{label}</span>
            {to === '/dashboard' && newCount > 0 && (
              <span className="ml-auto bg-green text-black text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {newCount}
              </span>
            )}
          </NavLink>
        ))}

        <p className="px-5 py-2 mt-2 text-[10px] text-dim uppercase tracking-[0.1em] font-mono">Insights</p>
        {links.slice(2).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.07] space-y-2">
        <div className="flex items-center gap-2.5 bg-s2 border border-white/[0.07] rounded-xl p-3">
          {connStatus.connected ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-green shadow-[0_0_6px_#00f5a0] animate-pulse-slow flex-shrink-0" />
              <div>
                <p className="text-white text-[11px] font-semibold">Webhook Active</p>
                <p className="text-muted text-[10px]">{connStatus.pageCount} page{connStatus.pageCount !== 1 ? 's' : ''} connected</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-dim flex-shrink-0" />
              <div>
                <p className="text-muted text-[11px] font-semibold">No Integrations</p>
                <p className="text-dim text-[10px]">Connect in Settings</p>
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="nav-item w-full text-left text-red/70 hover:text-red hover:bg-red/5"
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

