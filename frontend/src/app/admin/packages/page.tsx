'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, Plus, Pencil, Trash2 } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import { useUIStore } from '@/stores/uiStore'
import { mockApi } from '@/mock/data'
import { formatPrice } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { CreditPackage } from '@/types'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const defaultForm: Partial<CreditPackage> = {
  name: '',
  priceCents: 0,
  credits: 0,
  bonusCredits: 0,
  isRecommended: false,
  isActive: true,
}

export default function PackagesPage() {
  const toast = useUIStore((s) => s.toast)
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<Partial<CreditPackage>>({ ...defaultForm })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPackages()
  }, [])

  async function loadPackages() {
    setLoading(true)
    const data = await mockApi.getAdminPackages()
    setPackages(data)
    setLoading(false)
  }

  function openCreate() {
    setEditingId(null)
    setForm({ ...defaultForm })
    setModalOpen(true)
  }

  function openEdit(pkg: CreditPackage) {
    setEditingId(pkg.id)
    setForm({ ...pkg })
    setModalOpen(true)
  }

  function updateForm<K extends keyof CreditPackage>(
    key: K,
    value: CreditPackage[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.name?.trim()) {
      toast('error', '请填写套餐名称')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await mockApi.updatePackage(editingId, form)
        toast('success', '套餐已更新')
      } else {
        await mockApi.createPackage(form)
        toast('success', '套餐已创建')
      }
      setModalOpen(false)
      await loadPackages()
    } catch {
      toast('error', '操作失败')
    }
    setSaving(false)
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`确定要删除套餐"${name}"吗？`)) return
    await mockApi.deletePackage(id)
    toast('success', '套餐已删除')
    await loadPackages()
  }

  async function handleToggleActive(pkg: CreditPackage) {
    await mockApi.updatePackage(pkg.id, { isActive: !pkg.isActive })
    toast('success', pkg.isActive ? '套餐已下架' : '套餐已上架')
    await loadPackages()
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
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-neon/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-cyan-neon" />
          </div>
          <h1 className="text-2xl font-bold text-white">积分套餐管理</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          添加套餐
        </Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted border-b border-space-600/50">
                  <th className="text-left py-3 font-medium">名称</th>
                  <th className="text-right py-3 font-medium">价格</th>
                  <th className="text-right py-3 font-medium">积分</th>
                  <th className="text-right py-3 font-medium">赠送</th>
                  <th className="text-center py-3 font-medium">推荐</th>
                  <th className="text-center py-3 font-medium">状态</th>
                  <th className="text-right py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr
                    key={pkg.id}
                    className="border-b border-space-600/20 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 text-white font-medium">
                      {pkg.name}
                      {pkg.isRecommended && (
                        <span className="ml-2">
                          <Badge variant="green" dot>
                            推荐
                          </Badge>
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right text-text-secondary">
                      {formatPrice(pkg.priceCents)}
                    </td>
                    <td className="py-3 text-right text-cyan-neon font-mono text-xs">
                      {pkg.credits}
                    </td>
                    <td className="py-3 text-right text-purple-neon font-mono text-xs">
                      {pkg.bonusCredits}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={cn(
                          'text-xs font-medium',
                          pkg.isRecommended ? 'text-green-neon' : 'text-text-muted'
                        )}
                      >
                        {pkg.isRecommended ? '是' : '否'}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(pkg)}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                          pkg.isActive ? 'bg-cyan-neon/30' : 'bg-space-600'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                            pkg.isActive ? 'translate-x-6' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(pkg)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-cyan-neon hover:bg-cyan-neon/10 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pkg.id, pkg.name)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-neon hover:bg-red-neon/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {packages.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-text-muted"
                    >
                      暂无套餐数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {packages.length === 0 && (
              <div className="py-12 text-center text-text-muted">暂无套餐数据</div>
            )}
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="p-3 rounded-lg bg-white/[0.02] border border-space-600/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{pkg.name}</span>
                    {pkg.isRecommended && (
                      <Badge variant="green" dot>推荐</Badge>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleActive(pkg)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      pkg.isActive ? 'bg-cyan-neon/30' : 'bg-space-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                        pkg.isActive ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-text-secondary text-xs">{formatPrice(pkg.priceCents)}</span>
                  <span className="text-cyan-neon font-mono text-xs">{pkg.credits} 积分</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-neon font-mono text-xs">
                    赠送 {pkg.bonusCredits} 积分
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(pkg)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-cyan-neon hover:bg-cyan-neon/10 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id, pkg.name)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-red-neon hover:bg-red-neon/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? '编辑套餐' : '添加套餐'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} loading={saving}>
              保存
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="套餐名称"
            value={form.name || ''}
            onChange={(e) => updateForm('name', e.target.value)}
            placeholder="如 入门套餐"
          />
          <Input
            label="价格（分）"
            type="number"
            value={form.priceCents || ''}
            onChange={(e) => updateForm('priceCents', Number(e.target.value))}
          />
          <Input
            label="积分数量"
            type="number"
            value={form.credits || ''}
            onChange={(e) => updateForm('credits', Number(e.target.value))}
          />
          <Input
            label="赠送积分"
            type="number"
            value={form.bonusCredits || ''}
            onChange={(e) => updateForm('bonusCredits', Number(e.target.value))}
          />
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-text-secondary">推荐套餐</span>
            <button
              onClick={() => updateForm('isRecommended', !form.isRecommended)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                form.isRecommended ? 'bg-cyan-neon/30' : 'bg-space-600'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                  form.isRecommended ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-text-secondary">上架状态</span>
            <button
              onClick={() => updateForm('isActive', !form.isActive)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                form.isActive ? 'bg-cyan-neon/30' : 'bg-space-600'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                  form.isActive ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}