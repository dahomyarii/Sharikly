'use client'

import { SWRConfig } from "swr"
import { ToastProvider } from "@/components/ui/toast"
import { ProfileSetupProvider } from "@/contexts/ProfileSetupContext"
import GlobalProfileSetupModal from "@/components/GlobalProfileSetupModal"

// Reduce refetches and improve Speed Index / TTI: cache longer, revalidate less aggressively
const swrConfig = {
  dedupingInterval: 15_000,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: true,
  keepPreviousData: true,
  errorRetryCount: 2,
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={swrConfig}>
      <ToastProvider>
        <ProfileSetupProvider>
          {children}
          <GlobalProfileSetupModal />
        </ProfileSetupProvider>
      </ToastProvider>
    </SWRConfig>
  )
}




