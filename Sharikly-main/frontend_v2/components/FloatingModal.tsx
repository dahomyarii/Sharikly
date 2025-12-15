"use client"

import type React from "react"

export default function FloatingModal({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose?: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred Background */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      {/* Center Box */}
      <div className="relative z-50 bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 animate-fade-in">
        {children}
      </div>
    </div>
  )
}
