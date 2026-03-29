import { useNavigate } from 'react-router-dom'
import { Zap, Bell, Target, Smartphone } from 'lucide-react'

const features = [
  { icon: Zap,        label: 'Real-time webhooks' },
  { icon: Smartphone, label: 'WhatsApp in 1 tap'  },
  { icon: Target,     label: 'FB + IG leads'      },
  { icon: Bell,       label: 'Instant alerts'     },
]

export default function SplashPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 0%, #0d1f3c 0%, #080810 65%)' }}>

      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, #00f5a008 0%, transparent 70%)', animation: 'pulse 4s ease-in-out infinite' }} />

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-2.5 h-2.5 rounded-full bg-green shadow-[0_0_12px_#00f5a0] animate-pulse-slow" />
        <span className="font-syne font-extrabold text-xl">Lead<span className="text-green">Pulse</span></span>
      </div>

      {/* Headline */}
      <h1 className="font-syne font-extrabold text-5xl md:text-6xl leading-[1.05] tracking-[-2px] mb-5 relative z-10">
        Capture leads.<br />
        <span className="text-green" style={{ textShadow: '0 0 40px #00f5a040' }}>Respond instantly.</span><br />
        Convert more.
      </h1>
      <p className="text-muted text-lg max-w-md leading-relaxed mb-10 relative z-10 font-light">
        Your Facebook & Instagram leads — <strong className="text-white font-medium">all in one place</strong>.
        Get notified the second a lead comes in and reach them before your competition does.
      </p>

      {/* Feature pills */}
      <div className="flex flex-wrap gap-2 justify-center mb-10 relative z-10">
        {features.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 bg-s2 border border-white/[0.07] rounded-full px-3 py-1.5 text-xs text-muted">
            <Icon size={13} className="text-green" />{label}
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 relative z-10">
        <button
          onClick={() => navigate('/register')}
          className="btn-primary text-base px-8 py-3.5 rounded-2xl"
        >
          Get Started Free
        </button>
        <button
          onClick={() => navigate('/login')}
          className="btn-ghost text-base px-8 py-3.5 rounded-2xl"
        >
          Sign In
        </button>
      </div>

      <p className="mt-5 text-xs text-dim relative z-10">
        🔒 Secure OAuth 2.0 · Read-only lead access · No posting permissions
      </p>
    </div>
  )
}
