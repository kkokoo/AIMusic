'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'

export default function Providers({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    if (!hasHydrated) return
    if (initialized.current) return
    initialized.current = true

    if (token) {
      useAuthStore.getState().fetchProfile()
    }
  }, [hasHydrated, token])

  return <>{children}</>
}
