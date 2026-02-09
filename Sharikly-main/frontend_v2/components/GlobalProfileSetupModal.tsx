'use client'

import { useProfileSetup } from '@/contexts/ProfileSetupContext'
import ProfileSetupModal from './ProfileSetupModal'
import { useRouter } from 'next/navigation'

export default function GlobalProfileSetupModal() {
  const { isOpen, user, hideProfileSetup } = useProfileSetup()
  const router = useRouter()

  const handleUpdate = (updatedUser: any) => {
    hideProfileSetup()
    router.refresh()
  }

  if (!isOpen || !user) return null

  return (
    <ProfileSetupModal
      isOpen={isOpen}
      onClose={hideProfileSetup}
      user={user}
      onUpdate={handleUpdate}
    />
  )
}



