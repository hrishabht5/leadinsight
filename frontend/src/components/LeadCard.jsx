import { timeAgo, initials, colorForName, SOURCE_ICONS } from '../utils'
import { Phone, MessageCircle } from 'lucide-react'

const STATUS_CLS = {
  new:       'status-new',
  contacted: 'status-contacted',
  converted: 'status-converted',
  lost:      'status-lost',
}

export default function LeadCard({ lead, onClick, flash }) {
  const color = colorForName(lead.name)

  const handleAction = (e, fn) => {
    e.stopPropagation()
    fn()
  }

  return (
    <div
      onClick={onClick}
      className={`
        card px-5 py-4 grid grid-cols-[auto_1fr_auto] items-center gap-4
        cursor-pointer transition-all duration-200 relative overflow-hidden
        hover:border-white/[0.12] hover:bg-s2 hover:translate-x-0.5
        ${flash ? 'animate-flash' : ''}
      `}
      style={{ borderLeft: `3px solid ${
        lead.status === 'new' ? '#00f5a0' :
        lead.status === 'contacted' ? '#9d7cf8' :
        lead.status === 'converted' ? '#fbbf24' : '#f87171'
      }` }}
    >
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center font-syne font-bold text-base flex-shrink-0"
        style={{ background: color + '22', color }}
      >
        {initials(lead.name)}
      </div>

      {/* Info */}
      <div className="min-w-0">
        <p className="font-semibold text-[15px] truncate">{lead.name}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="font-mono text-xs text-muted">{lead.phone}</span>
          <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full border
            ${lead.source === 'facebook' ? 'bg-fb/10 text-blue border-fb/20' : 'bg-ig/10 text-[#e1306c] border-ig/20'}`}>
            {SOURCE_ICONS[lead.source]} {lead.source}
          </span>
          {lead.campaign_name && (
            <span className="text-[11px] text-dim truncate max-w-[160px]">{lead.campaign_name}</span>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${STATUS_CLS[lead.status]}`}>
          {lead.status}
        </span>
        <span className="text-[10px] text-dim font-mono">{timeAgo(lead.created_at)}</span>
        <div className="flex gap-1.5 mt-0.5" onClick={e => e.stopPropagation()}>
          <button
            title="Call"
            onClick={e => handleAction(e, () => window.location.href = `tel:${lead.phone}`)}
            className="p-1.5 rounded-lg bg-s3 border border-white/[0.07] text-muted hover:text-blue hover:border-blue/30 hover:bg-blue/10 transition-all"
          >
            <Phone size={13} />
          </button>
          <button
            title="WhatsApp"
            onClick={e => handleAction(e, () => window.open(`https://wa.me/${lead.phone?.replace(/[^0-9]/g,'')}`, '_blank'))}
            className="p-1.5 rounded-lg bg-s3 border border-white/[0.07] text-muted hover:text-wa hover:border-wa/30 hover:bg-wa/10 transition-all"
          >
            <MessageCircle size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
