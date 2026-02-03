export default function TrustIndicators() {
  return (
    <div className="grid grid-cols-2 gap-4 pt-4">
      <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl hover:border-green-400 hover:shadow-md transition-all">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>
        <span className="text-sm font-semibold text-gray-800">Verified Members</span>
      </div>
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
          </svg>
        </div>
        <span className="text-sm font-semibold text-gray-800">Protected Transactions</span>
      </div>
    </div>
  )
}
