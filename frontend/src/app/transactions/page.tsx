'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt,
  Gift,
  ShoppingCart,
  Zap,
  RotateCcw,
  Settings,
  TrendingUp,
  TrendingDown,
  Inbox,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useCreditStore } from '@/stores/creditStore'
import Skeleton from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'
import { formatCredits, formatDate, transactionTypeLabels } from '@/utils/format'
import type { CreditTransaction } from '@/types'

const FILTER_OPTIONS = [
  { key: 'all', label: '全部' },
  { key: 'initial', label: '赠送' },
  { key: 'purchase', label: '充值' },
  { key: 'consumption', label: '消耗' },
  { key: 'refund', label: '退款' },
  { key: 'manual', label: '手动调整' },
] as const

const typeIcons: Record<string, React.FC<{ className?: string }>> = {
  initial: Gift,
  purchase: ShoppingCart,
  consumption: Zap,
  refund: RotateCcw,
  manual: Settings,
}

const typeColors: Record<string, { bg: string; border: string; icon: string; dot: string }> = {
  initial: {
    bg: 'bg-green-neon/10',
    border: 'border-green-neon/20',
    icon: 'text-green-neon',
    dot: 'bg-green-neon',
  },
  purchase: {
    bg: 'bg-cyan-neon/10',
    border: 'border-cyan-neon/20',
    icon: 'text-cyan-neon',
    dot: 'bg-cyan-neon',
  },
  consumption: {
    bg: 'bg-red-neon/10',
    border: 'border-red-neon/20',
    icon: 'text-red-neon',
    dot: 'bg-red-neon',
  },
  refund: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    icon: 'text-yellow-400',
    dot: 'bg-yellow-400',
  },
  manual: {
    bg: 'bg-purple-neon/10',
    border: 'border-purple-neon/20',
    icon: 'text-purple-neon',
    dot: 'bg-purple-neon',
  },
}

function TransactionItem({ tx }: { tx: CreditTransaction }) {
  const colors = typeColors[tx.type] || typeColors.manual
  const Icon = typeIcons[tx.type] || Settings

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative flex gap-3 md:gap-4 pb-4 md:pb-6"
    >
      <div className="flex flex-col items-center">
        <div className={cn('p-2 rounded-xl border', colors.bg, colors.border)}>
          <Icon className={cn('w-4 h-4', colors.icon)} />
        </div>
        <div className="w-px flex-1 bg-space-600/50 mt-2 min-h-[20px]" />
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-white truncate">{tx.description}</p>
            <p className="text-xs text-text-muted mt-0.5">
              {transactionTypeLabels[tx.type] || tx.type}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p
              className={cn(
                'text-base md:text-lg font-bold',
                tx.amount > 0 ? 'text-green-neon' : 'text-red-neon'
              )}
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              {tx.amount > 0 ? '+' : ''}
              {formatCredits(tx.amount)}
            </p>
            <p className="text-xs text-text-muted">
              余额: {' '}
              <span style={{ fontFamily: 'var(--font-orbitron)' }}>
                {formatCredits(tx.balanceAfter)}
              </span>
            </p>
          </div>
        </div>
        <p className="text-[10px] text-text-muted mt-1">{formatDate(tx.createdAt)}</p>
      </div>
    </motion.div>
  )
}

export default function TransactionsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { transactions, fetchTransactions, loading } = useCreditStore()
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!user || !isAuthenticated) return
    fetchTransactions(user.id)
  }, [user, isAuthenticated, fetchTransactions])

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions
    return transactions.filter((tx) => tx.type === filter)
  }, [transactions, filter])

  const stats = useMemo(() => {
    const visible = filteredTransactions
    const totalIn = visible.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
    const totalOut = visible
      .filter((t) => t.amount < 0)
      .reduce((s, t) => s + Math.abs(t.amount), 0)
    return { totalIn, totalOut }
  }, [filteredTransactions])

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-0">
      <div className="max-w-3xl mx-auto px-3 md:px-4 py-4 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="p-2 rounded-xl bg-cyan-neon/10 border border-cyan-neon/20">
            <Receipt className="w-6 h-6 text-cyan-neon" />
          </div>
          <h1
            className="text-xl md:text-2xl font-bold text-cyan-neon glow-text-cyan"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            积分明细
          </h1>
        </motion.div>

        {transactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-6"
          >
            <div className="p-3 md:p-4 rounded-xl bg-space-800 border border-space-600/50">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-neon" />
                <span className="text-xs text-text-muted">累计收入</span>
              </div>
              <p
                className="text-lg md:text-xl font-bold text-green-neon"
                style={{ fontFamily: 'var(--font-orbitron)' }}
              >
                +{formatCredits(stats.totalIn)}
              </p>
            </div>
            <div className="p-3 md:p-4 rounded-xl bg-space-800 border border-space-600/50">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-neon" />
                <span className="text-xs text-text-muted">累计支出</span>
              </div>
              <p
                className="text-lg md:text-xl font-bold text-red-neon"
                style={{ fontFamily: 'var(--font-orbitron)' }}
              >
                -{formatCredits(stats.totalOut)}
              </p>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none"
        >
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={cn(
                'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                filter === opt.key
                  ? 'bg-cyan-neon/10 text-cyan-neon border border-cyan-neon/30'
                  : 'bg-space-800 text-text-secondary border border-space-600/50 hover:text-white hover:border-space-500'
              )}
            >
              {opt.label}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton variant="circular" width={36} height={36} />
                <div className="flex-1">
                  <Skeleton variant="text" width="70%" className="mb-2" />
                  <Skeleton variant="text" width="40%" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="p-6 rounded-full bg-space-700/50 mb-6">
              <Inbox className="w-12 h-12 text-text-muted" />
            </div>
            <p className="text-text-secondary text-lg">暂无积分记录</p>
          </motion.div>
        ) : (
          <div className="pl-1">
            <AnimatePresence mode="popLayout">
              {filteredTransactions.map((tx) => (
                <TransactionItem key={tx.id} tx={tx} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}