'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Coins,
  Cpu,
  RefreshCw,
  Gift,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import { useUIStore } from '@/stores/uiStore'
import apiClient from '@/lib/axios'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

interface SystemConfig {
  initialCredits: number
  maxConcurrent: number
  autoRefund: boolean
  creditPricePerUnit: number
}

export default function SettingsPage() {
  const toast = useUIStore((s) => s.toast)
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [originalConfig, setOriginalConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/admin/config')
      const raw = (res.data as { data: Record<string, unknown> }).data
      const cfg: SystemConfig = {
        initialCredits: (raw.initialCredits as number) ?? 0,
        maxConcurrent: (raw.maxConcurrent as number) ?? 3,
        autoRefund: raw.autoRefund === true || raw.autoRefund === 'true',
        creditPricePerUnit: (raw.creditPricePerUnit as number) ?? 0.06,
      }
      setConfig(cfg)
      setOriginalConfig(cfg)
    } catch (err: unknown) {
      const e = err as { error?: string; message?: string }
      toast('error', e?.error || e?.message || '加载系统配置失败')
    }
    setLoading(false)
  }, [toast])

  useEffect(() => {
    ;(async () => {
      await loadConfig()
    })()
  }, [loadConfig])

  async function handleSave() {
    if (!config) return
    setSaving(true)
    try {
      await apiClient.put('/admin/config', config)
      toast('success', '系统配置已更新')
      setOriginalConfig(config)
      await loadConfig()
    } catch (err: unknown) {
      const e = err as { error?: string; message?: string }
      toast('error', e?.error || e?.message || '保存失败')
    }
    setSaving(false)
  }

  function handleReset() {
    if (!originalConfig) return
    setConfig({ ...originalConfig })
    toast('info', '已重置为上次保存的配置')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width={160} height={32} />
        <Skeleton variant="rectangular" height={300} />
      </div>
    )
  }

  if (!config || !originalConfig) return null

  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig)

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
            <SettingsIcon className="w-5 h-5 text-cyan-neon" />
          </div>
          <h1 className="text-2xl font-bold text-white">系统设置</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw className="w-4 h-4" />
            重置
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={!hasChanges}>
            <Save className="w-4 h-4" />
            保存设置
          </Button>
        </div>
      </motion.div>

      {/* Summary card */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-neon/10 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-cyan-neon" />
              </div>
              <div>
                <p className="text-xs text-text-muted">注册赠送</p>
                <p className="text-lg font-bold text-white">
                  {config.initialCredits}
                  <span className="text-xs text-text-muted ml-1">积分</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-neon/10 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5 text-purple-neon" />
              </div>
              <div>
                <p className="text-xs text-text-muted">积分单价</p>
                <p className="text-lg font-bold text-white">
                  ¥{config.creditPricePerUnit.toFixed(3)}
                  <span className="text-xs text-text-muted ml-1">/积分</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-neon/10 flex items-center justify-center shrink-0">
                <Cpu className="w-5 h-5 text-green-neon" />
              </div>
              <div>
                <p className="text-xs text-text-muted">最大并发</p>
                <p className="text-lg font-bold text-white">
                  {config.maxConcurrent}
                  <span className="text-xs text-text-muted ml-1">任务</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-text-muted">自动退款</p>
                <p className="text-lg font-bold text-white">
                  {config.autoRefund ? '已开启' : '已关闭'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Credits settings */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-cyan-neon/10 flex items-center justify-center">
              <Coins className="w-4 h-4 text-cyan-neon" />
            </div>
            <h3 className="text-lg font-semibold text-white">积分设置</h3>
          </div>
          <p className="text-xs text-text-muted mb-4 ml-10">配置积分的发放规则与定价</p>
          <div className="h-px bg-space-600/30 mb-5" />
          <div className="space-y-5">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-text-secondary">
                新用户注册赠送积分
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.initialCredits}
                  onChange={(e) =>
                    setConfig({ ...config, initialCredits: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2.5 pr-12 rounded-xl bg-space-800 border border-space-600 text-white text-sm focus:outline-none focus:border-cyan-neon focus:shadow-[0_0_12px_var(--color-cyan-glow)] transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                  积分
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1.5">
                用户首次注册时自动发放的积分数量，设为 0 则不赠送
              </p>
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-medium text-text-secondary">
                积分单价
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  value={config.creditPricePerUnit}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      creditPricePerUnit: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2.5 pr-16 rounded-xl bg-space-800 border border-space-600 text-white text-sm focus:outline-none focus:border-cyan-neon focus:shadow-[0_0_12px_var(--color-cyan-glow)] transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                  元/积分
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1.5">
                每积分对应的人民币价格，例如 0.06 表示 1 积分 = 0.06 元
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* System settings */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-purple-neon/10 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-purple-neon" />
            </div>
            <h3 className="text-lg font-semibold text-white">系统设置</h3>
          </div>
          <p className="text-xs text-text-muted mb-4 ml-10">配置系统运行参数与异常处理策略</p>
          <div className="h-px bg-space-600/30 mb-5" />
          <div className="space-y-5">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-text-secondary">
                最大并发任务数
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.maxConcurrent}
                  onChange={(e) =>
                    setConfig({ ...config, maxConcurrent: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-4 py-2.5 pr-12 rounded-xl bg-space-800 border border-space-600 text-white text-sm focus:outline-none focus:border-cyan-neon focus:shadow-[0_0_12px_var(--color-cyan-glow)] transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                  任务
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1.5">
                单个用户同时进行音乐生成的最大任务数量
              </p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-space-900/50 border border-space-600/30">
              <div>
                <span className="text-sm font-medium text-text-secondary">
                  生成失败时自动退款
                </span>
                <p className="text-xs text-text-muted mt-1">
                  开启后，音乐生成失败时将自动退还消耗的积分
                </p>
              </div>
              <button
                onClick={() => setConfig({ ...config, autoRefund: !config.autoRefund })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                  config.autoRefund ? 'bg-cyan-neon/30' : 'bg-space-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    config.autoRefund ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
