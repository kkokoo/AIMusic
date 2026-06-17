'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Music as MusicIcon,
  Search,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  MessageSquare,
  Play,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import Modal from '@/components/ui/Modal'
import { useUIStore } from '@/stores/uiStore'
import { useAudioStore } from '@/stores/audioStore'
import apiClient from '@/lib/axios'
import { formatDate, formatDuration, taskStatusLabels } from '@/utils/format'
import type { AdminSong } from '@/types'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const MODE_LABELS: Record<string, string> = {
  instrumental: '纯音乐',
  song: '歌曲',
  cover: '翻唱',
}

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'completed', label: '已完成' },
  { value: 'processing', label: '生成中' },
  { value: 'pending', label: '等待中' },
  { value: 'failed', label: '失败' },
]

const statusBadgeVariant: Record<string, 'cyan' | 'purple' | 'green' | 'red' | 'gray'> = {
  completed: 'green',
  processing: 'purple',
  pending: 'gray',
  failed: 'red',
}

export default function AdminSongsPage() {
  const toast = useUIStore((s) => s.toast)
  const { play, isPlaying, currentUrl, pause, resume } = useAudioStore()

  const [songs, setSongs] = useState<AdminSong[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [includeDeleted, setIncludeDeleted] = useState(false)

  const [renameTarget, setRenameTarget] = useState<AdminSong | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminSong | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [jumpPage, setJumpPage] = useState('')

  const handleJumpPage = () => {
    const p = parseInt(jumpPage, 10)
    if (isNaN(p) || p < 1 || p > totalPages) {
      toast('warning', `请输入 1~${totalPages} 的页码`)
      return
    }
    setJumpPage('')
    loadSongs(p)
  }

  const loadSongs = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await apiClient.get('/admin/songs', {
        params: {
          page: p,
          page_size: 10,
          keyword: keyword || undefined,
          status: statusFilter || undefined,
          include_deleted: includeDeleted,
        },
      })
      const data = (res.data as { data: { items: AdminSong[]; total: number; totalPages: number } }).data
      setSongs(data?.items || [])
      setTotal(data?.total || 0)
      setTotalPages(data?.totalPages || 1)
      setPage(p)
    } catch (err: unknown) {
      const e = err as { error?: string; message?: string }
      toast('error', e?.error || e?.message || '加载歌曲列表失败')
    } finally {
      setLoading(false)
    }
  }, [keyword, statusFilter, includeDeleted, toast])

  useEffect(() => {
    loadSongs(1)
  }, [loadSongs])

  const openRename = (song: AdminSong) => {
    setRenameTarget(song)
    setRenameValue(song.customName || '')
  }

  const handleRename = async () => {
    if (!renameTarget) return
    const name = renameValue.trim()
    if (!name || name.length > 200) {
      toast('warning', '名称不能为空且不超过200个字符')
      return
    }
    setRenaming(true)
    try {
      await apiClient.patch(`/admin/songs/${renameTarget.id}/rename`, { custom_name: name })
      toast('success', '改名成功')
      setRenameTarget(null)
      await loadSongs(page)
    } catch (err: unknown) {
      const e = err as { error?: string; message?: string }
      toast('error', e?.error || e?.message || '改名失败')
    } finally {
      setRenaming(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await apiClient.delete(`/admin/songs/${deleteTarget.id}`)
      toast('success', '删除成功')
      setDeleteTarget(null)
      await loadSongs(page)
    } catch (err: unknown) {
      const e = err as { error?: string; message?: string }
      toast('error', e?.error || e?.message || '删除失败')
    } finally {
      setDeleting(false)
    }
  }

  const handlePlay = (song: AdminSong) => {
    if (!song.audioUrl) return
    if (currentUrl === song.audioUrl && isPlaying) {
      pause()
    } else if (currentUrl === song.audioUrl) {
      resume()
    } else {
      play(song.audioUrl, song.customName || `歌曲#${song.id}`)
    }
  }

  if (loading && songs.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton width={160} height={32} />
        <Skeleton variant="rectangular" height={400} />
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-neon/10 flex items-center justify-center">
          <MusicIcon className="w-5 h-5 text-cyan-neon" />
        </div>
        <h1 className="text-2xl font-bold text-white">歌曲管理</h1>
        <span className="text-sm text-text-muted">共 {total} 首</span>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadSongs(1)}
                placeholder="搜索歌曲名称、提示词、风格、歌词..."
                className="w-full rounded-lg bg-space-700 border border-space-600 pl-9 pr-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-cyan-neon"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg bg-space-700 border border-space-600 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-neon"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
                className="accent-cyan-neon"
              />
              含已删除
            </label>
            <Button variant="ghost" size="sm" onClick={() => loadSongs(1)}>
              <Search className="w-4 h-4" />
              搜索
            </Button>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted border-b border-space-600/50">
                  <th className="text-left py-3 font-medium">ID</th>
                  <th className="text-left py-3 font-medium">歌曲名称</th>
                  <th className="text-left py-3 font-medium">创作者</th>
                  <th className="text-left py-3 font-medium">模型</th>
                  <th className="text-center py-3 font-medium">模式</th>
                  <th className="text-center py-3 font-medium">状态</th>
                  <th className="text-right py-3 font-medium px-3">播放</th>
                  <th className="text-right py-3 font-medium px-3">评论</th>
                  <th className="text-left py-3 font-medium pl-4">创建时间</th>
                  <th className="text-center py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {songs.map((song) => (
                  <tr
                    key={song.id}
                    className="border-b border-space-600/20 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 text-text-muted font-mono text-xs">#{song.id}</td>
                    <td className="py-3 text-white font-medium max-w-[200px] truncate">
                      {song.customName || '未命名'}
                      {song.isDeleted && (
                        <span className="ml-1 text-[10px] text-red-neon">已删除</span>
                      )}
                    </td>
                    <td className="py-3 text-text-secondary">{song.creatorName}</td>
                    <td className="py-3 text-text-secondary text-xs">{song.modelName}</td>
                    <td className="py-3 text-center">
                      <Badge variant={song.mode === 'song' ? 'purple' : 'cyan'}>
                        {MODE_LABELS[song.mode] || song.mode}
                      </Badge>
                    </td>
                    <td className="py-3 text-center">
                      <Badge variant={statusBadgeVariant[song.status] || 'gray'} dot>
                        {taskStatusLabels[song.status] || song.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-text-muted font-mono text-xs px-3">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {song.playCount}
                      </span>
                    </td>
                    <td className="py-3 text-right text-text-muted font-mono text-xs px-3">
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {song.commentCount}
                      </span>
                    </td>
                    <td className="py-3 text-text-muted text-xs whitespace-nowrap pl-4">
                      {formatDate(song.createdAt)}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {song.audioUrl && song.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePlay(song)}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openRename(song)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {!song.isDeleted && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(song)}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {songs.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-text-muted">
                      暂无歌曲数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {songs.length === 0 && (
              <div className="py-12 text-center text-text-muted">暂无歌曲数据</div>
            )}
            {songs.map((song) => (
              <div
                key={song.id}
                className="p-3 rounded-lg bg-white/[0.02] border border-space-600/20 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-text-muted font-mono text-xs">#{song.id}</span>
                  <Badge variant={statusBadgeVariant[song.status] || 'gray'} dot>
                    {taskStatusLabels[song.status] || song.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white font-medium truncate">
                    {song.customName || '未命名'}
                  </span>
                  <Badge variant={song.mode === 'song' ? 'purple' : 'cyan'}>
                    {MODE_LABELS[song.mode] || song.mode}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{song.creatorName}</span>
                  <span className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {song.playCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {song.commentCount}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1 pt-1">
                  {song.audioUrl && song.status === 'completed' && (
                    <Button variant="ghost" size="sm" onClick={() => handlePlay(song)}>
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => openRename(song)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {!song.isDeleted && (
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(song)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-space-600/30">
            <span className="text-xs text-text-muted">
              共 {total} 首，第 {page}/{totalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadSongs(page - 1)}
                disabled={page <= 1 || loading}
                className="p-2 rounded-lg bg-space-800 border border-space-600/40 text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-text-secondary px-2" style={{ fontFamily: 'var(--font-orbitron)' }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => loadSongs(page + 1)}
                disabled={page >= totalPages || loading}
                className="p-2 rounded-lg bg-space-800 border border-space-600/40 text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-text-muted text-xs mx-1">|</span>
              <span className="text-xs text-text-muted">跳至</span>
              <input
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleJumpPage()}
                placeholder="页码"
                className="w-14 px-2 py-1 rounded-lg bg-space-800 border border-space-600/40 text-xs text-white text-center focus:outline-none focus:border-cyan-neon"
              />
              <button
                onClick={handleJumpPage}
                className="px-2 py-1 rounded-lg bg-cyan-neon/10 border border-cyan-neon/30 text-cyan-neon text-xs hover:bg-cyan-neon/20 transition-colors"
              >
                GO
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      <Modal
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title={`修改歌曲名称 - #${renameTarget?.id ?? ''}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-1.5 text-sm text-text-muted">当前名称</label>
            <p className="text-sm text-text-secondary">
              {renameTarget?.customName || '未命名'}
            </p>
          </div>
          <div>
            <label className="block mb-1.5 text-sm text-text-muted">新名称</label>
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              maxLength={200}
              className="w-full px-3 py-2 rounded-lg bg-space-700 border border-space-600 text-white text-sm focus:outline-none focus:border-cyan-neon"
              placeholder="输入新的歌曲名称"
            />
            <p className="text-xs text-text-muted mt-1">{renameValue.length}/200</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setRenameTarget(null)}>
              取消
            </Button>
            <Button onClick={handleRename} loading={renaming}>
              确认修改
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="删除歌曲"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            确定要删除歌曲 <span className="text-white font-medium">「{deleteTarget?.customName || '未命名'}」</span> 吗？
          </p>
          <p className="text-xs text-text-muted">删除后将不再展示，相关评论也会一并隐藏。</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              确认删除
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
