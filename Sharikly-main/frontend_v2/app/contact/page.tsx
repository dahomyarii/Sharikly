'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Mail, Phone, Send, CheckCircle, AlertCircle, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import axiosInstance from '@/lib/axios'

const API = process.env.NEXT_PUBLIC_API_BASE

export default function ContactPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email?: string; username?: string } | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [formData, setFormData] = useState({
    message: '',
    phone: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!token || !storedUser) {
      setAuthChecked(true)
      setUser(null)
      return
    }
    try {
      setUser(JSON.parse(storedUser))
    } catch {
      setUser(null)
    }
    setAuthChecked(true)
  }, [])

  useEffect(() => {
    if (authChecked && !user) {
      router.replace('/auth/login')
    }
  }, [authChecked, user, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.message.trim()) {
      setError('Please enter your message')
      return
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token || !API) {
      setError('You must be logged in to send a message.')
      router.push('/auth/login')
      return
    }

    setLoading(true)
    setError('')
    try {
      await axiosInstance.post(
        `${API}/contact-messages/`,
        { message: formData.message.trim(), ...(formData.phone.trim() ? { phone: formData.phone.trim() } : {}) },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSubmitted(true)
      setFormData({ message: '', phone: '' })
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/auth/login')
        return
      }
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (authChecked && !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Redirecting to login...</p>
      </div>
    )
  }

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
          <h1 className="text-lg font-bold text-gray-900">Contact Us</h1>
          <div className="w-8" />
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Get in Touch</h2>
          <p className="text-gray-600">We'll get back to you. Your message is sent from your account email.</p>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center text-center">
          <a href="mailto:support@ekra.com" className="space-y-2">
            <Mail className="w-6 h-6 text-blue-600 mx-auto" />
            <div>
              <p className="text-sm text-gray-600">Support Email</p>
              <p className="font-semibold text-gray-900">support@ekra.com</p>
            </div>
          </a>
          <a href="tel:+966112345678" className="space-y-2">
            <Phone className="w-6 h-6 text-blue-600 mx-auto" />
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-semibold text-gray-900">+966 11 234 5678</p>
            </div>
          </a>
        </div>

        {/* Form — logged in: email sent by default, no payment */}
        <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 space-y-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            <Lock className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Your message will be sent from your account. No payment required.</span>
          </div>

          {user?.email && (
            <div className="text-sm">
              <span className="text-gray-500">Sending as: </span>
              <span className="font-medium text-gray-900">{user.email}</span>
            </div>
          )}

          {submitted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900">Success!</p>
                <p className="text-green-800 text-sm">We'll get back to you within 24 hours.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us how we can help..."
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Phone (optional)</label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+966 5xxxxxxxx"
                className="w-full border-gray-300"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 rounded-lg flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
