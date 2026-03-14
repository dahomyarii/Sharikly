"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={cn(
          "min-w-[44px] min-h-[44px] md:min-w-[40px] md:min-h-[40px] flex items-center justify-center rounded-full border border-white/60 bg-background/90 shadow-sm transition-colors touch-target",
          className
        )}
      >
        <span className="w-5 h-5 rounded-full bg-muted" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "min-w-[44px] min-h-[44px] md:min-w-[40px] md:min-h-[40px] flex items-center justify-center rounded-full border border-white/60 bg-background/90 text-muted-foreground hover:text-foreground hover:bg-accent/70 transition-colors touch-target shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {isDark ? (
        <Sun className="w-5 h-5" aria-hidden />
      ) : (
        <Moon className="w-5 h-5" aria-hidden />
      )}
    </button>
  );
}
