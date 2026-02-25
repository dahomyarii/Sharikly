export default function ListingDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 lg:p-8">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl overflow-hidden bg-gray-200 aspect-[4/3] animate-pulse" />
            <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
            <div className="h-24 w-full bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-gray-200 p-6 space-y-4 bg-white">
              <div className="h-12 w-24 bg-gray-200 rounded animate-pulse mx-auto" />
              <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
