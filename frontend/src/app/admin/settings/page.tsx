'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import { useUIStore } from '@/stores/uiStore'
import { mockApi } from '@/mock/data'
import { cn } from '@/utils/cn'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function SettingsPage() {
  const toast = useUIStore((s) => s.toast)
  const [configs, setConfigs] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [savingSection, setSavingSection] = useState<string | null>(null)

  const [initialCredits, setInitialCredits] = useState(100)
  const [maxConcurrent, setMaxConcurrent] = useState(3)
  const [autoRefund, setAutoRefund] = useState(true)

  useEffect(() => {
    loadConfigs()
  }, [])

  async function loadConfigs() {
    setLoading(true)
    const data = await mockApi.getConfigs()
    setConfigs(data)
    setInitialCredits((data.initialCredits as number) ?? 100)
    setMaxConcurrent((data.maxConcurrent as number) ?? 3)
    setAutoRefund((data.autoRefund as boolean) ?? true)
    setLoading(false)
  }

  async function handleSaveBasic() {
    setSavingSection('basic')
    try {
      await mockApi.updateConfigs({ initialCredits, maxConcurrent, autoRefund })
      toast('success', '基础设置已保存')
    } catch {
      toast('error', '保存失败')
    }
    setSavingSection(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width={160} height={32} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton variant="rectangular" height={280} />
          <Skeleton variant="rectangular" height={280} />
        </div>
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
          <Settings className="w-5 h-5 text-cyan-neon" />
        </div>
        <h1 className="text-2xl font-bold text-white">系统配置</h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card
            header={
              <h3 className="font-semibold text-white">基础设置</h3>
            }
            footer={
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveBasic}
                  loading={savingSection === 'basic'}
                >
                  保存设置
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              <Input
                label="新用户初始积分"
                type="number"
                value={initialCredits || ''}
                onChange={(e) => setInitialCredits(Number(e.target.value))}
              />
              <Input
                label="最大并发任务数"
                type="number"
                value={maxConcurrent || ''}
                onChange={(e) => setMaxConcurrent(Number(e.target.value))}
              />
              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-sm text-text-secondary">
                    任务失败自动退款
                  </span>
                  <p className="text-xs text-text-muted mt-0.5">
                    生成失败后自动退还消耗的积分
                  </p>
                </div>
                <button
                  onClick={() => setAutoRefund(!autoRefund)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0',
                    autoRefund ? 'bg-cyan-neon/30' : 'bg-space-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                      autoRefund ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card header={<h3 className="font-semibold text-white">支付配置</h3>}>
            <div className="space-y-4">
              <div className="rounded-xl bg-space-700/50 border border-space-600/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white font-medium">微信支付</span>
                  <span className="text-xs text-text-muted">未配置</span>
                </div>
                <p className="text-xs text-text-muted">
                  请在系统环境变量中配置微信支付商户号和API密钥
                </p>
              </div>
              <div className="rounded-xl bg-space-700/50 border border-space-600/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white font-medium">支付宝</span>
                  <span className="text-xs text-text-muted">未配置</span>
                </div>
                <p className="text-xs text-text-muted">
                  请在系统环境变量中配置支付宝APPID和商户私钥
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card header={<h3 className="font-semibold text-white">关于系统</h3>}>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">系统版本</span>
                <span className="text-white font-mono">v1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">前端框架</span>
                <span className="text-white font-mono">Next.js</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">数据处理</span>
                <span className="text-amber-400 font-mono text-xs">Mock Data (本地存储)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">主题</span>
                <span className="text-cyan-neon">Cyberpunk Neon Dark</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}