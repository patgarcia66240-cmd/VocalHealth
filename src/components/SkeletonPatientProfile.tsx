import Skeleton from "react-loading-skeleton";

export function SkeletonPatientProfile() {
  return (
    <div className="bg-linear-to-br from-natural-surface to-natural-card/30 rounded-[28px] border border-natural-border/50 p-4 shadow-lg shadow-natural-primary/5 space-y-3 backdrop-blur-sm">
      {/* Header with title and buttons */}
      <div className="flex items-center justify-between border-b border-natural-border/40 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-linear-to-br from-natural-primary/10 to-natural-accent/10 rounded-xl">
            <Skeleton circle height={20} width={20} />
          </div>
          <div className="space-y-1.5">
            <Skeleton height={14} width={100} />
            <Skeleton height={10} width={120} />
          </div>
        </div>
        <Skeleton height={36} width={80} borderRadius={8} />
      </div>

      {/* Profile info area */}
      <div className="flex items-center gap-3 bg-linear-to-r from-natural-primary/5 to-natural-accent/5 p-4 rounded-2xl border border-natural-border/30 shadow-sm">
        {/* Avatar */}
        <Skeleton circle height={48} width={48} />
        
        {/* Name and info */}
        <div className="flex-1 space-y-2">
          <Skeleton height={18} width="75%" />
          <div className="flex items-center gap-2">
            <Skeleton height={12} width={50} />
            <Skeleton height={20} width={70} borderRadius={16} />
          </div>
        </div>
      </div>

      {/* Additional contact info (simulated) */}
      <div className="space-y-2 pt-2">
        <div className="flex items-start gap-3">
          <Skeleton height={16} width={16} />
          <div className="flex-1 space-y-1">
            <Skeleton height={11} width={80} />
            <Skeleton height={14} width="90%" />
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Skeleton height={16} width={16} />
          <div className="flex-1 space-y-1">
            <Skeleton height={11} width={70} />
            <Skeleton height={14} width="85%" />
          </div>
        </div>
      </div>
    </div>
  );
}

