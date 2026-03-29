import { useState, useEffect } from 'react'
import { authApi } from '../services/leads'
import { useAuth } from '../context/AuthContext'
import { Check, Copy, ExternalLink, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full border transition-all
        ${value ? 'bg-green/20 border-green/40' : 'bg-s3 border-white/[0.07]'}`}
    >
      <span className={`absolute top-[2px] w-4 h-4 rounded-full transition-all
        ${value ? 'left-[18px] bg-green shadow-[0_0_6px_#00f5a0]' : 'left-[2px] bg-dim'}`} />
    </button>
  )
}

function Section({ title, children }) {
  return (
    <div className="card p-5">
      <h3 className="font-syne font-bold text-[15px] pb-4 mb-4 border-b border-white/[0.07]">{title}</h3>
      {children}
    </div>
  )
}

function SettingRow({ label, desc, children }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [pages, setPages]   = useState([])
  const [copied, setCopied] = useState(false)
  const [notifs, setNotifs] = useState({
    push: true, email: true, whatsapp: false, sound: true,
  })
  const [leadSettings, setLeadSettings] = useState({
    auto_assign: false, dedup: true,
  })

  const webhookUrl = `${import.meta.env.VITE_API_URL || 'https://leadpulse-api-06py.onrender.com'}/webhook/facebook`

  useEffect(() => {
    authApi.getPages()
      .then(data => setPages(data.pages || []))
      .catch(() => {})
  }, [])

  function copyWebhook() {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    toast.success('Webhook URL copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  function connectFacebook() {
    const { VITE_FACEBOOK_APP_ID } = import.meta.env
    if (!VITE_FACEBOOK_APP_ID) {
      toast.error('VITE_FACEBOOK_APP_ID not set in .env')
      return
    }
    const redirect = `${window.location.origin}/settings`
    const url = `https://www.facebook.com/dialog/oauth?client_id=${VITE_FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirect)}&scope=leads_retrieval,pages_manage_metadata,pages_show_list,pages_read_engagement,business_management&response_type=code`
    window.location.href = url
  }

  // Handle OAuth redirect back
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) return
    window.history.replaceState({}, '', '/settings')
    toast.loading('Connecting Facebook…', { id: 'fb' })
    authApi.connectFacebook(code, `${window.location.origin}/settings`)
      .then(data => {
        toast.success(`Connected: ${data.page_name}`, { id: 'fb' })
        authApi.getPages().then(d => setPages(d.pages || []))
      })
      .catch(() => toast.error('Facebook connection failed', { id: 'fb' }))
  }, [])

  return (
    <div className="p-5 md:p-6 space-y-5 max-w-2xl">
      <div>
        <h1 className="font-syne font-bold text-2xl">Settings</h1>
        <p className="text-muted text-sm mt-0.5">Manage your account and integrations</p>
      </div>

      {/* Connected Accounts */}
      <Section title="🔗 Connected Accounts">
        {pages.length > 0 ? (
          <div className="space-y-2 mb-4">
            {pages.map(p => (
              <div key={p.page_id} className="flex items-center gap-3 bg-s2 border border-white/[0.07] rounded-xl p-3">
                <span className="text-2xl">{p.page_id?.startsWith('ig') ? '📸' : '📘'}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{p.page_name || p.page_id}</p>
                  <p className="text-xs text-muted mt-0.5">Connected · Leads active</p>
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-green/10 text-green border border-green/20">
                  LIVE
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted mb-4">No pages connected yet.</p>
        )}
        <button
          onClick={connectFacebook}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-fb/10 border border-fb/20 text-blue text-sm font-semibold hover:bg-fb/20 transition-all"
        >
          <span className="text-base">📘</span>
          {pages.length > 0 ? 'Add Another Facebook Page' : 'Connect Facebook Account'}
          <ExternalLink size={12} className="ml-1 opacity-60" />
        </button>
      </Section>

      {/* Webhook */}
      <Section title="🔌 Webhook Configuration">
        <SettingRow
          label="Webhook URL"
          desc="Paste this into your Meta App Dashboard → Webhooks"
        >
          <button
            onClick={copyWebhook}
            className="flex items-center gap-1.5 btn-ghost text-xs"
          >
            {copied ? <Check size={12} className="text-green" /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </SettingRow>
        <div className="mt-2 bg-s2 border border-white/[0.07] rounded-xl p-3">
          <code className="text-[11px] font-mono text-green break-all">{webhookUrl}</code>
        </div>
        <p className="text-xs text-muted mt-3">
          Set Verify Token to the value of <code className="font-mono bg-s2 px-1 py-0.5 rounded">FACEBOOK_WEBHOOK_VERIFY_TOKEN</code> in your <code className="font-mono bg-s2 px-1 py-0.5 rounded">.env</code>
        </p>
      </Section>

      {/* Notifications */}
      <Section title="🔔 Notifications">
        {[
          { k: 'push',     label: 'Push notifications',  desc: 'Get alerts for new leads on your device'     },
          { k: 'email',    label: 'Email alerts',        desc: 'Daily digest of new leads'                   },
          { k: 'whatsapp', label: 'WhatsApp alerts',     desc: 'Get leads forwarded to your WhatsApp'        },
          { k: 'sound',    label: 'Sound alerts',        desc: 'Play a sound when a new lead arrives'        },
        ].map(({ k, label, desc }) => (
          <SettingRow key={k} label={label} desc={desc}>
            <Toggle value={notifs[k]} onChange={v => setNotifs(n => ({ ...n, [k]: v }))} />
          </SettingRow>
        ))}
      </Section>

      {/* Lead Settings */}
      <Section title="⚙️ Lead Settings">
        {[
          { k: 'auto_assign', label: 'Auto-assign new leads',  desc: 'Route leads to team members automatically'         },
          { k: 'dedup',       label: 'Duplicate detection',    desc: 'Merge leads with the same phone number'            },
        ].map(({ k, label, desc }) => (
          <SettingRow key={k} label={label} desc={desc}>
            <Toggle value={leadSettings[k]} onChange={v => setLeadSettings(s => ({ ...s, [k]: v }))} />
          </SettingRow>
        ))}
      </Section>

      {/* Account Info */}
      <Section title="👤 Account">
        <SettingRow label="Email" desc={user?.email}>
          <span className="text-xs text-muted font-mono">{user?.workspace_id?.slice(0,8)}…</span>
        </SettingRow>
        <SettingRow label="Workspace ID" desc="Your unique workspace identifier">
          <code className="text-[11px] font-mono text-dim">{user?.workspace_id}</code>
        </SettingRow>
      </Section>
    </div>
  )
}
