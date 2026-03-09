export default function SkeletonLoader() {
  return (
    <div className="block border border-border rounded-xl overflow-hidden bg-card">
      <div className="relative h-28 sm:h-36 bg-muted animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-3.5 bg-muted rounded animate-pulse flex-1 mr-2" />
          <div className="h-3.5 bg-muted rounded animate-pulse w-12" />
        </div>
        <div className="h-3 bg-muted rounded animate-pulse w-24" />
        <div className="flex items-center gap-2 pt-1">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-3.5 h-3.5 bg-muted rounded animate-pulse" />
            ))}
          </div>
          <div className="h-3 bg-muted rounded animate-pulse w-14" />
        </div>
      </div>
    </div>
  );
}
