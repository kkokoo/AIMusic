'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Trophy,
  Crown,
  Medal,
  Award,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Music,
  Calendar,
  Coins,
  User,
} from 'lucide-react'
import apiClient from '@/lib/axios'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'
import type { RankingItem } from '@/types'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function shiftYearMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getRankStyle(rank: number): {
  bg: string
  text: string
  border: string
  icon: typeof Crown
  label: string
  glow: string
} {
  if (rank === 1) {
    return {
      bg: 'bg-gradient-to-br from-yellow-500/20 to-amber-600/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/40',
      icon: Crown,
      label: '冠军',
      glow: 'shadow-[0_0_24px_rgba(250,204,21,0.25)]',
    }
  }
  if (rank === 2) {
    return {
      bg: 'bg-gradient-to-br from-gray-300/20 to-gray-500/10',
      text: 'text-gray-300',
      border: 'border-gray-400/40',
      icon: Medal,
      label: '亚军',
      glow: 'shadow-[0_0_20px_rgba(203,213,225,0.2)]',
    }
  }
  if (rank === 3) {
    return {
      bg: 'bg-gradient-to-br from-orange-500/20 to-amber-700/10',
      text: 'text-orange-400',
      border: 'border-orange-500/40',
      icon: Award,
      label: '季军',
      glow: 'shadow-[0_0_20px_rgba(251,146,60,0.2)]',
    }
  }
  return {
    bg: 'bg-space-800/60',
    text: 'text-text-secondary',
    border: 'border-space-600/40',
    icon: Trophy,
    label: '',
    glow: '',
  }
}

function TopPodiumCard({ item }: { item: RankingItem }) {
  const style = getRankStyle(item.rank)
  const Icon = style.icon
  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        'relative rounded-2xl border p-5 flex flex-col items-center text-center',
        style.bg,
        style.border,
        style.glow,
        item.rank === 1 && 'lg:scale-105 lg:-translate-y-2'
      )}
    >
      <div
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center mb-3',
          style.bg,
          style.border,
          'border-2'
        )}
      >
        <Icon className={cn('w-7 h-7', style.text)} />
      </div>
      <div
        className={cn(
          'text-2xl font-bold mb-1',
          style.text
        )}
        style={{ fontFamily: 'var(--font-orbitron)' }}
      >
        #{item.rank}
      </div>
      <p className="text-sm font-medium text-white mb-1 truncate max-w-full">
        {item.userNickname}
      </p>
      <p className="text-[10px] text-text-muted mb-3">{style.label}</p>
      <div className="flex items-center gap-1.5">
        <Music className={cn('w-3.5 h-3.5', style.text)} />
        <span
          className="text-lg font-bold"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          {item.meaningfulSongsCount}
        </span>
        <span className="text-[10px] text-text-muted">首</span>
      </div>
      {item.rewardCredits > 0 && (
        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-neon/10 border border-cyan-neon/20">
          <Coins className="w-3 h-3 text-cyan-neon" />
          <span className="text-[10px] text-cyan-neon font-mono">
            奖励 {item.rewardCredits}
          </span>
        </div>
      )}
    </motion.div>
  )
}

function RankingRow({ item }: { item: RankingItem }) {
  const style = getRankStyle(item.rank)
  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border transition-all',
        style.bg,
        style.border
      )}
    >
      <div
        className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0',
          style.bg,
          style.text
        )}
        style={{ fontFamily: 'var(--font-orbitron)' }}
      >
        {item.rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white font-medium truncate">
            {item.userNickname}
          </span>
          {item.rewardType === 'top3' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              TOP3
            </span>
          )}
          {item.rewardType === 'top10' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-neon/10 text-cyan-neon border border-cyan-neon/20">
              TOP10
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-text-muted">
          <span className="flex items-center gap-1">
            <Music className="w-3 h-3" />
            {item.meaningfulSongsCount} 首有意义歌曲
          </span>
          {item.rewardCredits > 0 && (
            <span className="flex items-center gap-1">
              <Coins className="w-3 h-3" />
              奖励 {item.rewardCredits} 积分
            </span>
          )}
        </div>
      </div>
      {item.rewardDistributed && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-neon/10 text-green-neon border border-green-neon/20">
          已发放
        </span>
      )}
    </motion.div>
  )
}

export default function RankingsPage() {
  const toast = useUIStore((s) => s.toast)
  const [yearMonth, setYearMonth] = useState(currentYearMonth())
  const [items, setItems] = useState<RankingItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const loadRanking = useCallback(async (ym: string, p: number) => {
    setLoading(true)
    try {
      const res = await apiClient.get('/rankings/monthly', {
        params: { year_month: ym, page: p, page_size: 20 },
      })
      const data = (res.data as { data: { items: RankingItem[]; total: number; totalPages: number } }).data
      setItems(data?.items || [])
      setTotal(data?.total || 0)
      setTotalPages(data?.totalPages || 1)
      setPage(p)
    } catch (err: unknown) {
      const e = err as { error?: string; message?: string }
      toast('error', e?.error || e?.message || '加载排行榜失败')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadRanking(yearMonth, 1)
  }, [yearMonth, loadRanking])

  const top3 = items.filter((i) => i.rank <= 3)
  const restItems = items.filter((i) => i.rank > 3)

  const handlePrevMonth = () => {
    setYearMonth(shiftYearMonth(yearMonth, -1))
  }
  const handleNextMonth = () => {
    const next = shiftYearMonth(yearMonth, 1)
    if (next > currentYearMonth()) {
      toast('warning', '已经是最新月份了')
      return
    }
    setYearMonth(next)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1
          className="text-xl md:text-2xl font-bold text-cyan-neon glow-text-cyan"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          CREATOR MONTHLY RANKING
        </h1>
        <p className="text-xs text-text-muted mt-1">
          创作者月度热度榜 · 当月播放量≥10次的歌曲计入"有意义歌曲"
        </p>
      </motion.div>

      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-space-800/80 border border-space-600/40">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-lg bg-space-700 text-text-muted hover:text-white hover:bg-space-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-neon" />
          <span
            className="text-base font-semibold text-white"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            {yearMonth}
          </span>
          {yearMonth === currentYearMonth() && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-neon/10 text-cyan-neon border border-cyan-neon/20">
              本月
            </span>
          )}
        </div>
        <button
          onClick={handleNextMonth}
          disabled={yearMonth >= currentYearMonth()}
          className="p-2 rounded-lg bg-space-700 text-text-muted hover:text-white hover:bg-space-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-cyan-neon animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-space-800 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-muted text-sm">
            {yearMonth === currentYearMonth()
              ? '本月暂无排行榜数据，多听多创作吧~'
              : `${yearMonth} 暂无排行榜数据`}
          </p>
          <p className="text-text-muted text-xs mt-2">
            有意义歌曲：当月播放量≥10次且状态正常的已发布歌曲
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {top3.map((item) => (
                <TopPodiumCard key={item.userId} item={item} />
              ))}
            </div>
          )}

          {restItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-neon" />
                  完整榜单
                </h2>
                <span className="text-xs text-text-muted">共 {total} 位创作者</span>
              </div>
              {restItems.map((item) => (
                <RankingRow key={item.userId} item={item} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => loadRanking(yearMonth, page - 1)}
                disabled={page <= 1 || loading}
                className="p-2 rounded-lg bg-space-800 border border-space-600/40 text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-text-secondary px-2" style={{ fontFamily: 'var(--font-orbitron)' }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => loadRanking(yearMonth, page + 1)}
                disabled={page >= totalPages || loading}
                className="p-2 rounded-lg bg-space-800 border border-space-600/40 text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      )}

      <div className="p-4 rounded-xl bg-space-800/50 border border-space-600/30">
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Coins className="w-4 h-4 text-cyan-neon" />
          奖励规则
        </h3>
        <ul className="space-y-1.5 text-xs text-text-muted">
          <li className="flex items-start gap-2">
            <Crown className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
            <span>第一名（冠军）：奖励 <span className="text-yellow-400 font-mono">500</span> 积分</span>
          </li>
          <li className="flex items-start gap-2">
            <Medal className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
            <span>第二名（亚军）：奖励 <span className="text-gray-300 font-mono">300</span> 积分</span>
          </li>
          <li className="flex items-start gap-2">
            <Award className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
            <span>第三名（季军）：奖励 <span className="text-orange-400 font-mono">200</span> 积分</span>
          </li>
          <li className="flex items-start gap-2">
            <Trophy className="w-3.5 h-3.5 text-cyan-neon mt-0.5 shrink-0" />
            <span>第4-10名：奖励 <span className="text-cyan-neon font-mono">100</span> 积分</span>
          </li>
          <li className="text-text-muted/70 pt-1">
            * 奖励在每月结束后由管理员发放，同一月份不会重复发放
          </li>
        </ul>
      </div>
    </div>
  )
}
