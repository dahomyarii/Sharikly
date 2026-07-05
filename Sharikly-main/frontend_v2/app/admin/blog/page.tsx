'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function AdminBlogPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="flex items-center justify-between gap-4 px-4 py-4 md:py-5">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-foreground hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Blog Management</h1>
              <p className="text-sm text-muted-foreground">Manage blog posts and articles</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">Blog management coming soon</p>
          <Button onClick={() => router.push('/admin/messages')}>
            Back to Messages
          </Button>
        </Card>
      </div>
    </div>
  )
}

