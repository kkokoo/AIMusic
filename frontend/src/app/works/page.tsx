'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Disc,
  Music,
  Mic,
  Clock,
  Coins,
  Trash2,
  Play,
  Pause,
  X,
  AlertTriangle,
  Sparkles,
  Pencil,
  Check,
  Layers,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useTaskStore } from '@/stores/taskStore'
import { useDiscoveryStore } from '@/stores/discoveryStore'
import { useAudioStore } from '@/stores/audioStore'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Skeleton from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'
import { formatDuration, formatRelativeTime, formatCredits } from '@/utils/format'
import type { GenerationTask } from '@/types'

function WaveformVisualization({ mode }: { mode: 'instrumental' | 'song' | 'cover' }) {
  const bars = Array.from({ length: 16 }, () => Math.random() * 0.7 + 0.3)

  return (
    <div className="flex items-end justify-center gap-[2px] h-12 w-full">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className={cn(
            'w-[3px] rounded-t-sm',
            mode === 'instrumental'
              ? i % 3 === 0
                ? 'bg-purple-neon'
                : i % 3 === 1
                  ? 'bg-cyan-neon'
                  : 'bg-magenta-neon'
              : i % 3 === 0
                ? 'bg-cyan-neon'
                : i % 3 === 1
                  ? 'bg-green-neon'
                  : 'bg-purple-neon'
          )}
          initial={{ height: 4 }}
          animate={{ height: `${h * 48}px` }}
          transition={{
            duration: 0.6 + Math.random() * 0.4,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
            delay: i * 0.06,
          }}
        />
      ))}
    </div>
  )
}

const MODE_LABELS: Record<string, string> = {
  instrumental: '纯音乐',
  song: '歌曲',
  cover: '翻唱',
}

function getDisplayName(task: GenerationTask): string {
  return task.customName || '未命名'
}

function WorkCard({
  task,
  onDelete,
  onOpenDetail,
}: {
  task: GenerationTask
  onDelete: (task: GenerationTask) => void
  onOpenDetail: (task: GenerationTask) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const { play, currentUrl, isPlaying, pause, resume } = useAudioStore()
  const { renameTask } = useTaskStore()

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!task.audioUrl) return
    if (currentUrl === task.audioUrl && isPlaying) {
      pause()
    } else if (currentUrl === task.audioUrl) {
      resume()
    } else {
      useDiscoveryStore.getState().recordPlay(task.id)
      play(task.audioUrl, displayName)
    }
  }

  const handleStartRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditName(task.customName || '')
    setIsEditing(true)
  }

  const handleConfirmRename = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const name = editName.trim()
    if (name) {
      await renameTask(task.id, name)
    }
    setIsEditing(false)
  }

  const handleRenameKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.stopPropagation()
      const name = editName.trim()
      if (name) {
        await renameTask(task.id, name)
      }
      setIsEditing(false)
    } else if (e.key === 'Escape') {
      e.stopPropagation()
      setIsEditing(false)
    }
  }

  const displayName = getDisplayName(task)

  const isCurrentPlaying = currentUrl === task.audioUrl && isPlaying

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      onClick={() => onOpenDetail(task)}
      className={cn(
        'group relative rounded-xl md:rounded-2xl bg-space-800 border border-space-600/50 p-3 md:p-4 cursor-pointer',
        'transition-all duration-300',
        'hover:border-cyan-neon/40 hover:shadow-[0_0_20px_var(--color-cyan-glow)]'
      )}
    >
      <div className="mb-3 rounded-xl bg-space-700/50 p-3 overflow-hidden">
        <WaveformVisualization mode={task.mode} />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Badge variant={task.mode === 'instrumental' ? 'cyan' : task.mode === 'cover' ? 'red' : 'purple'} dot>
          {task.mode === 'instrumental' ? (
            <>
              <Music className="w-3 h-3" />
              <span>纯音乐</span>
            </>
          ) : task.mode === 'cover' ? (
            <>
              <Layers className="w-3 h-3" />
              <span>翻唱</span>
            </>
          ) : (
            <>
              <Mic className="w-3 h-3" />
              <span>歌曲</span>
            </>
          )}
        </Badge>
        {task.status === 'completed' && (
          <Badge variant="green" dot>
            已完成
          </Badge>
        )}
        {task.status === 'processing' && (
          <Badge variant="cyan" dot>
            生成中
          </Badge>
        )}
        {task.status === 'failed' && (
          <Badge variant="red" dot>
            失败
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1 mb-1 md:mb-2 min-w-0">
        {isEditing ? (
          <input
            className="text-xs md:text-sm font-medium bg-space-700 border border-cyan-neon/40 rounded-lg px-2 py-1 text-white outline-none flex-1 min-w-0"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            maxLength={200}
          />
        ) : (
          <h3 className="text-xs md:text-sm font-medium text-white truncate flex-1">
            {displayName}
          </h3>
        )}
        {isEditing ? (
          <button
            onClick={handleConfirmRename}
            className="p-1 rounded-md text-green-neon hover:bg-green-neon/10 shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleStartRename}
            className="p-1 rounded-md text-text-muted hover:text-cyan-neon hover:bg-space-700 opacity-0 group-hover:opacity-100 transition-all shrink-0"
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] md:text-xs text-text-muted">
        <span className="truncate max-w-[120px]">{task.modelName}</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(task.actualDurationSec || task.durationSec)}
          </span>
          <span className="flex items-center gap-1">
            <Coins className="w-3 h-3" />
            {formatCredits(task.costCredits)}
          </span>
        </div>
      </div>

      <div className="mt-1 md:mt-2 text-[10px] text-text-muted">
        {formatRelativeTime(task.createdAt)}
      </div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation()
          if (!confirmDelete) {
            setConfirmDelete(true)
            setTimeout(() => setConfirmDelete(false), 3000)
            return
          }
          onDelete(task)
          setConfirmDelete(false)
        }}
        className={cn(
          'absolute top-3 right-3 p-1.5 rounded-lg transition-all duration-200',
          'opacity-0 group-hover:opacity-100',
          confirmDelete
            ? 'bg-red-neon/20 text-red-neon opacity-100'
            : 'bg-space-700/80 text-text-muted hover:text-red-neon hover:bg-red-neon/10'
        )}
      >
        {confirmDelete ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </motion.button>

      {task.status === 'completed' && task.audioUrl && (
        <div
          className="absolute inset-0 rounded-2xl bg-cyan-neon/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none"
          onClick={handlePlay}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-12 h-12 rounded-full bg-cyan-neon/20 border border-cyan-neon/40 flex items-center justify-center pointer-events-auto"
            onClick={(e) => { e.stopPropagation(); handlePlay(e) }}
          >
            {isCurrentPlaying ? (
              <Pause className="w-5 h-5 text-cyan-neon" />
            ) : (
              <Play className="w-5 h-5 text-cyan-neon ml-0.5" />
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

function DetailModal({
  task,
  isOpen,
  onClose,
  onDelete,
}: {
  task: GenerationTask | null
  isOpen: boolean
  onClose: () => void
  onDelete: (task: GenerationTask) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const { play, pause, resume, currentUrl, isPlaying, stop } = useAudioStore()
  const { renameTask } = useTaskStore()

  if (!task) return null

  const displayName = getDisplayName(task)

  const handlePlay = () => {
    if (!task.audioUrl) return
    if (currentUrl === task.audioUrl && isPlaying) {
      pause()
    } else if (currentUrl === task.audioUrl) {
      resume()
    } else {
      useDiscoveryStore.getState().recordPlay(task.id)
      play(task.audioUrl, displayName)
    }
  }

  const handleClose = () => {
    stop()
    onClose()
  }

  const handleStartRename = () => {
    setEditName(task.customName || '')
    setIsEditing(true)
  }

  const handleConfirmRename = async () => {
    const name = editName.trim()
    if (name) {
      await renameTask(task.id, name)
    }
    setIsEditing(false)
  }

  const handleRenameKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const name = editName.trim()
      if (name) {
        await renameTask(task.id, name)
      }
      setIsEditing(false)
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  const isCurrentPlaying = currentUrl === task.audioUrl && isPlaying

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    onDelete(task)
    onClose()
    setConfirmDelete(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={displayName} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <input
                className="text-sm font-medium bg-space-700 border border-cyan-neon/40 rounded-lg px-3 py-1.5 text-white outline-none flex-1"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                autoFocus
                maxLength={200}
              />
              <button
                onClick={handleConfirmRename}
                className="p-1.5 rounded-lg text-green-neon hover:bg-green-neon/10"
              >
                <Check className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={handleStartRename}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-text-muted hover:text-cyan-neon hover:bg-space-700 transition-colors"
            >
              <Pencil className="w-3 h-3" />
              重命名
            </button>
          )}
        </div>
        <div className="rounded-xl bg-space-700/50 p-6">
          <WaveformVisualization mode={task.mode} />
        </div>

        {task.audioUrl && task.status === 'completed' && (
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handlePlay}
            >
              {isCurrentPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  暂停
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  播放
                </>
              )}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-space-700/50">
            <p className="text-xs text-text-muted mb-1">模型</p>
            <p className="text-sm text-white font-medium">{task.modelName}</p>
          </div>
          <div className="p-3 rounded-xl bg-space-700/50">
            <p className="text-xs text-text-muted mb-1">模式</p>
            <p className="text-sm text-white font-medium">
              {task.mode === 'instrumental' ? '纯音乐' : task.mode === 'cover' ? '翻唱' : '歌曲'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-space-700/50">
            <p className="text-xs text-text-muted mb-1">时长</p>
            <p className="text-sm text-white font-medium">
              {formatDuration(task.actualDurationSec || task.durationSec)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-space-700/50">
            <p className="text-xs text-text-muted mb-1">消耗积分</p>
            <p
              className="text-sm font-medium"
              style={{ fontFamily: 'var(--font-orbitron)', color: 'var(--color-cyan-neon)' }}
            >
              {formatCredits(task.costCredits)}
            </p>
          </div>
        </div>

        {task.lyrics && (
          <div className="p-3 rounded-xl bg-space-700/50">
            <p className="text-xs text-text-muted mb-2">歌词</p>
            <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-space-600 scrollbar-track-transparent pr-1">
              <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                {task.lyrics}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-space-600">
        <p className="text-xs text-text-muted">
          创建于 {formatRelativeTime(task.createdAt)}
        </p>
        <Button
          variant={confirmDelete ? 'danger' : 'ghost'}
          size="sm"
          onClick={handleDelete}
        >
          <Trash2 className="w-4 h-4" />
          {confirmDelete ? '确认删除' : '删除'}
        </Button>
      </div>
    </Modal>
  )
}

export default function WorksPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { tasks, fetchHistory, deleteTask } = useTaskStore()
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [detailTask, setDetailTask] = useState<GenerationTask | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!user || !isAuthenticated) return
    const load = async () => {
      setLoading(true)
      const result = await fetchHistory(user.id, 1)
      setPage(1)
      setHasMore(result ? 1 < result.totalPages : false)
      setLoading(false)
    }
    load()
  }, [user, isAuthenticated, fetchHistory])

  const handleLoadMore = useCallback(async () => {
    if (!user || !hasMore) return
    const nextPage = page + 1
    const result = await fetchHistory(user.id, nextPage)
    setPage(nextPage)
    if (result) {
      setHasMore(nextPage < result.totalPages)
    }
  }, [user, hasMore, page, fetchHistory])

  const handleDelete = useCallback(
    async (task: GenerationTask) => {
      await deleteTask(task.id)
    },
    [deleteTask]
  )

  const handleOpenDetail = useCallback((task: GenerationTask) => {
    setDetailTask(task)
    setDetailOpen(true)
  }, [])

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-0">
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="p-2 rounded-xl bg-cyan-neon/10 border border-cyan-neon/20">
            <Disc className="w-6 h-6 text-cyan-neon" />
          </div>
          <h1
            className="text-xl md:text-2xl font-bold text-cyan-neon glow-text-cyan"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            我的作品
          </h1>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-2xl bg-space-800 border border-space-600/50 p-4">
                <Skeleton variant="rectangular" height={72} className="mb-3" />
                <Skeleton variant="text" width="60%" className="mb-2" />
                <Skeleton variant="text" width="80%" className="mb-2" />
                <Skeleton variant="text" width="40%" />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="p-6 rounded-full bg-space-700/50 mb-6">
              <Sparkles className="w-12 h-12 text-text-muted" />
            </div>
            <p className="text-text-secondary text-lg mb-4">还没有作品，去创作吧</p>
            <Link href="/create">
              <Button variant="primary" size="lg">
                <Music className="w-5 h-5" />
                开始创作
              </Button>
            </Link>
          </motion.div>
        ) : (
          <>
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
            >
              <AnimatePresence mode="popLayout">
                {tasks.map((task) => (
                  <WorkCard
                    key={task.id}
                    task={task}
                    onDelete={handleDelete}
                    onOpenDetail={handleOpenDetail}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            <div className="flex justify-center mt-8">
              <Button
                variant="secondary"
                size="lg"
                onClick={handleLoadMore}
                disabled={!hasMore}
              >
                加载更多
              </Button>
            </div>
          </>
        )}

        <DetailModal
          task={detailTask}
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}