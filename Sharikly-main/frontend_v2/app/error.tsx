"use client";

import { useEffect } from "react";
import { AlertCircle, Home, RefreshCw, Search } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 bg-background">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground mt-6">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mt-2">
          We ran into an error. You can try again or go back.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-border text-foreground rounded-xl hover:bg-accent font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            Go home
          </Link>
          <Link
            href="/listings"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-border text-foreground rounded-xl hover:bg-accent font-medium transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse
          </Link>
        </div>
      </div>
    </div>
  );
}
