'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Save } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    setLoading(true)
    try {
      const res = await apiClient.get('/admin/config')
      const raw = res.data as Record<string, unknown>
      setConfig({
        initialCredits: (raw.initialCredits as number) ?? 0,
        maxConcurrent: (raw.maxConcurrent as number) ?? 3,
        autoRefund: raw.autoRefund === true || raw.autoRefund === 'true',
        creditPricePerUnit: (raw.creditPricePerUnit as number) ?? 0.06,
      })
    } catch {
      toast('error', '加载系统配置失败')
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!config) return
    setSaving(true)
    try {
      await apiClient.put('/admin/config', config)
      toast('success', '系统配置已更新')
      await loadConfig()
    } catch {
      toast('error', '保存失败')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width={160} height={32} />
        <Skeleton variant="rectangular" height={300} />
      </div>
    )
  }

  if (!config) return null

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
        <Button onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4" />
          保存设置
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">积分设置</h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-1.5 text-sm text-text-muted">新用户注册赠送积分</label>
              <input
                type="number"
                value={config.initialCredits}
                onChange={(e) => setConfig({ ...config, initialCredits: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-space-700 border border-space-600 text-white text-sm focus:outline-none focus:border-cyan-neon"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-sm text-text-muted">积分单价（元/积分）</label>
              <input
                type="number"
                step="0.001"
                value={config.creditPricePerUnit}
                onChange={(e) => setConfig({ ...config, creditPricePerUnit: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-space-700 border border-space-600 text-white text-sm focus:outline-none focus:border-cyan-neon"
              />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">系统设置</h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-1.5 text-sm text-text-muted">最大并发任务数</label>
              <input
                type="number"
                value={config.maxConcurrent}
                onChange={(e) => setConfig({ ...config, maxConcurrent: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-lg bg-space-700 border border-space-600 text-white text-sm focus:outline-none focus:border-cyan-neon"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoRefund}
                onChange={(e) => setConfig({ ...config, autoRefund: e.target.checked })}
                className="w-4 h-4 rounded border-space-600 bg-space-700 text-cyan-neon focus:ring-cyan-neon"
              />
              <span className="text-sm text-text-muted">生成失败时自动退款</span>
            </label>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}