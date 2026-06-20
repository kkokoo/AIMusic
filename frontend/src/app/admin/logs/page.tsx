'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Filter, RefreshCw } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import Pagination from '@/components/ui/Pagination'
import { useDebounce } from '@/hooks/useDebounce'
import apiClient from '@/lib/axios'
import { formatDate, formatRelativeTime } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { AdminLog, PaginatedResponse } from '@/types'

const PAGE_SIZE = 10

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const ACTION_OPTIONS = [
  { value: '', label: '全部操作' },
  { value: 'login', label: '登录' },
  { value: 'create', label: '创建' },
  { value: 'update', label: '更新' },
  { value: 'delete', label: '删除' },
  { value: 'adjust', label: '调整' },
  { value: 'toggle', label: '开关' },
]

const TARGET_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'user', label: '用户' },
  { value: 'model', label: '模型' },
  { value: 'package', label: '套餐' },
  { value: 'order', label: '订单' },
  { value: 'config', label: '配置' },
]

function getActionVariant(action: string): 'cyan' | 'purple' | 'green' | 'red' | 'gray' {
  if (action === 'create') return 'green'
  if (action === 'delete') return 'red'
  if (action === 'update' || action === 'adjust') return 'purple'
  if (action === 'login') return 'cyan'
  return 'gray'
}

function getActionLabel(action: string): string {
  const map: Record<string, string> = {
    login: '登录',
    create: '创建',
    update: '更新',
    delete: '删除',
    adjust: '调整',
    toggle: '开关',
  }
  return map[action] || action
}

function getTargetLabel(type: string): string {
  const map: Record<string, string> = {
    user: '用户',
    model: '模型',
    package: '套餐',
    order: '订单',
    config: '配置',
  }
  return map[type] || type
}

// details 由后端以 JSON 字符串形式返回，这里兼容字符串与对象两种情况
function formatDetails(details: unknown, max = 60): string {
  if (!details) return '-'
  let obj = details
  if (typeof details === 'string') {
    try {
      obj = JSON.parse(details)
    } catch {
      return details.length > max ? details.slice(0, max) + '...' : details
    }
  }
  if (typeof obj === 'object' && obj !== null) {
    const str = JSON.stringify(obj)
    return str.length > max ? str.slice(0, max) + '...' : str
  }
  const str = String(obj)
  return str.length > max ? str.slice(0, max) + '...' : str
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionFilter, setActionFilter] = useState('')
  const [targetFilter, setTargetFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const debouncedActionFilter = useDebounce(actionFilter, 400)
  const debouncedTargetFilter = useDebounce(targetFilter, 400)

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    ;(async () => {
      try {
        const res = await apiClient.get('/admin/logs', {
          params: {
            page,
            page_size: PAGE_SIZE,
            ...(debouncedActionFilter ? { action: debouncedActionFilter } : {}),
            ...(debouncedTargetFilter ? { target_type: debouncedTargetFilter } : {}),
          },
          signal: controller.signal,
        })
        if (!active) return
        const data = (res.data as { data: PaginatedResponse<AdminLog> }).data
        setLogs(data.items)
        setTotal(data.total)
        setTotalPages(data.totalPages || 1)
      } catch {
        if (!active) return
        setLogs([])
        setTotal(0)
        setTotalPages(1)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
      controller.abort()
    }
  }, [page, debouncedActionFilter, debouncedTargetFilter, refreshKey])

  function handleActionFilter(value: string) {
    if (value === actionFilter && page === 1) return
    setActionFilter(value)
    setPage(1)
    setLoading(true)
  }

  function handleTargetFilter(value: string) {
    if (value === targetFilter && page === 1) return
    setTargetFilter(value)
    setPage(1)
    setLoading(true)
  }

  function handlePageChange(next: number) {
    setLoading(true)
    setPage(next)
  }

  function handleRefresh() {
    setLoading(true)
    setRefreshKey((k) => k + 1)
  }

  if (loading && logs.length === 0) {
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
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-neon/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-cyan-neon" />
          </div>
          <h1 className="text-2xl font-bold text-white">操作日志</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4" />
            筛选
          </Button>
          <Button variant="secondary" onClick={handleRefresh}>
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            刷新
          </Button>
        </div>
      </motion.div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Card>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block mb-1.5 text-xs text-text-muted">操作类型</label>
                <div className="flex gap-2">
                  {ACTION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleActionFilter(opt.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm border transition-all',
                        actionFilter === opt.value
                          ? 'border-cyan-neon bg-cyan-neon/10 text-cyan-neon'
                          : 'border-space-600 text-text-muted hover:border-space-500'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-xs text-text-muted">目标类型</label>
                <div className="flex gap-2">
                  {TARGET_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleTargetFilter(opt.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm border transition-all',
                        targetFilter === opt.value
                          ? 'border-cyan-neon bg-cyan-neon/10 text-cyan-neon'
                          : 'border-space-600 text-text-muted hover:border-space-500'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Card>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted border-b border-space-600/50">
                  <th className="text-left py-3 font-medium">ID</th>
                  <th className="text-left py-3 font-medium">管理员</th>
                  <th className="text-center py-3 font-medium">操作</th>
                  <th className="text-center py-3 font-medium">目标类型</th>
                  <th className="text-left py-3 font-medium">详情</th>
                  <th className="text-left py-3 font-medium">IP</th>
                  <th className="text-right py-3 font-medium">时间</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-space-600/20 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 text-text-muted font-mono text-xs">#{log.id}</td>
                    <td className="py-3 text-white font-medium">
                      {log.adminName || `管理员#${log.adminId}`}
                    </td>
                    <td className="py-3 text-center">
                      <Badge variant={getActionVariant(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </td>
                    <td className="py-3 text-center text-text-secondary">
                      {getTargetLabel(log.targetType)}
                      {log.targetId && (
                        <span className="text-text-muted font-mono text-xs ml-1">
                          #{log.targetId}
                        </span>
                      )}
                    </td>
                    <td
                      className="py-3 text-text-muted text-xs max-w-[200px] truncate"
                      title={formatDetails(log.details, 200)}
                    >
                      {formatDetails(log.details)}
                    </td>
                    <td className="py-3 text-text-muted font-mono text-xs">
                      {log.ip || '-'}
                    </td>
                    <td className="py-3 text-right text-text-muted text-xs whitespace-nowrap">
                      <span title={formatDate(log.createdAt)}>
                        {formatRelativeTime(log.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-muted">
                      暂无日志数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {logs.length === 0 && (
              <div className="py-12 text-center text-text-muted">暂无日志数据</div>
            )}
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg bg-white/[0.02] border border-space-600/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-muted font-mono text-xs">#{log.id}</span>
                  <Badge variant={getActionVariant(log.action)}>
                    {getActionLabel(log.action)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white text-sm font-medium">
                    {log.adminName || `管理员#${log.adminId}`}
                  </span>
                  <span className="text-text-muted text-xs">
                    {getTargetLabel(log.targetType)}
                    {log.targetId && ` #${log.targetId}`}
                  </span>
                </div>
                {log.details && (
                  <div
                    className="text-text-muted text-xs mb-2 font-mono truncate"
                    title={formatDetails(log.details, 200)}
                  >
                    {formatDetails(log.details, 80)}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted font-mono">{log.ip || '-'}</span>
                  <span className="text-text-muted" title={formatDate(log.createdAt)}>
                    {formatRelativeTime(log.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            loading={loading}
            onPageChange={handlePageChange}
            itemName="条日志"
          />
        </Card>
      </motion.div>
    </motion.div>
  )
}
