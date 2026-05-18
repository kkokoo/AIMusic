'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music, Disc, Wallet, Receipt, User, Compass } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';

const NAV_ITEMS = [
  { href: '/create', label: '创作', icon: Music },
  { href: '/discover', label: '发现', icon: Compass },
  { href: '/works', label: '作品', icon: Disc },
  { href: '/recharge', label: '充值', icon: Wallet },
  { href: '/transactions', label: '明细', icon: Receipt },
  { href: '/profile', label: '个人中心', icon: User },
];

export default function Sidebar({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const { sidebarCollapsed, setMobileMenuOpen } = useUIStore();

  const handleNavClick = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  if (isMobile) {
    return (
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-cyan-neon/10 text-cyan-neon'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
        <div className="px-3 py-4 border-t border-white/5 mt-4">
          <span
            className="text-xs text-text-muted"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            v1.0
          </span>
        </div>
      </nav>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-16 bottom-0 z-40 glass border-r border-white/5 flex flex-col overflow-hidden"
    >
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-cyan-neon/10 text-cyan-neon'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-cyan-neon"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5 shrink-0" />
              <motion.span
                initial={false}
                animate={{
                  opacity: sidebarCollapsed ? 0 : 1,
                  width: sidebarCollapsed ? 0 : 'auto',
                }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          'px-3 py-4 border-t border-white/5',
          sidebarCollapsed && 'flex justify-center'
        )}
      >
        <span
          className="text-xs text-text-muted whitespace-nowrap"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          v1.0
        </span>
      </div>
    </motion.aside>
  );
}