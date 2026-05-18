'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useUIStore } from '@/stores/uiStore';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import MusicPlayer from '@/components/ui/MusicPlayer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sidebarCollapsed, mobileMenuOpen, setMobileMenuOpen } = useUIStore();

  const isAdmin = pathname.startsWith('/admin');
  const isAuth = pathname === '/login' || pathname === '/register';

  if (isAdmin || isAuth) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <Navbar />
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <button
        onClick={() => useUIStore.setState({ sidebarCollapsed: !sidebarCollapsed })}
        className={cn(
          'hidden md:flex fixed z-50 w-6 h-6 rounded-full items-center justify-center',
          'bg-space-700 border border-space-600 text-text-muted',
          'hover:text-cyan-neon hover:border-cyan-neon/40 transition-colors',
          'top-20',
          sidebarCollapsed ? 'left-[60px]' : 'left-[228px]'
        )}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 glass border-r border-white/5 md:hidden"
            >
              <div className="flex items-center justify-end p-4">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Sidebar isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      
      <div
        className={cn(
          'flex flex-col flex-1 min-h-0 transition-all duration-300',
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-56',
          'ml-0'
        )}
      >
        <div className="h-16 shrink-0" />
        <main className="flex-1 min-h-0 overflow-y-auto bg-space-900 bg-grid">
          {children}
        </main>

        <MusicPlayer />
      </div>
    </div>
  );
}