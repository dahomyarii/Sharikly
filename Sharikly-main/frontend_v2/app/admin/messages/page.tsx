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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-center max-w-md">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => router.push('/')}>Go Home</Button>
        </Card>
      </div>
    )
  }

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
              <h1 className="text-2xl font-bold text-foreground">Admin Messages</h1>
              <p className="text-sm text-muted-foreground">Manage all customer and user messages</p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/admin/blog')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap"
          >
            Manage Blog
          </Button>
        </div>
      </header>

      <div className="marketplace-shell py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-border">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'contact'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Contact Messages ({contactMessages.length})
            </button>
            <button
              onClick={() => setActiveTab('user')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'user'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              User Messages ({userMessages.length})
            </button>
          </div>
        </div>

        {/* Contact Messages Tab */}
        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch">
            <div className="lg:col-span-1 flex flex-col">
              <div className="surface-panel flex flex-1 flex-col rounded-3xl border border-border bg-card overflow-hidden lg:min-h-[520px]">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-foreground">Messages ({contactMessages.length})</h2>
                </div>
                <div className="divide-y divide-border flex-1 overflow-y-auto">
                  {contactMessages.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <p>No contact messages yet</p>
                    </div>
                  ) : (
                    contactMessages.map((message: ContactMessage) => (
                      <button
                        key={message.id}
                        onClick={() => setSelectedContact(message)}
                        className={`w-full p-4 text-left hover:bg-muted transition-colors ${
                          selectedContact?.id === message.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{message.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{message.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(message.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {message.responded && (
                            <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col">
              {selectedContact ? (
                <div className="surface-panel flex-1 rounded-3xl border border-border bg-card overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground mb-4">{selectedContact.name}</h2>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <a href={`mailto:${selectedContact.email}`} className="text-primary hover:underline">
                          {selectedContact.email}
                        </a>
                      </div>
                      {selectedContact.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-muted-foreground" />
                          <a href={`tel:${selectedContact.phone}`} className="text-primary hover:underline">
                            {selectedContact.phone}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <span className="text-muted-foreground">{formatDate(selectedContact.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-b border-border">
                    <h3 className="font-semibold text-foreground mb-3">Message</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedContact.message}</p>
                  </div>

                  {selectedContact.responded && selectedContact.admin_response && (
                    <div className="p-6 border-b border-border bg-success/10">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-success" />
                        <h3 className="font-semibold text-foreground">Admin Response</h3>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap mb-3">{selectedContact.admin_response}</p>
                      <p className="text-xs text-muted-foreground">
                        Responded on: {formatDate(selectedContact.admin_response_date || '')}
                      </p>
                    </div>
                  )}

                  {!selectedContact.responded && (
                    <div className="p-6">
                      <h3 className="font-semibold text-foreground mb-3">Send Response</h3>
                      <textarea
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        placeholder="Write your response..."
                        className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring mb-3 min-h-32"
                      />
                      <Button
                        onClick={() => handleSubmitContactResponse(selectedContact.id)}
                        disabled={submittingResponse || !adminResponse.trim()}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {submittingResponse ? 'Sending...' : 'Send Response'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="surface-panel flex flex-1 flex-col items-center justify-center rounded-3xl border border-border bg-card p-12 text-center lg:min-h-[520px]">
                  <p className="text-muted-foreground">Select a message to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Messages Tab */}
        {activeTab === 'user' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch">
            <div className="lg:col-span-1 flex flex-col">
              <div className="surface-panel flex flex-1 flex-col rounded-3xl border border-border bg-card overflow-hidden lg:min-h-[520px]">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-foreground">Messages ({userMessages.length})</h2>
                </div>
                <div className="divide-y divide-border flex-1 overflow-y-auto">
                  {userMessages.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <p>No user messages yet</p>
                    </div>
                  ) : (
                    userMessages.map((message: UserAdminMessage) => (
                      <button
                        key={message.id}
                        onClick={() => setSelectedUser(message)}
                        className={`w-full p-4 text-left hover:bg-muted transition-colors ${
                          selectedUser?.id === message.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{message.subject}</p>
                            <p className="text-sm text-muted-foreground truncate">{message.user.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(message.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {message.responded && (
                            <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col">
              {selectedUser ? (
                <div className="surface-panel flex-1 rounded-3xl border border-border bg-card overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground mb-4">{selectedUser.subject}</h2>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <span className="text-muted-foreground">{selectedUser.user.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <span className="text-muted-foreground">{formatDate(selectedUser.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-b border-border">
                    <h3 className="font-semibold text-foreground mb-3">Message</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedUser.message}</p>
                  </div>

                  {selectedUser.responded && selectedUser.admin_response && (
                    <div className="p-6 border-b border-border bg-success/10">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-success" />
                        <h3 className="font-semibold text-foreground">Admin Response</h3>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap mb-3">{selectedUser.admin_response}</p>
                      <p className="text-xs text-muted-foreground">
                        Responded on: {formatDate(selectedUser.admin_response_date || '')}
                      </p>
                    </div>
                  )}

                  {!selectedUser.responded && (
                    <div className="p-6">
                      <h3 className="font-semibold text-foreground mb-3">Send Response</h3>
                      <textarea
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        placeholder="Write your response..."
                        className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring mb-3 min-h-32"
                      />
                      <Button
                        onClick={() => handleSubmitUserResponse(selectedUser.id)}
                        disabled={submittingResponse || !adminResponse.trim()}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {submittingResponse ? 'Sending...' : 'Send Response'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="surface-panel flex flex-1 flex-col items-center justify-center rounded-3xl border border-border bg-card p-12 text-center lg:min-h-[520px]">
                  <p className="text-muted-foreground">Select a message to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
