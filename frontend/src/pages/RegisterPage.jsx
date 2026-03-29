import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', full_name: '', workspace_name: '' })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Welcome to LeadPulse.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #0d1f3c 0%, #080810 65%)' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-2 h-2 rounded-full bg-green shadow-[0_0_8px_#00f5a0] animate-pulse-slow" />
          <span className="font-syne font-extrabold text-xl">Lead<span className="text-green">Pulse</span></span>
        </div>

        <h2 className="font-syne font-bold text-2xl mb-1">Create your account</h2>
        <p className="text-muted text-sm mb-7">Free forever · No credit card required</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { k: 'full_name',       label: 'Full Name',      type: 'text',     placeholder: 'Rahul Sharma'           },
            { k: 'workspace_name',  label: 'Business Name',  type: 'text',     placeholder: 'Sharma Realty'          },
            { k: 'email',           label: 'Work Email',     type: 'email',    placeholder: 'you@company.com'        },
            { k: 'password',        label: 'Password',       type: 'password', placeholder: '8+ characters'          },
          ].map(({ k, label, type, placeholder }) => (
            <div key={k}>
              <label className="block text-xs text-muted mb-1.5 font-mono uppercase tracking-wider">{label}</label>
              <input
                type={type} required
                value={form[k]}
                onChange={set(k)}
                placeholder={placeholder}
                className="input"
              />
            </div>
          ))}

          <button
            type="submit" disabled={loading}
            className="btn-primary w-full py-3 text-base mt-2 disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-green hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
