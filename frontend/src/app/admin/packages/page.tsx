'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, Plus, Edit3, Trash2 } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import Modal from '@/components/ui/Modal'
import { useUIStore } from '@/stores/uiStore'
import apiClient from '@/lib/axios'
import { formatPrice } from '@/utils/format'
import type { CreditPackage } from '@/types'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function PackagesPage() {
  const toast = useUIStore((s) => s.toast)
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    priceCents: 0,
    credits: 0,
    bonusCredits: 0,
    isRecommended: false,
  })

  useEffect(() => {
    loadPackages()
  }, [])

  async function loadPackages() {
    setLoading(true)
    try {
      const res = await apiClient.get('/admin/packages')
      setPackages(res.data as CreditPackage[])
    } catch {
      toast('error', '加载套餐列表失败')
    }
    setLoading(false)
  }

  function openCreate() {
    setEditingId(null)
    setForm({ name: '', priceCents: 0, credits: 0, bonusCredits: 0, isRecommended: false })
    setShowModal(true)
  }

  function openEdit(pkg: CreditPackage) {
    setEditingId(pkg.id)
    setForm({
      name: pkg.name,
      priceCents: pkg.priceCents,
      credits: pkg.credits,
      bonusCredits: pkg.bonusCredits,
      isRecommended: pkg.isRecommended,
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim() || form.priceCents <= 0 || form.credits <= 0) {
      toast('error', '请填写完整信息')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await apiClient.put(`/admin/packages/${editingId}`, form)
        toast('success', '套餐已更新')
      } else {
        await apiClient.post('/admin/packages', form)
        toast('success', '套餐已创建')
      }
      setShowModal(false)
      await loadPackages()
    } catch {
      toast('error', '保存失败')
    }
    setSaving(false)
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`确定要删除套餐"${name}"吗？`)) return
    try {
      await apiClient.delete(`/admin/packages/${id}`)
      toast('success', '套餐已删除')
      await loadPackages()
    } catch {
      toast('error', '删除失败')
    }
  }

  async function handleToggleActive(pkg: CreditPackage) {
    try {
      await apiClient.put(`/admin/packages/${pkg.id}`, { isActive: !pkg.isActive })
      toast('success', pkg.isActive ? '套餐已下架' : '套餐已上架')
      await loadPackages()
    } catch {
      toast('error', '操作失败')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width={160} height={32} />
        <Skeleton variant="rectangular" height={300} />
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
            <Package className="w-5 h-5 text-cyan-neon" />
          </div>
          <h1 className="text-2xl font-bold text-white">套餐管理</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          添加套餐
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packages.map((pkg) => (
          <Card key={pkg.id}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-white">{pkg.name}</h3>
                  {pkg.isRecommended && (
                    <Badge variant="cyan">推荐</Badge>
                  )}
                </div>
                <div className="text-2xl font-bold text-cyan-neon mt-2">
                  {formatPrice(pkg.priceCents)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(pkg)}>
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(pkg.id, pkg.name)}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">积分</span>
                <span className="text-white font-mono">{pkg.credits.toLocaleString()}</span>
              </div>
              {pkg.bonusCredits > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-muted">赠送</span>
                  <span className="text-purple-neon font-mono">+{pkg.bonusCredits}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-space-600/20">
                <span className="text-text-muted">状态</span>
                <button
                  onClick={() => handleToggleActive(pkg)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    pkg.isActive ? 'bg-cyan-neon' : 'bg-space-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      pkg.isActive ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {packages.length === 0 && (
          <Card>
            <div className="py-12 text-center text-text-muted">暂无套餐数据</div>
          </Card>
        )}
      </motion.div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? '编辑套餐' : '添加套餐'}
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-1.5 text-sm text-text-muted">套餐名称</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-space-700 border border-space-600 text-white text-sm focus:outline-none focus:border-cyan-neon"
              placeholder="例如：入门套餐"
            />
          </div>
          <div>
            <label className="block mb-1.5 text-sm text-text-muted">价格（分）</label>
            <input
              type="number"
              value={form.priceCents}
              onChange={(e) => setForm({ ...form, priceCents: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg bg-space-700 border border-space-600 text-white text-sm focus:outline-none focus:border-cyan-neon"
              placeholder="600 = 6元"
            />
          </div>
          <div>
            <label className="block mb-1.5 text-sm text-text-muted">积分数量</label>
            <input
              type="number"
              value={form.credits}
              onChange={(e) => setForm({ ...form, credits: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg bg-space-700 border border-space-600 text-white text-sm focus:outline-none focus:border-cyan-neon"
              placeholder="例如：100"
            />
          </div>
          <div>
            <label className="block mb-1.5 text-sm text-text-muted">赠送积分</label>
            <input
              type="number"
              value={form.bonusCredits}
              onChange={(e) => setForm({ ...form, bonusCredits: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg bg-space-700 border border-space-600 text-white text-sm focus:outline-none focus:border-cyan-neon"
              placeholder="可选"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRecommended}
              onChange={(e) => setForm({ ...form, isRecommended: e.target.checked })}
              className="w-4 h-4 rounded border-space-600 bg-space-700 text-cyan-neon focus:ring-cyan-neon"
            />
            <span className="text-sm text-text-muted">标记为推荐套餐</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              取消
            </Button>
            <Button onClick={handleSave} loading={saving}>
              保存
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}