export default function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="card p-16 text-center flex flex-col items-center gap-4">
      <span className="text-5xl opacity-30">{icon}</span>
      <div>
        <p className="font-syne font-bold text-base mb-1">{title}</p>
        {description && (
          <p className="text-muted text-sm leading-relaxed max-w-xs mx-auto">{description}</p>
        )}
      </div>
      {action && (
        <button onClick={action.onClick} className="btn-primary mt-2 text-sm">
          {action.label}
        </button>
      )}
    </div>
  )
}
