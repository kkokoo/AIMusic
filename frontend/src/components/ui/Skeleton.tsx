'use client'

import { cn } from '@/utils/cn'

type SkeletonVariant = 'text' | 'circular' | 'rectangular'

interface SkeletonProps {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  className?: string
}

const variantStyles: Record<SkeletonVariant, string> = {
  text: 'rounded-md h-4',
  circular: 'rounded-full',
  rectangular: 'rounded-xl',
}

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-space-600/60',
        variantStyles[variant],
        className
      )}
      style={{ width, height }}
    />
  )
}