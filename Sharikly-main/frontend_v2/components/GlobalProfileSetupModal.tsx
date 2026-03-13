'use client'

import { useEffect } from 'react'
import { useProfileSetup } from '@/contexts/ProfileSetupContext'
import ProfileSetupModal from './ProfileSetupModal'
import { useRouter } from 'next/navigation'

function isProfileIncomplete(user: any): boolean {
  if (!user) return false
  const hasAvatar = user.avatar && user.avatar !== '' && user.avatar !== null
  const hasBio = user.bio && user.bio.trim() !== ''
  return !hasAvatar && !hasBio
}

function profileSetupHandledKey(user: any): string {
  return `profileSetupHandled:${user?.id ?? 'anonymous'}`
}

function hasHandledProfileSetup(user: any): boolean {
  if (typeof window === 'undefined' || !user) return false
  return localStorage.getItem(profileSetupHandledKey(user)) === '1'
}

function markProfileSetupHandled(user: any): void {
  if (typeof window === 'undefined' || !user) return
  localStorage.setItem(profileSetupHandledKey(user), '1')
}

export default function GlobalProfileSetupModal() {
  const { isOpen, user, hideProfileSetup, showProfileSetup } = useProfileSetup()
  const router = useRouter()

  useEffect(() => {
    const handleLogin = (event: CustomEvent) => {
      const userData = event.detail?.user
      if (userData && isProfileIncomplete(userData) && !hasHandledProfileSetup(userData)) {
        // Small delay so the login modal closes first
        setTimeout(() => {
          showProfileSetup(userData)
        }, 400)
      }
    }

    window.addEventListener('userLogin', handleLogin as EventListener)
    return () => {
      window.removeEventListener('userLogin', handleLogin as EventListener)
    }
  }, [showProfileSetup])

  // Also check on mount if a stored user has an incomplete profile (e.g. page refresh after first signup)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        const userData = JSON.parse(stored)
        if (isProfileIncomplete(userData) && !hasHandledProfileSetup(userData)) {
          setTimeout(() => showProfileSetup(userData), 800)
        }
      } catch {}
    }
  }, [showProfileSetup])

  const handleUpdate = (updatedUser: any) => {
    markProfileSetupHandled(updatedUser)
    hideProfileSetup()
    router.refresh()
  }

  const handleClose = () => {
    markProfileSetupHandled(user)
    hideProfileSetup()
  }

  if (!isOpen || !user) return null

  return (
    <ProfileSetupModal
      isOpen={isOpen}
      onClose={handleClose}
      user={user}
      onUpdate={handleUpdate}
    />
  )
}
