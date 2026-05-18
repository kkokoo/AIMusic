'use client'

import { useState } from 'react'

interface SliderProps {
  min?: number
  max?: number
  step?: number
  value: number
  onChange: (value: number) => void
  label?: string
  showValue?: boolean
}

export default function Slider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  label,
  showValue = true,
}: SliderProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const percentage = ((value - min) / (max - min)) * 100
  const showLabel = isHovering || isDragging

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-text-secondary">{label}</span>
          )}
        </div>
      )}
      <div
        className="relative w-full h-7 flex items-center"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false)
          setIsDragging(false)
        }}
        onPointerDown={() => setIsDragging(true)}
        onPointerUp={() => setIsDragging(false)}
      >
        <div className="relative w-full h-1.5 rounded-full bg-space-600">
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-cyan-neon shadow-[0_0_8px_var(--color-cyan-glow)] transition-all duration-75"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-cyan-neon border-2 border-space-800 shadow-[0_0_10px_var(--color-cyan-glow)] cursor-pointer transition-transform duration-75 hover:scale-125 active:scale-125"
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
        {showValue && showLabel && (
          <div
            className="absolute -top-8 px-2 py-0.5 rounded-md bg-space-700 border border-space-600 text-xs text-cyan-neon whitespace-nowrap pointer-events-none"
            style={{ left: `calc(${percentage}% - 16px)` }}
          >
            {value}
          </div>
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  )
}