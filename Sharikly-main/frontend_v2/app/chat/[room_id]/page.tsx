'use client'
import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { useParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_BASE

export default function ChatRoomPage() {
  const { room_id } = useParams()
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [user, setUser] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // fetch messages
  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API}/chat/${room_id}/messages/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      })
      setMessages(res.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user')
      if (storedUser) setUser(JSON.parse(storedUser))
    }
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000) // poll every 3s
    return () => clearInterval(interval)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!text && !fileInputRef.current?.files?.length) return
    const formData = new FormData()
    formData.append('text', text)
    if (fileInputRef.current?.files?.[0]) {
      formData.append('image', fileInputRef.current.files[0])
    }

    try {
      await axios.post(`${API}/chat/${room_id}/send/`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      setText('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchMessages()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
        {messages.map((m) => (
          <div key={m.id} className="mb-3">
            <div className="text-xs text-gray-500">{m.sender.email}</div>
            {m.text && <div className="px-3 py-2 rounded bg-white inline-block">{m.text}</div>}
            {m.image && <img src={`${API}${m.image}`} className="max-w-xs mt-1 rounded" />}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input area */}
      <div className="p-4 bg-white flex items-center gap-2 border-t">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 border rounded-xl px-4 py-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <input type="file" ref={fileInputRef} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 bg-gray-200 rounded"
        >
          📎
        </button>
        <button
          onClick={handleSend}
          className="px-5 py-2 bg-black text-white rounded-full"
        >
          Send
        </button>
      </div>
    </div>
  )
}
