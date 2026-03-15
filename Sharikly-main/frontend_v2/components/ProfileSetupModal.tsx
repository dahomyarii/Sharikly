'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axiosInstance from '@/lib/axios'
import { Camera, X, Loader2, User, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

const API = process.env.NEXT_PUBLIC_API_BASE
const MAX_BIO_LENGTH = 160

interface ProfileSetupModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
  onUpdate: (updatedUser: any) => void
}

function getAvatarUrl(avatar?: string | null) {
  if (!avatar) return null
  return avatar.startsWith('http') ? avatar : `${API?.replace('/api', '')}${avatar}`
}

export default function ProfileSetupModal({
  isOpen,
  onClose,
  user,
  onUpdate,
}: ProfileSetupModalProps) {
  const { showToast } = useToast()
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
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
    if (!isOpen) return
    setUsername(user?.username || '')
    setBio(user?.bio || '')
    setAvatar(null)
    setAvatarPreview(getAvatarUrl(user?.avatar))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [isOpen, user?.id, user?.username, user?.bio, user?.avatar])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatar(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const resetAvatarSelection = () => {
    setAvatar(null)
    setAvatarPreview(getAvatarUrl(user?.avatar))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('access_token')
      const formData = new FormData()
      formData.append('username', username.trim())
      formData.append('bio', bio)
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
      onUpdate(updatedUser)
      window.dispatchEvent(
        new CustomEvent('userLogin', { detail: { user: updatedUser, token } })
      )
      showToast('Profile updated!', 'success')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      showToast(error?.response?.data?.detail || 'Failed to update profile', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !mounted || typeof window === 'undefined') return null

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-[slideUp_0.3s_ease-out]">
        <div className="relative bg-black px-6 pb-14 pt-8 text-center">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/60 transition-colors hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold text-white">Complete your profile</h2>
          <p className="mt-1 text-sm text-white/60">Help others get to know you</p>
        </div>

        <div className="relative z-10 -mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg transition hover:opacity-90"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <User className="h-8 w-8 text-gray-400" />
            )}
            <span className="absolute bottom-0 right-0 rounded-full bg-black p-1.5 text-white shadow-md">
              <Camera className="h-3.5 w-3.5" />
            </span>
          </button>
        </div>

        <div className="max-h-[calc(90svh-7rem)] space-y-4 overflow-y-auto px-6 pb-6 pt-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleAvatarChange}
            className="hidden"
          />

          <p className="text-center text-xs text-gray-400">
            Add a profile photo now, or change it any time later from your account.
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <Camera className="h-4 w-4" />
              {avatarPreview ? 'Change photo' : 'Choose photo'}
            </button>
            {avatar && (
              <button
                type="button"
                onClick={resetAvatarSelection}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                Reset selection
              </button>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-gray-400">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your display name"
              className="w-full border-b-2 border-gray-200 bg-transparent py-2 text-base font-medium outline-none transition-colors placeholder:text-gray-300 focus:border-black"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-gray-400">
              Bio <span className="normal-case text-gray-300">(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO_LENGTH))}
              rows={4}
              placeholder="Tell others about yourself..."
              className="w-full resize-none rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-300 focus:border-black"
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {bio.length}/{MAX_BIO_LENGTH}
            </p>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="h-11 flex-1 rounded-full border border-gray-200 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !username.trim()}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-black text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
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

  return createPortal(modalContent, document.body)
}
