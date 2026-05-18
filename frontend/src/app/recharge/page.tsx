'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet,
  Coins,
  CheckCircle,
  Sparkles,
  Loader2,
  Plus,
  CreditCard,
  Clock,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useCreditStore } from '@/stores/creditStore'
import { useUIStore } from '@/stores/uiStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Skeleton from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'
import { formatPrice } from '@/utils/format'
import type { CreditPackage, CreditOrder } from '@/types'

function PackageCard({
  pkg,
  isSelected,
  onClick,
}: {
  pkg: CreditPackage
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'relative text-left rounded-2xl border p-3 md:p-5 transition-all duration-300',
        isSelected
          ? 'border-purple-neon bg-purple-glow/10 shadow-[0_0_20px_var(--color-purple-glow)]'
          : 'border-space-600/50 bg-space-800 hover:border-space-500'
      )}
    >
      {pkg.isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-0.5 rounded-full bg-purple-neon text-white text-xs font-bold">
            推荐
          </span>
        </div>
      )}

      <h3
        className="text-lg font-bold text-white mb-3 mt-1"
        style={{ fontFamily: 'var(--font-orbitron)' }}
      >
        {pkg.name}
      </h3>

      <p
        className="text-3xl font-bold text-cyan-neon glow-text-cyan mb-1"
        style={{ fontFamily: 'var(--font-orbitron)' }}
      >
        {formatPrice(pkg.priceCents)}
      </p>
      <p className="text-xs text-text-muted mb-4">一次性支付</p>

      <div className="flex items-center gap-2 mb-3">
        <Coins className="w-5 h-5 text-cyan-neon" />
        <span
          className="text-xl font-bold text-white"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          {pkg.credits}
        </span>
        <span className="text-sm text-text-secondary">积分</span>
      </div>

      {pkg.bonusCredits > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-neon/10 border border-purple-neon/20"
        >
          <Sparkles className="w-3 h-3 text-purple-neon" />
          <span className="text-xs font-bold text-purple-neon">
            赠送{pkg.bonusCredits}
          </span>
        </motion.div>
      )}
    </motion.button>
  )
}

function PaymentModal({
  isOpen,
  onClose,
  order,
  step,
  onConfirm,
}: {
  isOpen: boolean
  onClose: () => void
  order: CreditOrder | null
  step: 'confirm' | 'processing' | 'done'
  onConfirm: () => void
}) {
  if (!order) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      {step === 'confirm' && (
        <div className="flex flex-col items-center py-4">
          <div className="p-3 rounded-full bg-cyan-neon/10 border border-cyan-neon/20 mb-4">
            <CreditCard className="w-10 h-10 text-cyan-neon" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">确认支付</h2>

          <div className="w-full bg-space-800 rounded-xl p-4 mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">订单编号</span>
              <span className="text-white font-mono text-xs">{order.orderNo}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">支付方式</span>
              <span className="text-white">{order.paymentMethod === 'alipay' ? '支付宝 (沙箱)' : order.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">购买积分</span>
              <span className="text-cyan-neon font-bold">{order.creditsBought + order.bonusCredits}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-space-600 pt-2">
              <span className="text-text-muted">应付金额</span>
              <span className="text-white font-bold" style={{ fontFamily: 'var(--font-orbitron)' }}>
                {(order.amountCents / 100).toFixed(2)}
              </span>
            </div>
          </div>

          <p className="text-xs text-text-muted mb-4">模拟支付环境，点击确认即完成支付</p>

          <div className="flex gap-3 w-full">
            <Button variant="secondary" size="lg" onClick={onClose} className="flex-1">
              取消
            </Button>
            <Button variant="primary" size="lg" onClick={onConfirm} className="flex-1">
              确认支付
            </Button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="flex flex-col items-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className="mb-4"
          >
            <Loader2 className="w-12 h-12 text-cyan-neon" />
          </motion.div>
          <h2 className="text-lg font-bold text-white mb-2">支付处理中</h2>
          <p className="text-sm text-text-muted">正在连接支付网关...</p>
        </div>
      )}

      {step === 'done' && (
        <div className="flex flex-col items-center py-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="p-3 rounded-full bg-green-neon/10 border border-green-neon/20 mb-4"
          >
            <CheckCircle className="w-12 h-12 text-green-neon" />
          </motion.div>
          <h2 className="text-lg font-bold text-white mb-2">支付成功</h2>
          <p className="text-sm text-text-muted">积分已到账</p>
        </div>
      )}
    </Modal>
  )
}

function SuccessModal({
  isOpen,
  onClose,
  order,
}: {
  isOpen: boolean
  onClose: () => void
  order: CreditOrder | null
}) {
  const { user } = useAuthStore()

  if (!order) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center py-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="p-3 rounded-full bg-green-neon/10 border border-green-neon/20 mb-4"
        >
          <CheckCircle className="w-12 h-12 text-green-neon" />
        </motion.div>

        <h2 className="text-lg font-bold text-white mb-2">充值成功</h2>

        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-5 h-5 text-cyan-neon" />
          <span
            className="text-xl md:text-2xl font-bold text-cyan-neon glow-text-cyan"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            +{order.creditsBought + order.bonusCredits}
          </span>
        </div>

        <p className="text-sm text-text-secondary mb-6">
          当前余额：
          <span
            className="font-bold text-cyan-neon"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            {user?.credits ?? 0}
          </span>
          {' '}积分
        </p>

        <Button variant="primary" size="lg" onClick={onClose} className="w-full">
          完成
        </Button>
      </div>
    </Modal>
  )
}

export default function RechargePage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { packages, fetchPackages, createOrder, payOrder, loading } = useCreditStore()
  const { toast } = useUIStore()

  const [selectedPkg, setSelectedPkg] = useState<CreditPackage | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'alipay'>('alipay')
  const [payLoading, setPayLoading] = useState(false)
  const [payMessage, setPayMessage] = useState('')
  const [successOrder, setSuccessOrder] = useState<CreditOrder | null>(null)
  const [successOpen, setSuccessOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<CreditOrder | null>(null)
  const [paymentStep, setPaymentStep] = useState<'confirm' | 'processing' | 'done'>('confirm')

  const [customCredits, setCustomCredits] = useState('')
  const [customSelected, setCustomSelected] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  const handleSelectPackage = useCallback((pkg: CreditPackage) => {
    setSelectedPkg(pkg)
    setCustomSelected(false)
    setCustomCredits('')
  }, [])

  const handleCustomSelect = useCallback(() => {
    setSelectedPkg(null)
    setCustomSelected(true)
  }, [])

  const customCreditNum = parseInt(customCredits) || 0
  const customPriceCents = customCreditNum * 6

  const handlePay = useCallback(async () => {
    if (!user) return

    setPayLoading(true)
    setPayMessage('正在创建订单...')

    try {
      const order = await createOrder(user.id, {
        packageId: selectedPkg?.id,
        customCredits: customSelected ? customCreditNum : undefined,
        paymentMethod,
      })

      setPayLoading(false)
      setPayMessage('')
      setPendingOrder(order)
      setPaymentStep('confirm')
      setPaymentOpen(true)
    } catch {
      setPayLoading(false)
      setPayMessage('')
      toast('error', '创建订单失败，请重试')
    }
  }, [user, selectedPkg, customSelected, customCreditNum, paymentMethod, createOrder, toast])

  const handleConfirmPay = useCallback(async () => {
    if (!pendingOrder || !user) return

    setPaymentStep('processing')
    try {
      await new Promise((r) => setTimeout(r, 1500))
      await payOrder(pendingOrder.id, user.id)

      setPaymentStep('done')
      await new Promise((r) => setTimeout(r, 800))

      setPaymentOpen(false)
      setSuccessOrder(pendingOrder)
      setSuccessOpen(true)
      setPendingOrder(null)
      setSelectedPkg(null)
      toast('success', '充值成功')
    } catch {
      setPaymentOpen(false)
      setPendingOrder(null)
      toast('error', '支付失败，请重试')
    }
  }, [pendingOrder, user, payOrder, toast])

  const canPay = selectedPkg || (customSelected && customCreditNum > 0)

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-0">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="p-2 rounded-xl bg-cyan-neon/10 border border-cyan-neon/20">
            <Wallet className="w-6 h-6 text-cyan-neon" />
          </div>
          <h1
            className="text-2xl font-bold text-cyan-neon glow-text-cyan"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            积分充值
          </h1>
        </motion.div>

        <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">选择套餐</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {loading && packages.length === 0
            ? [1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl bg-space-800 border border-space-600/50 p-4">
                <Skeleton variant="text" width="50%" className="mb-2" />
                <Skeleton variant="text" width="30%" height={28} className="mb-2" />
                <Skeleton variant="text" width="40%" className="mb-3" />
                <Skeleton variant="text" width="60%" height={24} />
              </div>
            ))
            : packages.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                className="w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <PackageCard
                  pkg={pkg}
                  isSelected={selectedPkg?.id === pkg.id}
                  onClick={() => handleSelectPackage(pkg)}
                />
              </motion.div>
            ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-medium text-text-secondary mb-3">支付方式</h3>
          <div className="flex gap-3 mb-6 md:mb-8">
            <div
              className={cn(
                'flex items-center gap-2 px-5 py-3 rounded-xl border',
                'border-cyan-neon bg-cyan-neon/10 text-cyan-neon'
              )}
            >
              <span className="text-lg font-bold">支付宝 (沙箱)</span>
            </div>
          </div>
        </motion.div>

        <div className="flex justify-center mb-8 md:mb-12">
          <Button
            variant="primary"
            size="lg"
            disabled={!canPay || payLoading}
            loading={payLoading}
            onClick={handlePay}
            className="min-w-[240px]"
          >
            {payLoading ? payMessage : '立即支付'}
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="border-t border-space-600/50 pt-8"
        >
          <h3 className="text-sm font-medium text-text-secondary mb-4">自定义金额</h3>
          <div
            onClick={handleCustomSelect}
            className={cn(
              'rounded-2xl border p-5 transition-all duration-300 cursor-pointer',
              customSelected
                ? 'border-purple-neon bg-purple-glow/10 shadow-[0_0_20px_var(--color-purple-glow)]'
                : 'border-space-600/50 bg-space-800 hover:border-space-500'
            )}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 w-full sm:w-auto">
                <Input
                  type="number"
                  placeholder="输入积分数量"
                  value={customCredits}
                  onChange={(e) => setCustomCredits(e.target.value)}
                  min="10"
                  icon={<Plus className="w-4 h-4" />}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-secondary">
                  ={' '}
                  <span
                    className="text-lg font-bold text-cyan-neon"
                    style={{ fontFamily: 'var(--font-orbitron)' }}
                  >
                    {formatPrice(customPriceCents)}
                  </span>
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={customCreditNum <= 0}
                  onClick={handleCustomSelect}
                >
                  选择
                </Button>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-3">
              1积分 = ¥0.06，最低充值10积分
            </p>
          </div>
        </motion.div>

        <PaymentModal
          isOpen={paymentOpen}
          onClose={() => { setPaymentOpen(false); setPendingOrder(null) }}
          order={pendingOrder}
          step={paymentStep}
          onConfirm={handleConfirmPay}
        />

        <SuccessModal
          isOpen={successOpen}
          onClose={() => setSuccessOpen(false)}
          order={successOrder}
        />
      </div>
    </div>
  )
}