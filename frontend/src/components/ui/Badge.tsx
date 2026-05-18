'use client'

import { cn } from '@/utils/cn'

type BadgeVariant = 'cyan' | 'purple' | 'green' | 'red' | 'gray'

interface BadgeProps {
  variant?: BadgeVariant
  dot?: boolean
  children: React.ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  cyan: 'bg-cyan-neon/10 text-cyan-neon border-cyan-neon/20',
  purple: 'bg-purple-neon/10 text-purple-neon border-purple-neon/20',
  green: 'bg-green-neon/10 text-green-neon border-green-neon/20',
  red: 'bg-red-neon/10 text-red-neon border-red-neon/20',
  gray: 'bg-space-600/50 text-text-secondary border-space-500/30',
}

const dotColors: Record<BadgeVariant, string> = {
  cyan: 'bg-cyan-neon',
  purple: 'bg-purple-neon',
  green: 'bg-green-neon',
  red: 'bg-red-neon',
  gray: 'bg-text-muted',
}

export default function Badge({
  variant = 'gray',
  dot = false,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border',
        variantStyles[variant]
      )}
    >
      {dot && (
        <span
          className={cn(
            'inline-block w-1.5 h-1.5 rounded-full shadow-[0_0_4px_currentColor]',
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  )
}