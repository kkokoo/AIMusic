'use client'

import { type InputHTMLAttributes, useState } from 'react'
import { Eye, EyeOff, Search } from 'lucide-react'
import { cn } from '@/utils/cn'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export default function Input({
  label,
  error,
  type = 'text',
  icon,
  className,
  id,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const isSearch = type === 'search'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block mb-1.5 text-sm font-medium text-text-secondary"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {(isSearch || icon) && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            {icon || <Search className="h-4 w-4" />}
          </span>
        )}
        <input
          id={id}
          type={inputType}
          className={cn(
            'w-full rounded-xl bg-space-800 border border-space-600 px-4 py-2.5 text-sm text-white placeholder:text-text-muted',
            'transition-all duration-200',
            'focus:outline-none focus:border-cyan-neon focus:shadow-[0_0_12px_var(--color-cyan-glow)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            (isSearch || !!icon) && 'pl-10',
            isPassword && 'pr-10',
            error
              ? 'border-red-neon focus:border-red-neon focus:shadow-[0_0_12px_rgba(255,68,114,0.3)]'
              : '',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-neon">{error}</p>
      )}
    </div>
  )
}