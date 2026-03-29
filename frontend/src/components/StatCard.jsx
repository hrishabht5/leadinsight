export default function StatCard({ label, value, color, sub, barColor }) {
  const colors = {
    green:  { num: 'text-green',  bar: 'bg-green'  },
    purple: { num: 'text-purple', bar: 'bg-purple' },
    amber:  { num: 'text-amber',  bar: 'bg-amber'  },
    blue:   { num: 'text-blue',   bar: 'bg-blue'   },
  }
  const c = colors[color] || colors.blue

  return (
    <div className="card p-5 relative overflow-hidden hover:border-white/[0.12] transition-colors">
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${c.bar}`} />
      <p className="text-[10px] text-dim uppercase tracking-[0.08em] font-mono mb-2">{label}</p>
      <p className={`font-syne font-extrabold text-[2rem] leading-none tracking-tight ${c.num}`}>
        {value ?? '—'}
      </p>
      {sub && <p className="text-[11px] text-dim mt-1.5">{sub}</p>}
    </div>
  )
}
