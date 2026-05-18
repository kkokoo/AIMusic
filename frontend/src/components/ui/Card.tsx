'use client'

import { cn } from '@/utils/cn'

type PaddingVariant = 'sm' | 'md' | 'lg'

interface CardProps {
  hover?: boolean
  glow?: boolean
  padding?: PaddingVariant
  className?: string
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
}

const paddingStyles: Record<PaddingVariant, string> = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
}

export default function Card({
  hover = false,
  glow = false,
  padding = 'md',
  className,
  children,
  header,
  footer,
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-space-800 border border-space-600/50',
        'transition-all duration-300',
        hover && 'hover:border-space-500 hover:-translate-y-0.5',
        glow && 'hover:shadow-[0_0_20px_var(--color-cyan-glow)] hover:border-cyan-neon/30',
        className
      )}
    >
      {header && (
        <div className="px-5 py-4 border-b border-space-600/50">{header}</div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
      {footer && (
        <div className="px-5 py-4 border-t border-space-600/50">{footer}</div>
      )}
    </div>
  )
}