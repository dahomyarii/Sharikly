'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Send, Mail, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_BASE

interface AdminMessage {
  id: number
  subject: string
  message: string
  created_at: string
  admin_response: string | null
  admin_response_date: string | null
  responded: boolean
}

export default function UserAdminMessagesPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submittingMessage, setSubmittingMessage] = useState(false)

  // Form state for new message
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  // Check login and fetch messages
  useEffect(() => {
    const checkLoginAndFetchMessages = async () => {
      try {
        const token = localStorage.getItem('access_token')

        if (!token) {
          setIsLoggedIn(false)
          setLoading(false)
          return
        }

        setIsLoggedIn(true)

        // Fetch user's messages
        const response = await axios.get(`${API}/user-admin-messages/`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        setMessages(response.data)
        setLoading(false)
      } catch (err: any) {
        console.error('Error:', err)
        setIsLoggedIn(false)
        setLoading(false)
      }
    }

    checkLoginAndFetchMessages()
  }, [])

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!subject.trim() || !message.trim()) {
      alert('Please fill in both subject and message')
      return
    }

    try {
      setSubmittingMessage(true)
      const token = localStorage.getItem('access_token')

      const response = await axios.post(
        `${API}/user-admin-messages/`,
        { subject, message },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // Add new message to list
      setMessages([response.data, ...messages])
      setSubject('')
      setMessage('')
      setSelectedMessage(null)

      alert('Message sent successfully!')
    } catch (err) {
      console.error('Error:', err)
      alert('Failed to send message')
    } finally {
      setSubmittingMessage(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Log In</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to send messages to the admin.</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="flex-1"
            >
              Go Home
            </Button>
            <Button
              onClick={() => router.push('/auth/login')}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Login
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center gap-4 px-4 py-4 md:py-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-gray-800 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support Messages</h1>
            <p className="text-sm text-gray-600">Send messages to admins and track responses</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Message Form */}
          <div className="lg:col-span-1">
            <Card className="p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Send New Message</h2>
              <form onSubmit={handleSubmitMessage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <Input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Message subject"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-32"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submittingMessage || !subject.trim() || !message.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submittingMessage ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </Card>
          </div>

          {/* Messages List and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Messages List */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Your Messages ({messages.length})</h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <p>No messages yet. Send one to get started!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => setSelectedMessage(msg)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedMessage?.id === msg.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{msg.subject}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(msg.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {msg.responded && (
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Message Detail */}
            {selectedMessage && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedMessage.subject}</h3>

                {/* Sent Message */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      Sent: {formatDate(selectedMessage.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap mt-3">{selectedMessage.message}</p>
                </div>

                {/* Admin Response */}
                {selectedMessage.responded && selectedMessage.admin_response ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-gray-900">Admin Response</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap mb-3">{selectedMessage.admin_response}</p>
                    <p className="text-xs text-gray-600">
                      Responded: {formatDate(selectedMessage.admin_response_date || '')}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Awaiting Response</p>
                      <p className="text-sm text-gray-600">The admin team will respond to your message soon.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
