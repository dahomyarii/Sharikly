'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FloatingChatButton() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user')
      if (storedUser) setUser(JSON.parse(storedUser))
    }
  }, [])

  if (!user) return null

  return (
    <button
      onClick={() => router.push('/chat')}
      className="fixed bottom-6 right-6 w-16 h-16 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition"
      title="Open Chat"
    >
      💬
    </button>
  )
}
