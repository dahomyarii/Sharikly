"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

export default function FloatingModal({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose?: () => void
}) {


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative z-50 bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 animate-fade-in">
        {children}
      </div>
    </div>
  )
}