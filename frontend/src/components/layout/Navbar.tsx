'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music,
  Coins,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';

const NAV_LINKS = [
  { href: '/create', label: '创作' },
  { href: '/works', label: '作品' },
  { href: '/recharge', label: '充值' },
  { href: '/transactions', label: '明细' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { mobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } = useUIStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  function handleLogout() {
    logout();
    setDropdownOpen(false);
    router.push('/login');
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/" className="flex items-center gap-2 group">
            <Music className="w-7 h-7 text-cyan-neon" />
            <span className="text-xl font-bold text-cyan-neon glow-text-cyan hidden sm:block" style={{ fontFamily: 'var(--font-orbitron)' }}>
              AI Music
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {isAuthenticated && user && (
            <div className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-full bg-space-700/80 border border-cyan-neon/20">
              <Coins className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-neon" />
              <span
                className="text-xs md:text-sm font-bold text-cyan-neon glow-text-cyan"
                style={{ fontFamily: 'var(--font-orbitron)' }}
              >
                {user.credits}
              </span>
            </div>
          )}

          <Link
            href="/recharge"
            className="hidden md:block px-4 py-2 text-sm font-semibold text-white rounded-lg gradient-btn glow-cyan"
          >
            充值
          </Link>

          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full border border-white/10 hover:border-cyan-neon/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-full gradient-cyan-purple flex items-center justify-center text-white font-bold text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <ChevronDown
                  className={cn(
                    'hidden md:block w-4 h-4 text-text-secondary transition-transform duration-200',
                    dropdownOpen && 'rotate-180'
                  )}
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 py-1 rounded-xl glass-strong border border-white/10 shadow-2xl"
                  >
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      个人中心
                    </Link>
                    {user.isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        切换管理后台
                      </Link>
                    )}
                    <div className="border-t border-white/5 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-neon/80 hover:text-red-neon hover:bg-white/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 md:px-4 py-2 text-sm font-semibold text-cyan-neon rounded-lg border border-cyan-neon/30 hover:bg-cyan-neon/10 transition-colors"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}