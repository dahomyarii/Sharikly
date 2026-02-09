'use client'

import { ToastProvider } from "@/components/ui/toast"
import { ProfileSetupProvider } from "@/contexts/ProfileSetupContext"
import GlobalProfileSetupModal from "@/components/GlobalProfileSetupModal"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ProfileSetupProvider>
        {children}
        <GlobalProfileSetupModal />
      </ProfileSetupProvider>
    </ToastProvider>
  )
}



