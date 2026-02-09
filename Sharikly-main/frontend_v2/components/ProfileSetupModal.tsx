'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axiosInstance from '@/lib/axios'
import { Camera, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null)
  const [isSaving, setIsSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

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
      showToast('Profile setup complete!', 'success')
      onClose()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      showToast(error?.response?.data?.detail || 'Failed to update profile', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  const getFullImageUrl = (imgPath: string) => {
    if (!imgPath) return null
    if (imgPath.startsWith('http')) return imgPath
    return `${API?.replace('/api', '')}${imgPath}`
  }

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome! 🎉</h2>
          <p className="text-sm text-gray-600">
            Complete your profile to get started. Add a profile picture and bio to help others get to know you better.
          </p>
        </div>

        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden ring-4 ring-gray-100 group-hover:ring-blue-200 transition-all">
                {avatarPreview ? (
                  <img
                    src={getFullImageUrl(avatarPreview) || avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-10 h-10 text-gray-400" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-all shadow-lg hover:scale-110"
                aria-label="Upload profile picture"
              >
                <Camera className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Click the camera icon to upload your profile picture</p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              className="w-full"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio (Optional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell us about yourself..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={handleSkip}
              variant="outline"
              className="flex-1"
              disabled={isSaving}
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSaving || !username.trim()}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save & Continue'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  // Use portal to render at document body level to ensure it shows even if parent unmounts
  if (typeof window === 'undefined') return null
  
  return createPortal(modalContent, document.body)
}

