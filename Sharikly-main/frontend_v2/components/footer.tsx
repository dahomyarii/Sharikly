// frontend/components/Footer.tsx
'use client'
import React from 'react'

export default function Footer() {
  return (
    <footer className="border-t mt-8">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-gray-500">
        © {new Date().getFullYear()} ShareThings — Built with ❤️
      </div>
    </footer>
  )
}
