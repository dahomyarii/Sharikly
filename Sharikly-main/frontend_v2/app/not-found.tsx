"use client";

import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 bg-gray-50/50">
      <div className="text-center max-w-md">
        <p className="text-7xl sm:text-8xl font-bold text-gray-200 tracking-tight select-none" aria-hidden="true">
          404
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-4">
          Page not found
        </h1>
        <p className="text-gray-500 mt-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            Go home
          </Link>
          <Link
            href="/listings"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-white hover:border-gray-400 font-medium transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse listings
          </Link>
        </div>
        <p className="mt-6 text-sm text-gray-400">
          <button
            type="button"
            onClick={() => typeof window !== "undefined" && window.history.back()}
            className="inline-flex items-center gap-1 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </p>
      </div>
    </div>
  );
}
