'use client';

import Link from 'next/link';
import { Menu, Shield, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

export default function AdminHeader({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { user } = useAuthStore();
  const { toggleAdminSidebar } = useUIStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-white/5 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle || toggleAdminSidebar}
          className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Shield className="w-5 md:w-6 h-5 md:h-6 text-cyan-neon" />
          <span
            className="text-base md:text-lg font-bold text-cyan-neon glow-text-cyan"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            管理后台
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <Link
          href="/create"
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-cyan-neon transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">返回用户端</span>
        </Link>

        {user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-cyan-purple flex items-center justify-center text-white font-bold text-sm">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-white">{user.username}</p>
              <p className="text-xs text-text-muted">管理员</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}