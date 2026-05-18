'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Cpu,
  Package,
  ShoppingCart,
  Users,
  Settings,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';

const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: '仪表盘', icon: LayoutDashboard, exact: true },
  { href: '/admin/models', label: '模型管理', icon: Cpu },
  { href: '/admin/packages', label: '套餐管理', icon: Package },
  { href: '/admin/orders', label: '订单管理', icon: ShoppingCart },
  { href: '/admin/users', label: '用户管理', icon: Users },
  { href: '/admin/settings', label: '系统配置', icon: Settings },
  { href: '/admin/logs', label: '日志', icon: FileText },
];

export default function AdminSidebar({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const { adminSidebarCollapsed, setAdminMobileOpen } = useUIStore();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const handleNavClick = () => {
    if (isMobile) {
      setAdminMobileOpen(false);
    }
  };

  if (isMobile) {
    return (
      <nav className="flex-1 py-4 space-y-1 px-2">
        {ADMIN_NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-cyan-neon/10 text-cyan-neon'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
        <div className="border-t border-white/5 mt-4 pt-3">
          <Link
            href="/create"
            onClick={handleNavClick}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            返回用户端
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: adminSidebarCollapsed ? 72 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-16 bottom-0 z-40 glass border-r border-white/5 flex flex-col overflow-hidden"
    >
      <nav className="flex-1 py-4 space-y-1 px-2">
        {ADMIN_NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                active
                  ? 'bg-cyan-neon/10 text-cyan-neon'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              )}
            >
              {active && (
                <motion.div
                  layoutId="admin-sidebar-active"
                  className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-cyan-neon"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5 shrink-0" />
              <motion.span
                initial={false}
                animate={{
                  opacity: adminSidebarCollapsed ? 0 : 1,
                  width: adminSidebarCollapsed ? 0 : 'auto',
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

      <div className="border-t border-white/5">
        <Link
          href="/create"
          className={cn(
            'flex items-center gap-3 px-3 py-3 mx-2 my-2 rounded-lg text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors',
            adminSidebarCollapsed && 'justify-center'
          )}
        >
          <ArrowLeft className="w-5 h-5 shrink-0" />
          <motion.span
            initial={false}
            animate={{
              opacity: adminSidebarCollapsed ? 0 : 1,
              width: adminSidebarCollapsed ? 0 : 'auto',
            }}
            transition={{ duration: 0.15 }}
            className="whitespace-nowrap overflow-hidden"
          >
            返回用户端
          </motion.span>
        </Link>
      </div>
    </motion.aside>
  );
}