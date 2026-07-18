"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

/**
 * Accessible custom dropdown used in place of a native <select> everywhere
 * in the app. The menu is rendered in a portal with fixed positioning so it
 * can overflow clipping ancestors (e.g. panels with overflow-hidden).
 *
 * Callers that want an "Any" / "All" option should include it explicitly in
 * `options` (e.g. { value: "", label: "All Categories" }) — there is no
 * implicit clear row.
 */
export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  className = "",
  triggerClassName = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePos = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ left: r.left, top: r.bottom + 8, width: r.width });
  };

  useEffect(() => {
    if (!open) return;
    updatePos();
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const label = selected ? selected.label : placeholder;

  const rowClass =
    "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm text-foreground transition hover:bg-accent";

  const menu =
    open && pos && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{ position: "fixed", left: pos.left, top: pos.top, width: pos.width, zIndex: 60 }}
            className="max-h-72 overflow-auto rounded-2xl border border-border bg-card p-1.5 shadow-[var(--soft-shadow-lg)]"
          >
            {options.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={rowClass}
                >
                  <span className="truncate">{o.label}</span>
                  {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-[18px] border border-transparent bg-white/80 px-4 text-sm text-foreground outline-none backdrop-blur transition hover:bg-white focus-visible:ring-2 focus-visible:ring-ring sm:h-11 sm:rounded-[20px]",
          triggerClassName
        )}
      >
        <span className={selected ? "truncate text-foreground" : "truncate text-muted-foreground"}>
          {label}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {menu}
    </div>
  );
}
