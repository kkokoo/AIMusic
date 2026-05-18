import { create } from 'zustand'
import type { Toast, ToastType } from '@/types'

interface UIState {
  toasts: Toast[]
  toast: (type: ToastType, message: string, duration?: number) => void
  removeToast: (id: string) => void
  sidebarCollapsed: boolean
  adminSidebarCollapsed: boolean
  toggleAdminSidebar: () => void
  mobileMenuOpen: boolean
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void
  adminMobileOpen: boolean
  setAdminMobileOpen: (open: boolean) => void
}

let toastId = 0

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  toast: (type, message, duration = 4000) => {
    const id = `toast-${++toastId}`
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration }],
    }))
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, duration)
    }
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
  sidebarCollapsed: false,
  adminSidebarCollapsed: false,
  toggleAdminSidebar: () =>
    set((state) => ({ adminSidebarCollapsed: !state.adminSidebarCollapsed })),
  mobileMenuOpen: false,
  toggleMobileMenu: () =>
    set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  adminMobileOpen: false,
  setAdminMobileOpen: (open) => set({ adminMobileOpen: open }),
}))