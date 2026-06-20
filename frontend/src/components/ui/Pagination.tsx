'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  loading?: boolean
  onPageChange: (page: number) => void
  itemName?: string
}

export default function Pagination({
  page,
  totalPages,
  total,
  loading,
  onPageChange,
  itemName = '条',
}: PaginationProps) {
  const [jumpPage, setJumpPage] = useState('')

  const handleJump = () => {
    const p = parseInt(jumpPage, 10)
    if (isNaN(p) || p < 1 || p > totalPages) return
    setJumpPage('')
    onPageChange(p)
  }

  return (
    <div className="flex items-center justify-between pt-4 border-t border-space-600/30">
      <span className="text-xs text-text-muted">
        共 {total} {itemName}，第 {page}/{totalPages} 页
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="p-2 rounded-lg bg-space-800 border border-space-600/40 text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span
          className="text-sm text-text-secondary px-2"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || loading}
          className="p-2 rounded-lg bg-space-800 border border-space-600/40 text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        {totalPages > 1 && (
          <>
            <span className="text-text-muted text-xs mx-1">|</span>
            <span className="text-xs text-text-muted">跳至</span>
            <input
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleJump()}
              placeholder="页码"
              className={cn(
                'w-14 px-2 py-1 rounded-lg bg-space-800 border border-space-600/40',
                'text-xs text-white text-center focus:outline-none focus:border-cyan-neon'
              )}
            />
            <button
              onClick={handleJump}
              className="px-2 py-1 rounded-lg bg-cyan-neon/10 border border-cyan-neon/30 text-cyan-neon text-xs hover:bg-cyan-neon/20 transition-colors"
            >
              GO
            </button>
          </>
        )}
      </div>
    </div>
  )
}
