'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axiosInstance from '@/lib/axios'
import { Camera, X, Loader2, User } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

const API = process.env.NEXT_PUBLIC_API_BASE

interface ProfileSetupModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
  onUpdate: (updatedUser: any) => void
}

export default function ProfileSetupModal({
  isOpen,
  onClose,
  user,
  onUpdate,
}: ProfileSetupModalProps) {
  const { showToast } = useToast()
  const [username, setUsername] = useState(user?.username || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (user?.avatar) {
      const url = user.avatar.startsWith('http')
        ? user.avatar
        : `${API?.replace('/api', '')}${user.avatar}`
      setAvatarPreview(url)
    }
  }, [user])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatar(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('access_token')
      const formData = new FormData()
      formData.append('username', username)
      if (bio) {
        formData.append('bio', bio)
      }
      if (avatar) {
        formData.append('avatar', avatar)
      }

      const response = await axiosInstance.patch(`${API}/auth/me/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      const updatedUser = response.data
      localStorage.setItem('user', JSON.stringify(updatedUser))
      window.dispatchEvent(
        new CustomEvent('userLogin', { detail: { user: updatedUser, token } })
      )

      onUpdate(updatedUser)
      showToast('Profile updated!', 'success')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      showToast(error?.response?.data?.detail || 'Failed to update profile', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-[slideUp_0.3s_ease-out] overflow-hidden">

        {/* Header */}
        <div className="relative bg-black px-6 pt-8 pb-14 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-white">Complete your profile</h2>
          <p className="text-sm text-white/60 mt-1">
            Help others get to know you
          </p>
        </div>

        {/* Avatar overlapping header */}
        <div className="flex justify-center -mt-10 relative z-10">
          <div className="relative group">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-black text-white p-1.5 rounded-full hover:bg-gray-800 transition-colors shadow-md"
              aria-label="Upload photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Form */}
        <div className="px-6 pt-5 pb-6 space-y-4">
          <p className="text-center text-xs text-gray-400">
            Tap the avatar to upload a photo
          </p>

          {/* Username */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-widest text-gray-400 mb-1.5">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your display name"
              className="w-full bg-transparent border-b-2 border-gray-200 focus:border-black outline-none text-base font-medium py-2 transition-colors placeholder:text-gray-300"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-widest text-gray-400 mb-1.5">
              Bio <span className="text-gray-300 normal-case">(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell others about yourself..."
              className="w-full border-2 border-gray-200 focus:border-black outline-none text-sm py-2.5 px-3 rounded-xl transition-colors placeholder:text-gray-300 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 h-11 border border-gray-200 text-gray-600 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Skip for now
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !username.trim()}
              className="flex-1 h-11 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (typeof window === 'undefined') return null
  return createPortal(modalContent, document.body)
}
