"use client"

import { useEffect, useRef } from "react"

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  return Array.from(
    container.querySelectorAll<HTMLElement>(selector)
  ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null)
}

export default function FloatingModal({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose?: () => void
}) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const focusable = getFocusableElements(el)
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose()
        return
      }
      if (e.key !== "Tab") return
      const current = document.activeElement as HTMLElement
      if (!current || !el.contains(current)) return
      if (e.shiftKey) {
        if (current === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (current === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        className="relative z-50 bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 animate-fade-in max-h-[90vh] overflow-y-auto"
      >
        {children}
      </div>
    </div>
  )
}