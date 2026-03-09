"use client";

import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 bg-background">
      <div className="text-center max-w-md">
        <p className="text-7xl sm:text-8xl font-bold text-muted-foreground/40 tracking-tight select-none" aria-hidden="true">
          404
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mt-4">
          Page not found
        </h1>
        <p className="text-muted-foreground mt-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            Go home
          </Link>
          <Link
            href="/listings"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-border text-foreground rounded-xl hover:bg-accent font-medium transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse listings
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => typeof window !== "undefined" && window.history.back()}
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </p>
      </div>
    </div>
  );
}
