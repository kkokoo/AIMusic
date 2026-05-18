'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Coins } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import { useUIStore } from '@/stores/uiStore'
import { mockApi } from '@/mock/data'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { User } from '@/types'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function UsersPage() {
  const toast = useUIStore((s) => s.toast)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [creditModal, setCreditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [creditAmount, setCreditAmount] = useState(0)
  const [creditReason, setCreditReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState<number | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    const data = await mockApi.getAdminUsers()
    setUsers(data)
    setLoading(false)
  }

  function openCreditModal(user: User) {
    setSelectedUser(user)
    setCreditAmount(0)
    setCreditReason('')
    setCreditModal(true)
  }

  async function handleAdjustCredits() {
    if (!selectedUser) return
    if (creditAmount === 0) {
      toast('error', '请输入调整金额')
      return
    }
    if (!creditReason.trim()) {
      toast('error', '请输入调整原因')
      return
    }
    setSaving(true)
    try {
      await mockApi.adjustCredits(selectedUser.id, creditAmount, creditReason)
      toast('success', `积分已调整 ${creditAmount > 0 ? '+' : ''}${creditAmount}`)
      setCreditModal(false)
      await loadUsers()
    } catch {
      toast('error', '操作失败')
    }
    setSaving(false)
  }

  async function handleToggleStatus(user: User) {
    setToggling(user.id)
    try {
      await mockApi.toggleUserStatus(user.id)
      toast('success', user.isActive ? '用户已禁用' : '用户已启用')
      await loadUsers()
    } catch {
      toast('error', '操作失败')
    }
    setToggling(null)
  }

  if (loading) {
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
          <Users className="w-5 h-5 text-cyan-neon" />
        </div>
        <h1 className="text-2xl font-bold text-white">用户管理</h1>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted border-b border-space-600/50">
                  <th className="text-left py-3 font-medium">ID</th>
                  <th className="text-left py-3 font-medium">用户名</th>
                  <th className="text-left py-3 font-medium">邮箱</th>
                  <th className="text-right py-3 font-medium">积分</th>
                  <th className="text-right py-3 font-medium">累计获得</th>
                  <th className="text-right py-3 font-medium">累计消耗</th>
                  <th className="text-center py-3 font-medium">状态</th>
                  <th className="text-right py-3 font-medium">注册时间</th>
                  <th className="text-right py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-space-600/20 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 text-text-muted font-mono text-xs">
                      #{user.id}
                    </td>
                    <td className="py-3 text-white font-medium">
                      {user.username}
                      {user.isAdmin && (
                        <span className="ml-2">
                          <Badge variant="purple" dot>
                            管理员
                          </Badge>
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-text-secondary">{user.email}</td>
                    <td
                      className="py-3 text-right text-cyan-neon font-mono text-xs"
                      style={{ fontFamily: 'var(--font-orbitron)' }}
                    >
                      {user.credits}
                    </td>
                    <td className="py-3 text-right text-green-neon font-mono text-xs">
                      {user.totalCreditsEarned}
                    </td>
                    <td className="py-3 text-right text-red-neon font-mono text-xs">
                      {user.totalCreditsSpent}
                    </td>
                    <td className="py-3 text-center">
                      <Badge
                        variant={user.isActive ? 'green' : 'red'}
                        dot
                      >
                        {user.isActive ? '正常' : '禁用'}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-text-muted text-xs whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openCreditModal(user)}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          调整积分
                        </Button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={toggling === user.id}
                          className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                            user.isActive ? 'bg-cyan-neon/30' : 'bg-space-600',
                            toggling === user.id && 'opacity-50'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                              user.isActive ? 'translate-x-6' : 'translate-x-1'
                            )}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-text-muted">
                      暂无用户数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {users.length === 0 && (
              <div className="py-12 text-center text-text-muted">暂无用户数据</div>
            )}
            {users.map((user) => (
              <div
                key={user.id}
                className="p-3 rounded-lg bg-white/[0.02] border border-space-600/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{user.username}</span>
                    {user.isAdmin && (
                      <Badge variant="purple" dot>管理员</Badge>
                    )}
                    <Badge variant={user.isActive ? 'green' : 'red'} dot>
                      {user.isActive ? '正常' : '禁用'}
                    </Badge>
                  </div>
                  <span
                    className="text-cyan-neon font-mono text-xs font-bold"
                    style={{ fontFamily: 'var(--font-orbitron)' }}
                  >
                    {user.credits} 积分
                  </span>
                </div>
                <div className="text-text-secondary text-xs mb-2 truncate">{user.email}</div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted text-xs">{formatDate(user.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openCreditModal(user)}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      调整
                    </Button>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      disabled={toggling === user.id}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        user.isActive ? 'bg-cyan-neon/30' : 'bg-space-600',
                        toggling === user.id && 'opacity-50'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                          user.isActive ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      <Modal
        isOpen={creditModal}
        onClose={() => setCreditModal(false)}
        title={`调整积分 - ${selectedUser?.username}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreditModal(false)}>
              取消
            </Button>
            <Button onClick={handleAdjustCredits} loading={saving}>
              确认调整
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-1.5 text-sm font-medium text-text-secondary">
              当前积分
            </label>
            <p
              className="text-2xl font-bold text-cyan-neon"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              {selectedUser?.credits ?? 0}
            </p>
          </div>
          <Input
            label="调整数量（正数为增加，负数为减少）"
            type="number"
            value={creditAmount || ''}
            onChange={(e) => setCreditAmount(Number(e.target.value))}
            placeholder="如 100 或 -50"
          />
          <Input
            label="调整原因"
            value={creditReason}
            onChange={(e) => setCreditReason(e.target.value)}
            placeholder="请填写调整原因..."
          />
        </div>
      </Modal>
    </motion.div>
  )
}