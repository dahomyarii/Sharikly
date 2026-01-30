'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Mail, Phone, Send, Calendar, CheckCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_BASE

interface ContactMessage {
  id: number
  name: string
  email: string
  phone: string
  message: string
  created_at: string
  admin_response: string | null
  admin_response_date: string | null
  responded: boolean
}

interface UserAdminMessage {
  id: number
  user: {
    id: number
    email: string
    username: string
  }
  subject: string
  message: string
  created_at: string
  admin_response: string | null
  admin_response_date: string | null
  responded: boolean
}

type MessageType = 'contact' | 'user'

export default function AdminMessagesPage() {
  const router = useRouter()
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  const [userMessages, setUserMessages] = useState<UserAdminMessage[]>([])
  const [selectedContact, setSelectedContact] = useState<ContactMessage | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserAdminMessage | null>(null)
  const [adminResponse, setAdminResponse] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState('')
  const [submittingResponse, setSubmittingResponse] = useState(false)
  const [activeTab, setActiveTab] = useState<MessageType>('contact')

  useEffect(() => {
    const checkAdminAndFetchMessages = async () => {
      try {
        const token = localStorage.getItem('access_token')
        
        if (!token) {
          setError('Please login to access this page')
          router.push('/auth/login')
          return
        }

        const meResponse = await axios.get(`${API}/auth/me/`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!meResponse.data.is_staff) {
          setError('Only administrators can access this page')
          router.push('/')
          return
        }

        setIsAdmin(true)

        const contactResponse = await axios.get(`${API}/contact-messages/`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const userResponse = await axios.get(`${API}/user-admin-messages/`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        setContactMessages(contactResponse.data)
        setUserMessages(userResponse.data)
        setLoading(false)
      } catch (err: any) {
        console.error('Error:', err)
        setError('Failed to load messages')
        setLoading(false)
        router.push('/')
      }
    }

    checkAdminAndFetchMessages()
  }, [router])

  const handleSubmitContactResponse = async (messageId: number) => {
    if (!adminResponse.trim()) {
      alert('Please write a response')
      return
    }

    try {
      setSubmittingResponse(true)
      const token = localStorage.getItem('access_token')

      const response = await axios.patch(
        `${API}/contact-messages/${messageId}/`,
        { admin_response: adminResponse },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setContactMessages(contactMessages.map((msg: ContactMessage) => 
        msg.id === messageId ? response.data : msg
      ))

      setSelectedContact(response.data)
      setAdminResponse('')
    } catch (err) {
      console.error('Error:', err)
      alert('Failed to submit response')
    } finally {
      setSubmittingResponse(false)
    }
  }

  const handleSubmitUserResponse = async (messageId: number) => {
    if (!adminResponse.trim()) {
      alert('Please write a response')
      return
    }

    try {
      setSubmittingResponse(true)
      const token = localStorage.getItem('access_token')

      const response = await axios.patch(
        `${API}/user-admin-messages/${messageId}/`,
        { admin_response: adminResponse },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setUserMessages(userMessages.map((msg: UserAdminMessage) => 
        msg.id === messageId ? response.data : msg
      ))

      setSelectedUser(response.data)
      setAdminResponse('')
    } catch (err) {
      console.error('Error:', err)
      alert('Failed to submit response')
    } finally {
      setSubmittingResponse(false)
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/')}>Go Home</Button>
        </Card>
      </div>
    )
  }

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
              <h1 className="text-2xl font-bold text-gray-900">Admin Messages</h1>
              <p className="text-sm text-gray-600">Manage all customer and user messages</p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/admin/blog')}
            className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
          >
            Manage Blog
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'contact'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Contact Messages ({contactMessages.length})
            </button>
            <button
              onClick={() => setActiveTab('user')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'user'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              User Messages ({userMessages.length})
            </button>
          </div>
        </div>

        {/* Contact Messages Tab */}
        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900">Messages ({contactMessages.length})</h2>
                </div>
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {contactMessages.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <p>No contact messages yet</p>
                    </div>
                  ) : (
                    contactMessages.map((message: ContactMessage) => (
                      <button
                        key={message.id}
                        onClick={() => setSelectedContact(message)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          selectedContact?.id === message.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{message.name}</p>
                            <p className="text-sm text-gray-600 truncate">{message.email}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(message.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {message.responded && (
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedContact ? (
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedContact.name}</h2>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <a href={`mailto:${selectedContact.email}`} className="text-blue-600 hover:underline">
                          {selectedContact.email}
                        </a>
                      </div>
                      {selectedContact.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <a href={`tel:${selectedContact.phone}`} className="text-blue-600 hover:underline">
                            {selectedContact.phone}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">{formatDate(selectedContact.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">Message</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedContact.message}</p>
                  </div>

                  {selectedContact.responded && selectedContact.admin_response && (
                    <div className="p-6 border-b border-gray-200 bg-green-50">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-gray-900">Admin Response</h3>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap mb-3">{selectedContact.admin_response}</p>
                      <p className="text-xs text-gray-600">
                        Responded on: {formatDate(selectedContact.admin_response_date || '')}
                      </p>
                    </div>
                  )}

                  {!selectedContact.responded && (
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Send Response</h3>
                      <textarea
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        placeholder="Write your response..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 min-h-32"
                      />
                      <Button
                        onClick={() => handleSubmitContactResponse(selectedContact.id)}
                        disabled={submittingResponse || !adminResponse.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {submittingResponse ? 'Sending...' : 'Send Response'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-gray-500">Select a message to view details</p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* User Messages Tab */}
        {activeTab === 'user' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900">Messages ({userMessages.length})</h2>
                </div>
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {userMessages.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <p>No user messages yet</p>
                    </div>
                  ) : (
                    userMessages.map((message: UserAdminMessage) => (
                      <button
                        key={message.id}
                        onClick={() => setSelectedUser(message)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          selectedUser?.id === message.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{message.subject}</p>
                            <p className="text-sm text-gray-600 truncate">{message.user.email}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(message.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {message.responded && (
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedUser ? (
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedUser.subject}</h2>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">{selectedUser.user.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">{formatDate(selectedUser.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">Message</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedUser.message}</p>
                  </div>

                  {selectedUser.responded && selectedUser.admin_response && (
                    <div className="p-6 border-b border-gray-200 bg-green-50">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-gray-900">Admin Response</h3>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap mb-3">{selectedUser.admin_response}</p>
                      <p className="text-xs text-gray-600">
                        Responded on: {formatDate(selectedUser.admin_response_date || '')}
                      </p>
                    </div>
                  )}

                  {!selectedUser.responded && (
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Send Response</h3>
                      <textarea
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        placeholder="Write your response..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 min-h-32"
                      />
                      <Button
                        onClick={() => handleSubmitUserResponse(selectedUser.id)}
                        disabled={submittingResponse || !adminResponse.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {submittingResponse ? 'Sending...' : 'Send Response'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-gray-500">Select a message to view details</p>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
