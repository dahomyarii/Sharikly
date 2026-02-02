'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function AdminBlogPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between gap-4 px-4 py-4 md:py-5">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-gray-800 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
              <p className="text-sm text-gray-600">Manage blog posts and articles</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">Blog management coming soon</p>
          <Button onClick={() => router.push('/admin/messages')}>
            Back to Messages
          </Button>
        </Card>
      </div>
    </div>
  )
}

