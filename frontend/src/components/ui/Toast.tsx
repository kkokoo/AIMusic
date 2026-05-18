'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useUIStore } from '@/stores/uiStore'
import type { ToastType } from '@/types'

const typeConfig: Record<ToastType, { bg: string; border: string; icon: React.FC<{ className?: string }> }> = {
  success: {
    bg: 'bg-green-neon/10',
    border: 'border-green-neon/30',
    icon: CheckCircle,
  },
  error: {
    bg: 'bg-red-neon/10',
    border: 'border-red-neon/30',
    icon: AlertCircle,
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-cyan-neon/10',
    border: 'border-cyan-neon/30',
    icon: Info,
  },
}

const iconColors: Record<ToastType, string> = {
  success: 'text-green-neon',
  error: 'text-red-neon',
  warning: 'text-yellow-400',
  info: 'text-cyan-neon',
}

const progressColors: Record<ToastType, string> = {
  success: 'bg-green-neon',
  error: 'bg-red-neon',
  warning: 'bg-yellow-400',
  info: 'bg-cyan-neon',
}

export default function Toast() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration ?? 4000}
            onRemove={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({
  id,
  type,
  message,
  duration,
  onRemove,
}: {
  id: string
  type: ToastType
  message: string
  duration: number
  onRemove: (id: string) => void
}) {
  const config = typeConfig[type]
  const Icon = config.icon
  const [width, setWidth] = useState(100)
  const startRef = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    startRef.current = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startRef.current
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setWidth(remaining)
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [duration])

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        'pointer-events-auto relative w-80 rounded-xl border backdrop-blur-lg shadow-lg overflow-hidden',
        config.bg,
        config.border
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconColors[type])} />
        <p className="text-sm text-white flex-1 pr-5">{message}</p>
        <button
          onClick={() => onRemove(id)}
          className="absolute top-3 right-3 text-text-muted hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="h-1 w-full bg-white/5">
        <div
          className={cn('h-full transition-none', progressColors[type])}
          style={{ width: `${width}%` }}
        />
      </div>
    </motion.div>
  )
}