'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import AdminSidebar from '@/components/layout/AdminSidebar'
import AdminHeader from '@/components/layout/AdminHeader'
import { X } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const { adminSidebarCollapsed, adminMobileOpen, setAdminMobileOpen } = useUIStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.isAdmin)) {
      router.replace('/login')
    }
  }, [isAuthenticated, user, isLoading, router])

  if (isLoading || !isAuthenticated || !user?.isAdmin) {
    return (
      <div className="min-h-screen bg-space-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cyan-neon border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm">验证管理员权限...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-space-900">
      <AdminHeader onMenuToggle={() => setAdminMobileOpen(!adminMobileOpen)} />
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      <AnimatePresence>
        {adminMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setAdminMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-space-800 border-r border-white/5 md:hidden"
            >
              <div className="flex items-center justify-end p-4">
                <button
                  onClick={() => setAdminMobileOpen(false)}
                  className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <AdminSidebar isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <motion.main
        initial={false}
        animate={{
          marginLeft: adminSidebarCollapsed ? 72 : 240,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="pt-16 min-h-screen md:block hidden"
      >
        <div className="p-6">
          {children}
        </div>
      </motion.main>

      <main className="pt-16 min-h-screen md:hidden">
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  )
}