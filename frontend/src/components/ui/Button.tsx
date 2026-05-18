'use client'

import { type ButtonHTMLAttributes, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
  children: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-cyan-neon to-[#0090ff] text-space-900 font-semibold hover:from-[#33f3ff] hover:to-[#33a0ff] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]',
  secondary:
    'border border-purple-neon text-purple-neon bg-transparent hover:bg-purple-glow/10 hover:shadow-[0_0_12px_var(--color-purple-glow)]',
  danger:
    'bg-red-neon/10 border border-red-neon text-red-neon hover:bg-red-neon/20 hover:shadow-[0_0_12px_rgba(255,68,114,0.3)]',
  ghost:
    'text-text-secondary hover:text-white hover:bg-white/5',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-7 py-3 text-base rounded-xl gap-2.5',
}

const iconSizes: Record<ButtonSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className,
  children,
  ...props
}: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const rippleId = useRef(0)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return

    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = ++rippleId.current
      setRipples((prev) => [...prev, { id, x, y }])
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id))
      }, 600)
    }
    onClick?.(e)
  }

  const isDisabled = disabled || loading

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        'relative inline-flex items-center justify-center font-medium tracking-wide transition-all duration-300 overflow-hidden select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-neon/50 focus-visible:ring-offset-2 focus-visible:ring-offset-space-800',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {loading && (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
          className={cn('inline-flex shrink-0', iconSizes[size])}
        >
          <Loader2 className={iconSizes[size]} />
        </motion.span>
      )}
      <span className={cn('inline-flex items-center gap-2.5', loading && 'opacity-70')}>{children}</span>
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{
            left: r.x - 5,
            top: r.y - 5,
            width: 10,
            height: 10,
          }}
        />
      ))}
    </button>
  )
}