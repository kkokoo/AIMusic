'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'

export default function Providers({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const token = localStorage.getItem('auth-token')
    if (token) {
      useAuthStore.getState().fetchProfile()
    }
  }, [])

  return <>{children}</>
}