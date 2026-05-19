'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users as UsersIcon, Shield, Ban, Check, Coins } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import Modal from '@/components/ui/Modal'
import { useUIStore } from '@/stores/uiStore'
import apiClient from '@/lib/axios'
import { formatDate } from '@/utils/format'
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreditsModal, setShowCreditsModal] = useState(false)
  const [creditAmount, setCreditAmount] = useState(0)
  const [creditReason, setCreditReason] = useState('')
  const [adjusting, setAdjusting] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const res = await apiClient.get('/admin/users')
      setUsers(res.data as User[])
    } catch {
      toast('error', '加载用户列表失败')
    }
    setLoading(false)
  }

  function openCredits(user: User) {
    setSelectedUser(user)
    setCreditAmount(0)
    setCreditReason('')
    setShowCreditsModal(true)
  }

  async function handleAdjustCredits() {
    if (!selectedUser || !creditAmount) {
      toast('error', '请填写积分数量')
      return
    }
    setAdjusting(true)
    try {
      await apiClient.post(`/admin/users/${selectedUser.id}/credits`, {
        amount: creditAmount,
        reason: creditReason || undefined,
      })
      toast('success', '积分已调整')
      setShowCreditsModal(false)
      await loadUsers()
    } catch {
      toast('error', '调整积分失败')
    }
    setAdjusting(false)
  }

  async function handleToggleStatus(user: User) {
    try {
      await apiClient.put(`/admin/users/${user.id}/status`)
      toast('success', user.isActive ? '用户已禁用' : '用户已启用')
      await loadUsers()
    } catch {
      toast('error', '操作失败')
    }
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
          <UsersIcon className="w-5 h-5 text-cyan-neon" />
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
                  <th className="text-right py-3 font-medium">总消费</th>
                  <th className="text-center py-3 font-medium">角色</th>
                  <th className="text-center py-3 font-medium">状态</th>
                  <th className="text-left py-3 font-medium">注册时间</th>
                  <th className="text-center py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-space-600/20 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 text-text-muted font-mono text-xs">#{user.id}</td>
                    <td className="py-3 text-white font-medium">{user.username}</td>
                    <td className="py-3 text-text-secondary">{user.email}</td>
                    <td className="py-3 text-right text-cyan-neon font-mono">
                      {user.credits?.toLocaleString() ?? 0}
                    </td>
                    <td className="py-3 text-right text-text-muted font-mono">
                      {user.totalCreditsSpent?.toLocaleString() ?? 0}
                    </td>
                    <td className="py-3 text-center">
                      {user.isAdmin ? (
                        <Badge variant="purple">
                          <Shield className="w-3 h-3" />
                          管理员
                        </Badge>
                      ) : (
                        <Badge variant="gray">用户</Badge>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {user.isActive ? (
                        <Badge variant="green" dot>正常</Badge>
                      ) : (
                        <Badge variant="red" dot>禁用</Badge>
                      )}
                    </td>
                    <td className="py-3 text-text-muted text-xs whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openCredits(user)}>
                          <Coins className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.isActive ? (
                            <Ban className="w-4 h-4 text-red-400" />
                          ) : (
                            <Check className="w-4 h-4 text-green-400" />
                          )}
                        </Button>
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
                    <span className="text-white font-medium">{user.username}</span>
                    {user.isAdmin && (
                      <Badge variant="purple">Admin</Badge>
                    )}
                  </div>
                  <span className="text-cyan-neon font-mono text-sm">
                    {user.credits?.toLocaleString() ?? 0} 积分
                  </span>
                </div>
                <div className="text-text-muted text-xs mb-2">{user.email}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openCredits(user)}>
                      <Coins className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(user)}>
                      {user.isActive ? (
                        <Ban className="w-4 h-4 text-red-400" />
                      ) : (
                        <Check className="w-4 h-4 text-green-400" />
                      )}
                    </Button>
                  </div>
                  <span className="text-text-muted text-xs">
                    {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      <Modal
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        title={`调整积分 - ${selectedUser?.username ?? ''}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            当前积分：<span className="text-cyan-neon font-mono">{selectedUser?.credits?.toLocaleString() ?? 0}</span>
          </p>
          <div>
            <label className="block mb-1.5 text-sm text-text-muted">
              调整数量（正数增加，负数扣除）
            </label>
            <input
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-space-700 border border-space-600 text-white text-sm focus:outline-none focus:border-cyan-neon"
              placeholder="例如：100"
            />
          </div>
          <div>
            <label className="block mb-1.5 text-sm text-text-muted">原因（可选）</label>
            <input
              value={creditReason}
              onChange={(e) => setCreditReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-space-700 border border-space-600 text-white text-sm focus:outline-none focus:border-cyan-neon"
              placeholder="例如：活动奖励"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowCreditsModal(false)}>
              取消
            </Button>
            <Button onClick={handleAdjustCredits} loading={adjusting}>
              确认调整
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}