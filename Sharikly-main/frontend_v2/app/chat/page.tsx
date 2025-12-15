'use client'
import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_BASE

export default function ChatPage() {
  const [rooms, setRooms] = useState<any[]>([])
  const [currentRoom, setCurrentRoom] = useState<any>(null)
  const [newMessage, setNewMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const userId = typeof window !== 'undefined' ? parseInt(localStorage.getItem('userId') || '0') : 0
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  // Fetch chat rooms and their messages
  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API}/chat/rooms/`, { headers })
      const roomsWithMessages = await Promise.all(
        res.data.map(async (room: any) => {
          const messagesRes = await axios.get(`${API}/chat/messages/?room=${room.id}`, { headers })
          return { ...room, messages: messagesRes.data }
        })
      )
      setRooms(roomsWithMessages)
      if (!currentRoom && roomsWithMessages.length) setCurrentRoom(roomsWithMessages[0])
    } catch (err) {
      console.error('Error fetching rooms:', err)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  // Send a message (text, image, or audio)
  const sendMessage = async (text?: string, file?: File | Blob) => {
    if (!currentRoom) return
    const formData = new FormData()
    formData.append('room', currentRoom.id.toString())
    if (text) formData.append('text', text)
    if (file) formData.append(file instanceof File ? 'image' : 'audio', file, 'upload')
    try {
      const res = await axios.post(`${API}/chat/messages/`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      })
      setCurrentRoom({ ...currentRoom, messages: [...currentRoom.messages, res.data] })
      setNewMessage('')
    } catch (err) {
      console.error('Failed to send message:', err)
      alert('Failed to send message. Check console.')
    }
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    sendMessage(undefined, e.target.files[0])
  }

  // Handle voice recording
  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop()
      setRecording(false)
    } else {
      if (!navigator.mediaDevices?.getUserMedia) return
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = e => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        sendMessage(undefined, blob)
      }
      mediaRecorder.start()
      setRecording(true)
    }
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r overflow-y-auto bg-white">
        <div className="p-4 font-bold text-lg">Recent Chats</div>
        <ul>
          {rooms.map(room => {
            const other = room.participants.find((p: any) => p.id !== userId)
            return (
              <li
                key={room.id}
                onClick={() => setCurrentRoom(room)}
                className={`p-4 cursor-pointer hover:bg-gray-100 ${
                  currentRoom?.id === room.id ? 'bg-gray-200' : ''
                }`}
              >
                {other?.email}
              </li>
            )
          })}
        </ul>
      </aside>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentRoom ? (
          <>
            <div className="border-b p-4 font-semibold">
              {currentRoom.participants
                .map((p: any) => p.email)
                .filter((email: string) => email !== localStorage.getItem('userEmail'))
                .join(', ')}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {currentRoom.messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender.id === userId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.text && (
                    <div
                      className={`px-4 py-2 rounded-xl ${
                        msg.sender.id === userId ? 'bg-black text-white' : 'bg-gray-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}
                  {msg.image_url && (
                    <img
                      src={msg.image_url}
                      alt="uploaded"
                      className="w-48 h-48 object-cover rounded-xl"
                    />
                  )}
                  {msg.audio_url && <audio controls src={msg.audio_url} className="w-48" />}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t p-4 flex gap-2 items-center bg-white">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                className="flex-1 border rounded-xl px-4 py-2"
                placeholder="Type a message..."
              />
              <button onClick={() => sendMessage(newMessage)} className="px-4 py-2 bg-black text-white rounded-full">
                Send
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border rounded-full">
                📷
              </button>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              <button onClick={toggleRecording} className="px-4 py-2 border rounded-full">
                {recording ? '⏹ Stop' : '🎤 Record'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">No chats yet</div>
        )}
      </div>
    </div>
  )
}
