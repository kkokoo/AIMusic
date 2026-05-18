'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, CheckCircle } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { useUIStore } from '@/stores/uiStore'
import { mockApi } from '@/mock/data'
import { formatDate, formatOrderNo, formatPrice } from '@/utils/format'
import type { CreditOrder } from '@/types'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const statusVariant: Record<string, 'cyan' | 'purple' | 'green' | 'red' | 'gray'> = {
  pending: 'purple',
  success: 'green',
  failed: 'red',
}

const statusLabels: Record<string, string> = {
  pending: '待支付',
  success: '已支付',
  failed: '已失败',
}

export default function OrdersPage() {
  const toast = useUIStore((s) => s.toast)
  const [orders, setOrders] = useState<CreditOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<number | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    setLoading(true)
    const data = await mockApi.getAdminOrders()
    setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    setLoading(false)
  }

  async function handleComplete(order: CreditOrder) {
    setCompleting(order.id)
    try {
      await mockApi.completeOrder(order.id, order.userId)
      toast('success', '订单已完成')
      await loadOrders()
    } catch {
      toast('error', '操作失败')
    }
    setCompleting(null)
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
          <ShoppingCart className="w-5 h-5 text-cyan-neon" />
        </div>
        <h1 className="text-2xl font-bold text-white">订单管理</h1>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted border-b border-space-600/50">
                  <th className="text-left py-3 font-medium">订单号</th>
                  <th className="text-left py-3 font-medium">用户</th>
                  <th className="text-right py-3 font-medium">金额</th>
                  <th className="text-right py-3 font-medium">积分</th>
                  <th className="text-center py-3 font-medium">状态</th>
                  <th className="text-center py-3 font-medium">支付方式</th>
                  <th className="text-right py-3 font-medium">时间</th>
                  <th className="text-center py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-space-600/20 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 text-text-muted font-mono text-xs" title={order.orderNo}>
                      {formatOrderNo(order.orderNo)}
                    </td>
                    <td className="py-3 text-text-secondary">用户#{order.userId}</td>
                    <td className="py-3 text-right text-white font-medium">
                      {formatPrice(order.amountCents)}
                    </td>
                    <td className="py-3 text-right text-cyan-neon font-mono text-xs">
                      {order.creditsBought}
                      {order.bonusCredits > 0 && (
                        <span className="text-purple-neon ml-1">+{order.bonusCredits}</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <Badge variant={statusVariant[order.status] || 'gray'} dot>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-center text-text-secondary">
                      {order.paymentMethod === 'wechat' ? '微信' : order.paymentMethod === 'alipay' ? '支付宝' : '-'}
                    </td>
                    <td className="py-3 text-right text-text-muted text-xs whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3 text-center">
                      {order.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleComplete(order)}
                          loading={completing === order.id}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          完成
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-text-muted">
                      暂无订单数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {orders.length === 0 && (
              <div className="py-12 text-center text-text-muted">暂无订单数据</div>
            )}
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-3 rounded-lg bg-white/[0.02] border border-space-600/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-muted font-mono text-xs" title={order.orderNo}>
                    {formatOrderNo(order.orderNo)}
                  </span>
                  <span className="text-white font-medium text-sm">
                    {formatPrice(order.amountCents)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-text-secondary text-xs">用户#{order.userId}</span>
                  <span className="text-text-secondary text-xs">
                    套餐#{order.packageId ?? '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant={statusVariant[order.status] || 'gray'} dot>
                    {statusLabels[order.status] || order.status}
                  </Badge>
                  <span className="text-text-muted text-xs">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}