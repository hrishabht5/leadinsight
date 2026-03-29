import { useState } from 'react'
import { X, UserPlus } from 'lucide-react'
import { leadsApi } from '../services/leads'
import toast from 'react-hot-toast'

const SOURCES = ['facebook', 'instagram']

const EMPTY = { name: '', phone: '', email: '', city: '', source: 'facebook', campaign_name: '' }

export default function AddLeadModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  function set(k, v) {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    return e
  }

  async function handleSubmit(evt) {
    evt.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        city:  form.city.trim()  || null,
        source: form.source,
        campaign_name: form.campaign_name.trim() || null,
      }
      const lead = await leadsApi.create(payload)
      toast.success('Lead added successfully')
      onCreated?.(lead)
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to add lead')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative card w-full max-w-md p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-green" />
            <h2 className="font-syne font-bold text-lg">Add Lead Manually</h2>
          </div>
          <button onClick={onClose} className="text-dim hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs text-muted mb-1.5">Full Name <span className="text-red">*</span></label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Ahmed Al-Rashid"
              className={`input ${errors.name ? 'border-red/50' : ''}`}
            />
            {errors.name && <p className="text-red text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Phone + Source row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1.5">Phone</label>
              <input
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+966 5xx xxx xxx"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Source</label>
              <select
                value={form.source}
                onChange={e => set('source', e.target.value)}
                className="input cursor-pointer"
              >
                {SOURCES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs text-muted mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="name@example.com"
              className={`input ${errors.email ? 'border-red/50' : ''}`}
            />
            {errors.email && <p className="text-red text-xs mt-1">{errors.email}</p>}
          </div>

          {/* City + Campaign row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1.5">City</label>
              <input
                value={form.city}
                onChange={e => set('city', e.target.value)}
                placeholder="Riyadh"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Campaign</label>
              <input
                value={form.campaign_name}
                onChange={e => set('campaign_name', e.target.value)}
                placeholder="Optional"
                className="input"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
              {saving ? 'Adding…' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
