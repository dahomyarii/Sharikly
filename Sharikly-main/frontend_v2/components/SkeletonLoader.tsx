export default function SkeletonLoader() {
  return (
    <div className="block border rounded-2xl overflow-hidden">
      <div className="relative h-48 bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded animate-pulse flex-1 mr-2" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-12" />
        </div>
        <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
        <div className="flex items-center gap-2 pt-2">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
        </div>
      </div>
    </div>
  );
}
