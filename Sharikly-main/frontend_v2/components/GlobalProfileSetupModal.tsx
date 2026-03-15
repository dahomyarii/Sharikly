'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useProfileSetup } from '@/contexts/ProfileSetupContext'
import ProfileSetupModal from './ProfileSetupModal'

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
  const pendingOpenRef = useRef<number | null>(null)
  const isOpenRef = useRef(isOpen)

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  const clearPendingOpen = useCallback(() => {
    if (pendingOpenRef.current !== null) {
      window.clearTimeout(pendingOpenRef.current)
      pendingOpenRef.current = null
    }
  }, [])

  const scheduleProfileSetup = useCallback(
    (userData: any, delayMs: number) => {
      if (typeof window === 'undefined' || !userData) return
      clearPendingOpen()
      pendingOpenRef.current = window.setTimeout(() => {
        pendingOpenRef.current = null
        if (isOpenRef.current) return
        if (isProfileIncomplete(userData) && !hasHandledProfileSetup(userData)) {
          showProfileSetup(userData)
        }
      }, delayMs)
    },
    [clearPendingOpen, showProfileSetup]
  )

  useEffect(() => {
    const handleLogin = (event: CustomEvent) => {
      const userData = event.detail?.user
      if (userData && isProfileIncomplete(userData) && !hasHandledProfileSetup(userData)) {
        // Small delay so the login modal closes first
        scheduleProfileSetup(userData, 400)
      }
    }

    window.addEventListener('userLogin', handleLogin as EventListener)
    return () => {
      clearPendingOpen()
      window.removeEventListener('userLogin', handleLogin as EventListener)
    }
  }, [clearPendingOpen, scheduleProfileSetup])

  // Also check on mount if a stored user has an incomplete profile (e.g. page refresh after first signup)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        const userData = JSON.parse(stored)
        if (isProfileIncomplete(userData) && !hasHandledProfileSetup(userData)) {
          scheduleProfileSetup(userData, 800)
        }
      } catch {}
    }
    return () => {
      clearPendingOpen()
    }
  }, [clearPendingOpen, scheduleProfileSetup])

  const handleUpdate = (updatedUser: any) => {
    clearPendingOpen()
    markProfileSetupHandled(updatedUser)
    hideProfileSetup()
  }

  const handleClose = () => {
    clearPendingOpen()
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
