'use client'
import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axiosInstance from '@/lib/axios'
import Link from 'next/link'
import { ArrowLeft, User, Image as ImageIcon, Ban } from 'lucide-react'
import Image from 'next/image'
import { useLocale } from '@/components/LocaleProvider'

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

export default function ChatRoomPage() {
  const params = useParams()
  const router = useRouter()
  const room_id = typeof params.room_id === 'string' ? params.room_id : Array.isArray(params.room_id) ? params.room_id[0] : String(params.room_id || '')
  
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [user, setUser] = useState<any>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [room, setRoom] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const previousMessagesLength = useRef(0)
  const [blockLoading, setBlockLoading] = useState(false)
  const { t } = useLocale()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user')
      if (storedUser) setUser(JSON.parse(storedUser))
    }
  }, [])

  // Fetch room details
  const fetchRoom = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      const res = await axiosInstance.get(`${API}/chat/rooms/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const foundRoom = res.data.find((r: any) => r.id === parseInt(room_id))
      if (foundRoom) {
        setRoom(foundRoom)
        const other = foundRoom.participants.find((p: any) => p.id !== user?.id)
        setOtherUser(other)
      }
    } catch (err) {
      console.error('Error fetching room:', err)
    }
  }

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      const res = await axiosInstance.get(`${API}/chat/messages/${room_id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessages(res.data)
    } catch (err) {
      console.error('Error fetching messages:', err)
    }
  }

  useEffect(() => {
    if (user && room_id) {
      fetchRoom()
      fetchMessages()
      const interval = setInterval(() => {
        fetchMessages()
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [user, room_id])

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
  }, [])

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

  const handleSend = async () => {
    if (!text && !fileInputRef.current?.files?.length) return

    const token = localStorage.getItem('access_token')
    if (!token) return

    const formData = new FormData()
    formData.append('room', room_id)
    if (text) formData.append('text', text)
    if (fileInputRef.current?.files?.[0]) {
      formData.append('image', fileInputRef.current.files[0])
    }

    try {
      await axiosInstance.post(`${API}/chat/messages/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      setText('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setShouldAutoScroll(true) // Ensure scroll when sending
      fetchMessages()
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Please log in to access chat</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b p-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => router.push('/chat')}
              className="p-2 hover:bg-gray-100 rounded-full transition flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Link
              href={otherUser ? `/user/${otherUser.id}` : '#'}
              className="flex items-center gap-4 min-w-0"
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold text-gray-900 truncate">
                  {otherUser?.username || otherUser?.email || 'Chat'}
                </h1>
                <p className="text-sm text-gray-500 truncate">
                  {otherUser?.email}
                </p>
              </div>
            </Link>
          </div>
          {otherUser && (
            <button
              onClick={async () => {
                if (!confirm(t('block_user_confirm'))) return
                setBlockLoading(true)
                try {
                  const token = localStorage.getItem('access_token')
                  await axiosInstance.post(
                    `${API}/users/${otherUser.id}/block/`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                  )
                  router.push('/chat')
                } catch (err) {
                  console.error(err)
                } finally {
                  setBlockLoading(false)
                }
              }}
              disabled={blockLoading}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0"
              title={t('block_user')}
            >
              <Ban className="h-5 w-5" />
            </button>
          )}
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
            <ImageIcon className="h-5 w-5 text-gray-600" />
          </button>
        <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
          />
          <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 min-w-0 px-4 py-2 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black resize-none max-h-32"
          />
        <button
          onClick={handleSend}
            disabled={!text.trim() && !fileInputRef.current?.files?.length}
            className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Send
        </button>
        </div>
      </div>
    </div>
  )
}
