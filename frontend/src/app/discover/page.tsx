'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Trophy,
  Sparkles,
  Play,
  Pause,
  Clock,
  Music,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Disc3,
  X,
} from 'lucide-react'
import { useDiscoveryStore, type DiscoveryItem } from '@/stores/discoveryStore'
import { useAudioStore } from '@/stores/audioStore'
import { useAuthStore } from '@/stores/authStore'
import Modal from '@/components/ui/Modal'
import { formatDuration } from '@/utils/format'
import { cn } from '@/utils/cn'

const TABS = [
  { key: 'leaderboard', label: '热度榜单', icon: Trophy },
  { key: 'recommendations', label: '为你推荐', icon: Sparkles },
  { key: 'search', label: '搜索', icon: Search },
]

function MusicCard({
  item,
  rank,
  onPlay,
  onClick,
  isPlaying,
  currentUrl,
}: {
  item: DiscoveryItem
  rank?: number
  onPlay: () => void
  onClick: () => void
  isPlaying: boolean
  currentUrl: string | null
}) {
  const isCurrent = currentUrl === item.audioUrl

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl bg-space-800/80 border transition-all cursor-pointer',
        isCurrent
          ? 'border-cyan-neon/30 bg-cyan-neon/5'
          : 'border-space-600/40 hover:border-space-500/60 hover:bg-space-800',
      )}
    >
      {rank !== undefined && (
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0',
            rank === 1
              ? 'bg-yellow-500/20 text-yellow-400'
              : rank === 2
                ? 'bg-gray-400/20 text-gray-300'
                : rank === 3
                  ? 'bg-orange-400/20 text-orange-400'
                  : 'bg-space-700 text-text-muted',
          )}
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          {rank}
        </div>
      )}

      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
          isCurrent
            ? 'gradient-cyan-purple'
            : 'bg-space-700',
        )}
      >
        <Music className="w-5 h-5 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate font-medium">
          {getDisplayName(item)}
        </p>
        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-text-muted">
          <span className="flex items-center gap-1">
            <Disc3 className="w-3 h-3" />
            {item.modelName}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(item.durationSec)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1 text-[10px] text-text-muted">
          <Eye className="w-3 h-3" />
          <span style={{ fontFamily: 'var(--font-orbitron)' }}>
            {item.playCount}
          </span>
        </div>
        <button
          onClick={onPlay}
          disabled={!item.audioUrl}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center transition-all',
            'hover:scale-105 active:scale-95',
            isCurrent && isPlaying
              ? 'gradient-cyan-purple text-white'
              : 'bg-cyan-neon/20 text-cyan-neon hover:bg-cyan-neon/30',
          )}
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>
      </div>
    </motion.div>
  )
}

function SearchBar({
  value,
  onChange,
  onSearch,
  loading,
}: {
  value: string
  onChange: (v: string) => void
  onSearch: () => void
  loading: boolean
}) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        placeholder="搜索音乐名称、风格..."
        className="w-full rounded-xl bg-space-800 border border-space-600 pl-11 pr-4 py-3 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-cyan-neon focus:shadow-[0_0_12px_var(--color-cyan-glow)] transition-all"
      />
      {loading && (
        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-neon animate-spin" />
      )}
    </div>
  )
}

function getDisplayName(item: DiscoveryItem): string {
  return item.customName || '未命名'
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-space-800/80 border border-space-600/40 animate-pulse">
          <div className="w-8 h-8 rounded-lg bg-space-700 shrink-0" />
          <div className="w-10 h-10 rounded-lg bg-space-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-space-700 rounded w-3/4" />
            <div className="h-3 bg-space-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DiscoveryPage() {
  const [activeTab, setActiveTab] = useState('leaderboard')
  const [searchInput, setSearchInput] = useState('')
  const [detailItem, setDetailItem] = useState<DiscoveryItem | null>(null)
  const { isAuthenticated } = useAuthStore()

  const {
    leaderboard, leaderboardTotal, leaderboardPage, leaderboardLoading,
    recommendations, recommendationsLoading,
    searchResults, searchTotal, searchQuery, searchPage, searchLoading,
    fetchLeaderboard, fetchRecommendations, search, recordPlay,
  } = useDiscoveryStore()

  const { play, pause, resume, isPlaying, currentUrl, playPlaylist } = useAudioStore()

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard(1)
    } else if (activeTab === 'recommendations') {
      fetchRecommendations()
    }
  }, [activeTab])

  const currentList = activeTab === 'leaderboard'
    ? leaderboard
    : activeTab === 'recommendations'
      ? recommendations
      : searchResults

  const currentLoading = activeTab === 'leaderboard' ? leaderboardLoading
    : activeTab === 'recommendations' ? recommendationsLoading
      : searchLoading

  const totalPages = activeTab === 'leaderboard'
    ? Math.ceil(leaderboardTotal / 20)
    : Math.ceil(searchTotal / 20)

  const currentPage = activeTab === 'leaderboard' ? leaderboardPage : searchPage

  const handlePlay = useCallback(
    (item: DiscoveryItem, idx: number) => {
      if (!item.audioUrl) return
      if (currentUrl === item.audioUrl && isPlaying) {
        pause()
      } else if (currentUrl === item.audioUrl) {
        resume()
      } else {
        recordPlay(item.id)
        const songs = currentList
          .filter((i) => i.audioUrl)
          .map((i) => ({
            url: i.audioUrl!,
            name: getDisplayName(i),
          }))
        playPlaylist(songs, idx)
      }
    },
    [currentUrl, isPlaying, playPlaylist, pause, resume, currentList],
  )

  const handleSearch = () => {
    if (searchInput.trim()) {
      search(searchInput.trim(), 1)
      setActiveTab('search')
    }
  }

  const pageTitle = activeTab === 'leaderboard' ? '热度榜单'
    : activeTab === 'recommendations' ? '为你推荐'
      : searchQuery ? `搜索: ${searchQuery}` : '搜索'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1
          className="text-xl md:text-2xl font-bold text-cyan-neon glow-text-cyan"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          AI MUSIC DISCOVERY
        </h1>
        <p className="text-xs text-text-muted mt-1">探索 AI 音乐世界，发现你的下一个挚爱</p>
      </motion.div>

      <div className="flex items-center gap-2 p-1 rounded-xl bg-space-800/80 border border-space-600/40">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-cyan-neon/10 text-cyan-neon'
                  : 'text-text-muted hover:text-white',
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden xs:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {activeTab === 'search' && (
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSearch={handleSearch}
          loading={searchLoading}
        />
      )}

      {activeTab === 'recommendations' && !isAuthenticated && (
        <div className="p-6 rounded-xl bg-space-800/80 border border-space-600/40 text-center">
          <p className="text-text-muted text-sm">登录后开启个性化推荐</p>
        </div>
      )}

      {currentLoading ? (
        <LoadingSkeleton />
      ) : currentList.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-space-800 flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-muted text-sm">
            {activeTab === 'search' && searchQuery
              ? `未找到与"${searchQuery}"相关的音乐`
              : activeTab === 'recommendations'
                ? '暂无推荐，先去听一些音乐吧'
                : '暂无播放数据'}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-muted">
              {activeTab === 'leaderboard' && `${leaderboardTotal} 首音乐`}
              {activeTab === 'recommendations' && `${recommendations.length} 首推荐`}
              {activeTab === 'search' && `${searchTotal} 个结果`}
            </p>
            {activeTab !== 'recommendations' && (
              <h2 className="text-base font-semibold text-white">{pageTitle}</h2>
            )}
          </div>

          <div className="space-y-2">
            {currentList.map((item, idx) => (
              <MusicCard
                key={item.id}
                item={item}
                rank={activeTab === 'leaderboard' ? leaderboardPage * 20 - 20 + idx + 1 : undefined}
                onPlay={() => handlePlay(item, idx)}
                onClick={() => setDetailItem(item)}
                isPlaying={isPlaying}
                currentUrl={currentUrl}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => {
                  if (activeTab === 'leaderboard') fetchLeaderboard(currentPage - 1)
                  else search(searchQuery, currentPage - 1)
                }}
                disabled={currentPage <= 1}
                className="p-2 rounded-lg bg-space-800 border border-space-600/40 text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-text-secondary px-2" style={{ fontFamily: 'var(--font-orbitron)' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => {
                  if (activeTab === 'leaderboard') fetchLeaderboard(currentPage + 1)
                  else search(searchQuery, currentPage + 1)
                }}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-lg bg-space-800 border border-space-600/40 text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} size="md">
        {detailItem && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">
                {getDisplayName(detailItem)}
              </h2>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span>
                  <Disc3 className="w-3 h-3" />
                  {detailItem.modelName}
                </span>
                <span>
                  <Clock className="w-3 h-3" />
                  {formatDuration(detailItem.durationSec)}
                </span>
                <span>
                  <Eye className="w-3 h-3" />
                  {detailItem.playCount}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-space-700/50">
              {detailItem.lyrics && detailItem.lyrics.trim() ? (
                <div>
                  <p className="text-xs text-text-muted mb-2">歌词</p>
                  <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-space-600 scrollbar-track-transparent pr-1">
                    <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                      {detailItem.lyrics}
                    </p>
                  </div>
                </div>
              ) : detailItem.mode === 'instrumental' ? (
                <p className="text-sm text-text-muted">纯音乐，暂无歌词</p>
              ) : (
                <p className="text-sm text-text-muted">暂无歌词</p>
              )}
            </div>

            {detailItem.prompt && (
              <div className="p-3 rounded-xl bg-space-700/50">
                <p className="text-xs text-text-muted mb-1">描述</p>
                <p className="text-sm text-text-secondary">{detailItem.prompt}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}