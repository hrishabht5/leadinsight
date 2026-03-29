import { useState, useEffect } from 'react'
import { X, Phone, MessageCircle, Mail, MessageSquare, Save } from 'lucide-react'
import { leadsApi } from '../services/leads'
import { initials, colorForName, SOURCE_ICONS, timeAgo } from '../utils'
import toast from 'react-hot-toast'

const STATUSES = ['new', 'contacted', 'converted', 'lost']
const STATUS_COLORS = {
  new:       { bg: 'bg-green/10',  text: 'text-green',  border: 'border-green/30'  },
  contacted: { bg: 'bg-purple/10', text: 'text-purple', border: 'border-purple/30' },
  converted: { bg: 'bg-amber/10',  text: 'text-amber',  border: 'border-amber/30'  },
  lost:      { bg: 'bg-red/10',    text: 'text-red',    border: 'border-red/30'    },
}

export default function LeadPanel({ lead, onClose, onStatusChange }) {
  const [status, setStatus]     = useState(lead?.status || 'new')
  const [noteText, setNoteText] = useState('')
  const [notes, setNotes]       = useState(lead?.notes || [])
  const [saving, setSaving]     = useState(false)
  const color = colorForName(lead?.name)

  useEffect(() => {
    if (lead) {
      setStatus(lead.status)
      setNotes(lead.notes || [])
      setNoteText('')
    }
  }, [lead?.id])

  if (!lead) return null

  async function handleStatusChange(s) {
    setStatus(s)
    try {
      await leadsApi.updateStatus(lead.id, s)
      onStatusChange?.(lead.id, s)
      toast.success(`Marked as ${s}`)
    } catch {
      toast.error('Failed to update status')
      setStatus(lead.status)
    }
  }

  async function handleSaveNote() {
    if (!noteText.trim()) return
    setSaving(true)
    try {
      const note = await leadsApi.addNote(lead.id, noteText.trim())
      setNotes(prev => [note, ...prev])
      setNoteText('')
      toast.success('Note saved')
    } catch {
      toast.error('Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-[420px] max-w-full bg-s1 border-l border-white/[0.07] z-[201] flex flex-col animate-slide-in">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.07] flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-syne font-bold text-lg flex-shrink-0"
            style={{ background: color + '22', color }}
          >
            {initials(lead.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-syne font-bold text-lg">{lead.name}</p>
            <p className="text-muted text-xs font-mono mt-0.5">{lead.phone} · {lead.source}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-s2 border border-white/[0.07] text-muted hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Info */}
          <div className="bg-s2 border border-white/[0.07] rounded-xl p-4 space-y-3">
            {[
              ['Phone',    lead.phone,         'mono'],
              ['Email',    lead.email,         ''],
              ['Source',   `${SOURCE_ICONS[lead.source]} ${lead.source}`, ''],
              ['Campaign', lead.campaign_name, ''],
              ['Form',     lead.form_name,     ''],
              ['City',     lead.city,          ''],
              ['Received', new Date(lead.created_at).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' }), 'mono'],
            ].filter(([, v]) => v).map(([key, val, mono]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-dim uppercase tracking-wider font-mono">{key}</span>
                <span className={`text-sm text-right ${mono ? 'font-mono' : ''}`}>{val}</span>
              </div>
            ))}
          </div>

          {/* Status */}
          <div>
            <p className="text-[10px] text-dim uppercase tracking-wider font-mono mb-2">Update Status</p>
            <div className="grid grid-cols-4 gap-1.5">
              {STATUSES.map(s => {
                const c = STATUS_COLORS[s]
                const active = status === s
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`py-2 rounded-lg text-[10px] font-bold font-mono border transition-all
                      ${active ? `${c.bg} ${c.text} ${c.border}` : 'bg-s2 border-white/[0.07] text-muted hover:border-white/[0.12]'}`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => window.location.href = `tel:${lead.phone}`}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/[0.07] bg-s2 text-blue hover:bg-blue/10 hover:border-blue/30 transition-all text-sm font-semibold"
            >
              <Phone size={15} /> Call
            </button>
            <button
              onClick={() => window.open(`https://wa.me/${lead.phone?.replace(/[^0-9]/g,'')}`, '_blank')}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/[0.07] bg-s2 text-wa hover:bg-wa/10 hover:border-wa/30 transition-all text-sm font-semibold"
            >
              <MessageCircle size={15} /> WhatsApp
            </button>
            <button
              onClick={() => window.location.href = `sms:${lead.phone}`}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/[0.07] bg-s2 text-muted hover:bg-s3 transition-all text-sm font-semibold"
            >
              <MessageSquare size={15} /> SMS
            </button>
            <button
              onClick={() => lead.email && (window.location.href = `mailto:${lead.email}`)}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/[0.07] bg-s2 text-amber hover:bg-amber/10 hover:border-amber/30 transition-all text-sm font-semibold"
            >
              <Mail size={15} /> Email
            </button>
          </div>

          {/* Notes */}
          <div>
            <p className="text-[10px] text-dim uppercase tracking-wider font-mono mb-2">Notes</p>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add a note about this lead…"
              rows={3}
              className="input resize-none text-sm"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSaveNote}
                disabled={saving || !noteText.trim()}
                className="flex items-center gap-1.5 btn-ghost text-xs disabled:opacity-40 hover:border-green/40 hover:text-green"
              >
                <Save size={12} /> {saving ? 'Saving…' : 'Save Note'}
              </button>
            </div>
            <div className="space-y-2 mt-3">
              {notes.map(n => (
                <div key={n.id} className="bg-s2 border border-white/[0.07] rounded-xl p-3">
                  <p className="text-sm leading-relaxed">{n.content}</p>
                  <p className="text-[10px] text-dim font-mono mt-1.5">{timeAgo(n.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
