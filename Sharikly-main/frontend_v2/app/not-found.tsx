import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-gray-200 tracking-tight">404</p>
        <h1 className="text-2xl font-semibold text-gray-900 mt-4">
          Page not found
        </h1>
        <p className="text-gray-500 mt-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            Go home
          </Link>
          <Link
            href="/listings"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse listings
          </Link>
        </div>
      </div>
    </div>
  );
}
