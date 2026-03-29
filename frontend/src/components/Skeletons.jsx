// Reusable skeleton shimmer primitives

function Shimmer({ className = '' }) {
  return (
    <div className={`bg-s2 rounded-xl animate-pulse ${className}`} />
  )
}

export function LeadCardSkeleton() {
  return (
    <div className="card px-5 py-4 grid grid-cols-[auto_1fr_auto] gap-4 items-center">
      <Shimmer className="w-11 h-11 rounded-xl" />
      <div className="space-y-2">
        <Shimmer className="h-4 w-36" />
        <Shimmer className="h-3 w-56" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Shimmer className="h-4 w-16 rounded-full" />
        <Shimmer className="h-3 w-10" />
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="card p-5 space-y-2">
      <Shimmer className="h-3 w-20" />
      <Shimmer className="h-9 w-14" />
      <Shimmer className="h-3 w-28" />
    </div>
  )
}

export function LeadListSkeleton({ count = 6 }) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <LeadCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
    </div>
  )
}

export function ChartSkeleton({ height = 200 }) {
  return (
    <div className="card p-5">
      <Shimmer className="h-4 w-40 mb-5" />
      <Shimmer className={`w-full rounded-xl`} style={{ height }} />
    </div>
  )
}

export function PanelSkeleton() {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Shimmer className="w-12 h-12 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Shimmer className="h-5 w-32" />
          <Shimmer className="h-3 w-48" />
        </div>
      </div>
      <div className="space-y-3 bg-s2 border border-white/[0.07] rounded-xl p-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <Shimmer className="h-3 w-16" />
            <Shimmer className="h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => <Shimmer key={i} className="h-9 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[...Array(4)].map((_, i) => <Shimmer key={i} className="h-12 rounded-xl" />)}
      </div>
    </div>
  )
}
