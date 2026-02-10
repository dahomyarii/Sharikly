'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ProfileSetupContextType {
  showProfileSetup: (user: any) => void
  hideProfileSetup: () => void
  isOpen: boolean
  user: any
}

const ProfileSetupContext = createContext<ProfileSetupContextType | undefined>(undefined)

export function ProfileSetupProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  const showProfileSetup = (userData: any) => {
    setUser(userData)
    setIsOpen(true)
  }

  const hideProfileSetup = () => {
    setIsOpen(false)
    setUser(null)
  }

  return (
    <ProfileSetupContext.Provider value={{ showProfileSetup, hideProfileSetup, isOpen, user }}>
      {children}
    </ProfileSetupContext.Provider>
  )
}

export function useProfileSetup() {
  const context = useContext(ProfileSetupContext)
  if (!context) {
    throw new Error('useProfileSetup must be used within ProfileSetupProvider')
  }
  return context
}




