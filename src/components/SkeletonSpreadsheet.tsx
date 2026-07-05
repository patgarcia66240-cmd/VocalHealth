import Skeleton from "react-loading-skeleton";

export function SkeletonSpreadsheet() {
  return (
    <div className="space-y-3 p-4">
      {/* Table header */}
      <div className="grid grid-cols-5 gap-3 pb-3 border-b dark:border-gray-700">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} height={20} />
        ))}
      </div>

      {/* Table rows */}
      {[...Array(5)].map((_, rowIdx) => (
        <div key={rowIdx} className="grid grid-cols-5 gap-3 py-3 border-b dark:border-gray-700">
          {[...Array(5)].map((_, colIdx) => (
            <Skeleton key={colIdx} height={20} />
          ))}
        </div>
      ))}
    </div>
  );
}
