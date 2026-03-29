export function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60)   return 'Just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400)return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function initials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const COLORS = [
  '#00f5a0','#9d7cf8','#4d9eff','#fbbf24',
  '#f87171','#34d399','#fb7185','#60a5fa',
]
export function colorForName(name = '') {
  let h = 0
  for (const c of name) h = (h << 5) - h + c.charCodeAt(0)
  return COLORS[Math.abs(h) % COLORS.length]
}

export function waLink(phone) {
  return `https://wa.me/${phone?.replace(/[^0-9]/g, '')}`
}

export const STATUS_LABELS = {
  new: '🟢 New',
  contacted: '🟣 Contacted',
  converted: '🟡 Converted',
  lost: '🔴 Lost',
}

export const SOURCE_ICONS = {
  facebook: '📘',
  instagram: '📸',
}
