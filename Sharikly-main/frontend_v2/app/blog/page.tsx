'use client'

import { ArrowLeft, Calendar, User, Search } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function BlogPage() {
  const router = useRouter()

  const posts = [
    {
      title: 'Getting Started with EKRA',
      excerpt: 'Learn how to list your first item and connect with renters.',
      date: '2026-01-20',
      author: 'Sarah'
    },
    {
      title: 'Tips for Successful Rentals',
      excerpt: 'Best practices to maximize your earnings on EKRA.',
      date: '2026-01-15',
      author: 'Ahmed'
    },
    {
      title: 'Safety First: Our Commitment',
      excerpt: 'How we ensure safe transactions for all users.',
      date: '2026-01-10',
      author: 'Noor'
    }
  ]

  const [query, setQuery] = useState('')

  const filteredPosts = useMemo(() => {
    if (!query) return posts
    const q = query.toLowerCase()
    return posts.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.excerpt || '').toLowerCase().includes(q) ||
      (p.author || '').toLowerCase().includes(q)
    )
  }, [query, posts])

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
          <h1 className="text-lg font-bold text-gray-900">Blog</h1>
          <div className="w-8" />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Latest News & Tips</h2>
          <p className="text-lg text-gray-600">
            Stay updated with insights and stories from the EKRA community.
          </p>
        </div>

        {/* Search */}
        <div className="">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input
              aria-label="Search blog posts"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts by title, excerpt, or author"
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {post.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              No posts found. Try a different search term.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
