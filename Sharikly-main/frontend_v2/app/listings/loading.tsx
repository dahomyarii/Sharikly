import SkeletonLoader from "@/components/SkeletonLoader";

export default function ListingsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-3 py-4 pb-6 sm:px-6 md:p-8">
      <div className="mb-6 md:mb-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-64 mt-2 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {[...Array(8)].map((_, i) => (
          <SkeletonLoader key={i} />
        ))}
      </div>
    </div>
  );
}
