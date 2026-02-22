'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axiosInstance from '@/lib/axios'
import { MessageCircle, Search, ArrowLeft, User } from 'lucide-react'
import Image from 'next/image'

const API = process.env.NEXT_PUBLIC_API_BASE

interface Message {
  id: number
  text?: string
  image?: string
  sender: {
    id: number
    username: string
    email: string
  }
  created_at: string
}

interface ChatRoom {
  id: number
  participants: Array<{
    id: number
    username: string
    email: string
  }>
  last_message?: Message
}

export default function ChatPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const previousMessagesLength = useRef(0)
  const [showSidebar, setShowSidebar] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      } else {
        router.push('/auth/login')
      }
    }
  }, [router])

  // Fetch chat rooms
  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      const res = await axiosInstance.get(`${API}/chat/rooms/`, {
        headers: { Authorization: `Bearer ${token}` }
        })
      setRooms(res.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching rooms:', err)
      setLoading(false)
    }
  }

  // Fetch messages for a room
  const fetchMessages = async (roomId: number) => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      const res = await axiosInstance.get(`${API}/chat/messages/${roomId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessages(res.data)
    } catch (err) {
      console.error('Error fetching messages:', err)
    }
  }

  useEffect(() => {
    if (user) {
      fetchRooms()
      const interval = setInterval(() => {
    fetchRooms()
        if (currentRoom) {
          fetchMessages(currentRoom.id)
        }
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [user, currentRoom])

  useEffect(() => {
    if (currentRoom) {
      fetchMessages(currentRoom.id)
      setShouldAutoScroll(true) // Reset auto-scroll when switching rooms
    }
  }, [currentRoom])

  // Check if user is near bottom of scroll
  const checkIfNearBottom = () => {
    if (!messagesContainerRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    return distanceFromBottom < 100 // Within 100px of bottom
  }

  // Handle scroll events
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      setShouldAutoScroll(checkIfNearBottom())
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [currentRoom])

  // Only auto-scroll if user is near bottom and there are new messages
  useEffect(() => {
    const hasNewMessages = messages.length > previousMessagesLength.current
    previousMessagesLength.current = messages.length

    if (shouldAutoScroll && hasNewMessages) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [messages, shouldAutoScroll])

  const sendMessage = async (text?: string, file?: File) => {
    if (!currentRoom || (!text && !file)) return
    if (sending) return

    const token = localStorage.getItem('access_token')
    if (!token) return

    const formData = new FormData()
    formData.append('room', currentRoom.id.toString())
    if (text) formData.append('text', text)
    if (file) formData.append('image', file)

    setSending(true)
    try {
      await axiosInstance.post(`${API}/chat/messages/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      setNewMessage('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setShouldAutoScroll(true) // Ensure scroll when sending
      fetchMessages(currentRoom.id)
      fetchRooms()
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getOtherParticipant = (room: ChatRoom) => {
    return room.participants.find(p => p.id !== user?.id) || room.participants[0]
  }

  const getFullImageUrl = (imgPath: string) => {
    if (!imgPath) return ''
    if (imgPath.startsWith('http')) return imgPath
    return `${API?.replace('/api', '')}${imgPath}`
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const filteredRooms = rooms.filter(room => {
    if (!searchQuery) return true
    const other = getOtherParticipant(room)
    return other.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
           other.email.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Please log in to access chat</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Show on mobile when no room selected, always on desktop */}
      <div className={`${!currentRoom || showSidebar ? 'flex' : 'hidden'} md:flex w-full md:w-80 bg-white border-r flex-col min-w-0 absolute md:relative z-10 h-full`}>
        {/* Header */}
        <div className="p-3 sm:p-4 border-b pl-[max(0.75rem,var(--safe-area-inset-left))] pr-[max(0.75rem,var(--safe-area-inset-right))] sm:pl-4 sm:pr-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Messages</h1>
            <div className="flex gap-2">
              {currentRoom && (
                <button
                  onClick={() => {
                    setCurrentRoom(null)
                    setShowSidebar(true)
                  }}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        {/* Rooms List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              {!searchQuery && (
                <a
                  href="/listings"
                  className="inline-block px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
                >
                  Browse listings to message owners
                </a>
              )}
            </div>
          ) : (
            filteredRooms.map(room => {
              const other = getOtherParticipant(room)
              const isActive = currentRoom?.id === room.id
            return (
                <div
                key={room.id}
                onClick={() => {
                  setCurrentRoom(room)
                  setShowSidebar(false) // Hide sidebar on mobile when selecting room
                }}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
                    isActive ? 'bg-gray-50 border-l-4 border-l-black' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {other.username || other.email}
                        </h3>
                        {room.last_message && (
                          <span className="text-xs text-gray-500 ml-2">
                            {formatTime(room.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      {room.last_message && (
                        <p className="text-sm text-gray-600 truncate">
                          {room.last_message.text || '📷 Image'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Area - Show on mobile when room selected, always on desktop */}
      <div className={`${currentRoom ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 overflow-hidden`}>
        {currentRoom ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b p-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <a href={`/user/${getOtherParticipant(currentRoom).id}`} className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:ring-2 hover:ring-gray-300 transition-all">
                  <User className="h-5 w-5 text-gray-400" />
                </a>
                <div>
                  <a href={`/user/${getOtherParticipant(currentRoom).id}`} className="hover:underline">
                    <h2 className="font-semibold text-gray-900">
                      {getOtherParticipant(currentRoom).username || getOtherParticipant(currentRoom).email}
                    </h2>
                  </a>
                  <p className="text-sm text-gray-500">
                    {getOtherParticipant(currentRoom).email}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
            >
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender.id === user.id
                  return (
                <div
                  key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                      <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isOwn && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  {msg.text && (
                    <div
                              className={`px-4 py-2 rounded-2xl ${
                                isOwn
                                  ? 'bg-black text-white rounded-tr-sm'
                                  : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}
                          {msg.image && (
                            <div className="mb-2">
                              <Image
                                src={getFullImageUrl(msg.image)}
                                alt="Message image"
                                width={300}
                                height={300}
                                className="rounded-2xl object-cover max-w-full"
                    />
                            </div>
                          )}
                          <span className="text-xs text-gray-500 mt-1 px-1">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t p-4 flex-shrink-0">
              <div className="flex items-end gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0] && !sending) {
                      sendMessage(undefined, e.target.files[0])
                    }
                  }}
                />
                <textarea
                value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                  rows={1}
                  disabled={sending}
                  className="flex-1 min-w-0 px-4 py-2 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black resize-none max-h-32 disabled:opacity-70"
              />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium inline-flex items-center justify-center gap-1.5 min-w-[80px]"
                >
                  {sending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending…
                    </>
                  ) : (
                    'Send'
                  )}
              </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
