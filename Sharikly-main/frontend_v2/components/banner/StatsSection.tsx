export default function StatsSection() {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="text-center group">
        <div className="inline-block mb-3 px-4 py-2 bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-300 rounded-full group-hover:border-amber-500 transition-all hover:shadow-lg">
          <svg className="w-8 h-8 text-amber-600 mx-auto" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
          </svg>
        </div>
        <p className="text-3xl font-black text-amber-600 mb-2">60% Cheaper</p>
        <p className="text-gray-600 font-medium">Than buying new in most cases</p>
      </div>
      <div className="text-center group">
        <div className="inline-block mb-3 px-4 py-2 bg-gradient-to-br from-blue-100 to-cyan-100 border border-blue-300 rounded-full group-hover:border-blue-500 transition-all hover:shadow-lg">
          <svg className="w-8 h-8 text-blue-600 mx-auto" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <p className="text-3xl font-black text-blue-600 mb-2">50K+ Users</p>
        <p className="text-gray-600 font-medium">Active community members</p>
      </div>
      <div className="text-center group">
        <div className="inline-block mb-3 px-4 py-2 bg-gradient-to-br from-green-100 to-emerald-100 border border-green-300 rounded-full group-hover:border-green-500 transition-all hover:shadow-lg">
          <svg className="w-8 h-8 text-green-600 mx-auto" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
          </svg>
        </div>
        <p className="text-3xl font-black text-green-600 mb-2">100% Safe</p>
        <p className="text-gray-600 font-medium">Verified & protected transactions</p>
      </div>
    </div>
  )
}
