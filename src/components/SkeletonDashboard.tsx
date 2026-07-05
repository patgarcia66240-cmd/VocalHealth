import Skeleton from "react-loading-skeleton";

export function SkeletonDashboard() {
  return (
    <div className="space-y-6" id="stats-dashboard-skeleton">
      {/* Patient Profile Quick Summary Banner Skeleton */}
      <div className="bg-natural-surface border border-natural-border p-5 rounded-4xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Avatar + Name section */}
        <div className="flex items-center gap-3.5">
          <Skeleton circle width={48} height={48} />
          <div className="space-y-2 flex-1">
            <Skeleton width="150px" height={20} />
            <Skeleton width="200px" height={14} />
          </div>
        </div>
        
        {/* Address + Phone section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-y-2 gap-x-6 text-xs border-t md:border-t-0 md:border-l border-natural-border/60 pt-3 md:pt-0 md:pl-6 flex-1">
          <div className="space-y-2 sm:space-y-1">
            <Skeleton width="80px" height={12} />
            <Skeleton width="140px" height={16} />
            <Skeleton width="120px" height={12} />
          </div>
          <div className="space-y-2 sm:space-y-1 sm:border-l sm:border-natural-border/40 sm:pl-6">
            <Skeleton width="80px" height={12} />
            <Skeleton width="100px" height={16} />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-natural-surface p-6 rounded-4xl border border-natural-border shadow-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton width="80px" height={24} />
                <Skeleton width="100px" height={12} />
              </div>
              <Skeleton circle width={40} height={40} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-natural-surface p-4 rounded-4xl border border-natural-border shadow-sm">
            <Skeleton width="120px" height={16} className="mb-4" />
            <Skeleton height={200} />
          </div>
        ))}
      </div>
    </div>
  );
}
