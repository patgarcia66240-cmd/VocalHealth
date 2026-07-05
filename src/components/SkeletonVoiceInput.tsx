import Skeleton from "react-loading-skeleton";

export function SkeletonVoiceInput() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <Skeleton width="40%" height={20} />
        <Skeleton width="60px" height={32} />
      </div>
      
      {/* Mic button area */}
      <div className="flex justify-center py-6">
        <Skeleton circle width={80} height={80} />
      </div>
      
      {/* Description text */}
      <div className="space-y-2">
        <Skeleton height={16} />
        <Skeleton height={16} width="80%" />
      </div>
      
      {/* Keyboard shortcut hint */}
      <div className="text-center">
        <Skeleton height={14} width="60%" containerClassName="flex justify-center" />
      </div>
    </div>
  );
}
