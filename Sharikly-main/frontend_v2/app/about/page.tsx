'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function AboutPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3 md:py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-gray-800 hover:bg-gray-100 h-8 w-8"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-gray-900">About Us</h1>
          <div className="w-8" />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">About EKRA</h2>
          <p className="text-lg text-gray-600">
            EKRA is a peer-to-peer marketplace connecting people who want to share services and items.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">Our Mission</h3>
          <p className="text-gray-700 leading-relaxed">
            We believe in empowering communities through sharing. Our platform makes it easy for people to rent, share, and earn from their unused items and services.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">Why EKRA?</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Safe and secure transactions</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Easy to use platform</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Community-driven approach</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Verified sellers and renters</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
