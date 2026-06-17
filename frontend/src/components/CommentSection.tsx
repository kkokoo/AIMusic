'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Trash2,
  Send,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import apiClient from '@/lib/axios'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { formatRelativeTime } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { Comment } from '@/types'

const MIN_LEN = 10
const MAX_LEN = 200

interface CommentSectionProps {
  taskId: number
}

export default function CommentSection({ taskId }: CommentSectionProps) {
  const { isAuthenticated, user } = useAuthStore()
  const toast = useUIStore((s) => s.toast)

  const [comments, setComments] = useState<Comment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  const loadComments = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await apiClient.get(`/comments/task/${taskId}`, {
        params: { page: p, page_size: pageSize },
      })
      const data = (res.data as { data: { items: Comment[]; total: number; totalPages: number } }).data
      setComments(data?.items || [])
      setTotal(data?.total || 0)
      setTotalPages(data?.totalPages || 1)
      setPage(p)
    } catch (err: unknown) {
      const e = err as { error?: string; message?: string }
      toast('error', e?.error || e?.message || '加载评论失败')
    } finally {
      setLoading(false)
    }
  }, [taskId, pageSize, toast])

  useEffect(() => {
    loadComments(1)
  }, [loadComments])

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast('warning', '请先登录后再发表评论')
      return
    }
    const trimmed = content.trim()
    if (trimmed.length < MIN_LEN || trimmed.length > MAX_LEN) {
      toast('warning', `评论内容需在${MIN_LEN}-${MAX_LEN}字之间`)
      return
    }
    setSubmitting(true)
    try {
      await apiClient.post('/comments', { task_id: taskId, content: trimmed })
      setContent('')
      toast('success', '评论发表成功')
      await loadComments(1)
    } catch (err: unknown) {
      const e = err as { error?: string; message?: string }
      toast('error', e?.error || e?.message || '发表评论失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: number) => {
    if (!confirm('确定要删除这条评论吗？')) return
    setActionLoadingId(commentId)
    try {
      await apiClient.delete(`/comments/${commentId}`)
      toast('success', '删除成功')
      await loadComments(page)
    } catch (err: unknown) {
      const e = err as { error?: string; message?: string }
      toast('error', e?.error || e?.message || '删除评论失败')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleToggleLike = async (comment: Comment) => {
    if (!isAuthenticated) {
      toast('warning', '请先登录后再点赞')
      return
    }
    setActionLoadingId(comment.id)
    try {
      const res = await apiClient.post(`/comments/${comment.id}/like`)
      const data = (res.data as { data: { isLiked: boolean; likesCount: number } }).data
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id
            ? { ...c, isLiked: data.isLiked, likesCount: data.likesCount }
            : c
        )
      )
    } catch (err: unknown) {
      const e = err as { error?: string; message?: string }
      toast('error', e?.error || e?.message || '操作失败')
    } finally {
      setActionLoadingId(null)
    }
  }

  const charCount = content.trim().length
  const overLimit = charCount > MAX_LEN
  const canSubmit = charCount >= MIN_LEN && charCount <= MAX_LEN && !submitting

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-cyan-neon" />
        <h3 className="text-sm font-semibold text-white">评论</h3>
        <span className="text-xs text-text-muted">({total})</span>
      </div>

      {isAuthenticated ? (
        <div className="space-y-2">
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`写下你的评论（${MIN_LEN}-${MAX_LEN}字）...`}
              maxLength={MAX_LEN + 50}
              rows={3}
              className="w-full rounded-xl bg-space-800 border border-space-600 px-3 py-2.5 text-sm text-white placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:border-cyan-neon focus:shadow-[0_0_12px_var(--color-cyan-glow)] resize-none"
            />
            <div
              className={cn(
                'absolute bottom-2 right-3 text-[10px] font-mono',
                overLimit ? 'text-red-neon' : charCount >= MIN_LEN ? 'text-green-neon' : 'text-text-muted'
              )}
            >
              {charCount}/{MAX_LEN}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted">
              {charCount < MIN_LEN ? `还需 ${MIN_LEN - charCount} 字` : '可以发送啦'}
            </span>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all',
                canSubmit
                  ? 'bg-gradient-to-r from-cyan-neon to-[#0090ff] text-space-900 hover:shadow-[0_0_16px_var(--color-cyan-glow)]'
                  : 'bg-space-700 text-text-muted cursor-not-allowed'
              )}
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              发送
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-space-800/50 border border-space-600/30 text-center">
          <p className="text-xs text-text-muted">登录后可发表评论</p>
        </div>
      )}

      <div className="space-y-2 min-h-[80px]">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-cyan-neon animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-text-muted">暂无评论，快来抢沙发吧~</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((c) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-xl bg-space-800/60 border border-space-600/30"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-neon/30 to-purple-neon/30 flex items-center justify-center text-[10px] font-bold text-white">
                      {(c.userNickname || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-white">
                      {c.userNickname}
                    </span>
                    {c.userId === user?.id && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-cyan-neon/10 text-cyan-neon border border-cyan-neon/20">
                        我
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-text-muted">
                    {formatRelativeTime(c.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed mb-2">
                  {c.content}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleLike(c)}
                    disabled={actionLoadingId === c.id}
                    className={cn(
                      'inline-flex items-center gap-1 text-[11px] transition-colors disabled:opacity-50',
                      c.isLiked ? 'text-red-neon' : 'text-text-muted hover:text-red-neon'
                    )}
                  >
                    <Heart className={cn('w-3.5 h-3.5', c.isLiked && 'fill-current')} />
                    <span style={{ fontFamily: 'var(--font-orbitron)' }}>{c.likesCount}</span>
                  </button>
                  {c.isOwner && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={actionLoadingId === c.id}
                      className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-red-neon transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      删除
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => loadComments(page - 1)}
            disabled={page <= 1 || loading}
            className="p-1.5 rounded-lg bg-space-800 border border-space-600/40 text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-text-secondary px-2" style={{ fontFamily: 'var(--font-orbitron)' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => loadComments(page + 1)}
            disabled={page >= totalPages || loading}
            className="p-1.5 rounded-lg bg-space-800 border border-space-600/40 text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
