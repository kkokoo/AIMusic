'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
}

export default function Select({
  label,
  options,
  value,
  onChange,
  error,
  placeholder = '请选择...',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 300,
    direction: 'down' as 'up' | 'down',
  })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const selectedOption = options.find((o) => o.value === value)

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.bottom - 8
      const spaceAbove = rect.top - 8

      let direction: 'up' | 'down' = 'down'
      let maxHeight = 300

      // 决定弹出方向并计算对应可用高度
      if (spaceBelow >= 160 || spaceBelow >= spaceAbove) {
        direction = 'down'
        maxHeight = Math.min(300, spaceBelow - 8)
      } else {
        direction = 'up'
        maxHeight = Math.min(300, spaceAbove - 8)
      }

      setDropdownPos({
        top: direction === 'down' ? rect.bottom + 4 : rect.top - maxHeight - 4,
        left: rect.left,
        width: rect.width,
        maxHeight,
        direction,
      })
    }
  }, [])

  const handleToggle = useCallback(() => {
    if (!isOpen) {
      updatePosition()
    }
    setIsOpen(!isOpen)
  }, [isOpen, updatePosition])

  // 仅在打开时绑定事件，并在关闭或依赖变化时清理
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const isInsideContainer = containerRef.current?.contains(target)
      const isInsideDropdown = dropdownRef.current?.contains(target)

      if (!isInsideContainer && !isInsideDropdown) {
        setIsOpen(false)
      }
    }

    const handleScroll = () => {
      updatePosition()
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleScroll)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isOpen, updatePosition])

  const dropdown = (
    <div
      ref={dropdownRef}
      className="fixed z-[9999] rounded-xl bg-space-800 border border-space-600 shadow-[0_0_20px_rgba(0,240,255,0.05)] py-1"
      style={{
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        maxHeight: dropdownPos.maxHeight,
        overflowY: 'auto' as const,
      }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            onChange(option.value)
            setIsOpen(false)
          }}
          className={cn(
            'w-full text-left px-4 py-2.5 text-sm transition-colors',
            'hover:bg-cyan-neon/10 hover:text-cyan-neon',
            option.value === value
              ? 'text-cyan-neon bg-cyan-neon/5'
              : 'text-text-secondary'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block mb-1.5 text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggle}
          className={cn(
            'w-full rounded-xl border px-4 py-2.5 text-sm text-left',
            'transition-all duration-200',
            'focus:outline-none',
            'flex items-center justify-between gap-2',
            selectedOption
              ? 'bg-space-700/60 text-white border-space-600 hover:border-space-500 focus:border-cyan-neon focus:shadow-[0_0_12px_var(--color-cyan-glow)]'
              : 'bg-space-800 border-space-600 text-text-muted hover:border-space-500 focus:border-cyan-neon focus:shadow-[0_0_12px_var(--color-cyan-glow)]',
            error
              ? 'border-red-neon focus:border-red-neon focus:shadow-[0_0_12px_rgba(255,68,114,0.3)]'
              : '',
            isOpen && !error && 'border-cyan-neon shadow-[0_0_12px_var(--color-cyan-glow)]'
          )}
        >
          <span className={cn('truncate', !selectedOption && 'text-text-muted')}>
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 flex-shrink-0 transition-transform duration-200',
              isOpen ? 'text-cyan-neon rotate-180' : 'text-text-muted'
            )}
          />
        </button>
        {selectedOption && !isOpen && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-neon" />
        )}
      </div>
      {mounted && isOpen && createPortal(dropdown, document.body)}
      {error && <p className="mt-1 text-xs text-red-neon">{error}</p>}
    </div>
  )
}