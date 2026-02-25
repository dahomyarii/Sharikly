export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] px-4" aria-hidden="true">
      <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      <p className="text-sm text-gray-500 mt-4">Loading...</p>
    </div>
  );
}
