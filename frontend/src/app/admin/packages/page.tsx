'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Package, Plus, Edit3, Trash2, Star } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
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

const PAGE_SIZE = 10

export default function PackagesPage() {
  const toast = useUIStore((s) => s.toast)
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
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

  const loadPackages = useCallback(
    async (p: number) => {
      setLoading(true)
      try {
        const res = await apiClient.get('/admin/packages', {
          params: { page: p, page_size: PAGE_SIZE },
        })
        const data = (
          res.data as { data: { items: CreditPackage[]; total: number; totalPages: number } }
        ).data
        setPackages(data?.items || [])
        setTotal(data?.total || 0)
        setTotalPages(data?.totalPages || 1)
        setPage(p)
      } catch (err: unknown) {
        const e = err as { error?: string; message?: string }
        toast('error', e?.error || e?.message || '加载套餐列表失败')
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  useEffect(() => {
    ;(async () => {
      await loadPackages(1)
    })()
  }, [loadPackages])

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
      await loadPackages(page)
    } catch (err: unknown) {
      const e = err as { error?: string; message?: string }
      toast('error', e?.error || e?.message || '保存失败')
    }
    setSaving(false)
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`确定要删除套餐"${name}"吗？`)) return
    try {
      await apiClient.delete(`/admin/packages/${id}`)
      toast('success', '套餐已删除')
      await loadPackages(page)
    } catch (err: unknown) {
      const e = err as { error?: string; message?: string }
      toast('error', e?.error || e?.message || '删除失败')
    }
  }

  async function handleToggleActive(pkg: CreditPackage) {
    try {
      await apiClient.put(`/admin/packages/${pkg.id}`, { isActive: !pkg.isActive })
      toast('success', pkg.isActive ? '套餐已下架' : '套餐已上架')
      await loadPackages(page)
    } catch (err: unknown) {
      const e = err as { error?: string; message?: string }
      toast('error', e?.error || e?.message || '操作失败')
    }
  }

  if (loading && packages.length === 0) {
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
            <Package className="w-5 h-5 text-cyan-neon" />
          </div>
          <h1 className="text-2xl font-bold text-white">套餐管理</h1>
          <span className="text-sm text-text-muted">共 {total} 个套餐</span>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          添加套餐
        </Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted border-b border-space-600/50">
                  <th className="text-left py-3 font-medium">ID</th>
                  <th className="text-left py-3 font-medium">套餐名称</th>
                  <th className="text-right py-3 font-medium">价格</th>
                  <th className="text-right py-3 font-medium">积分</th>
                  <th className="text-right py-3 font-medium">赠送</th>
                  <th className="text-center py-3 font-medium">状态</th>
                  <th className="text-center py-3 font-medium">推荐</th>
                  <th className="text-center py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr
                    key={pkg.id}
                    className="border-b border-space-600/20 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 text-text-muted font-mono text-xs">#{pkg.id}</td>
                    <td className="py-3 text-white font-medium">{pkg.name}</td>
                    <td className="py-3 text-right">
                      <span className="text-cyan-neon font-mono font-medium">
                        {formatPrice(pkg.priceCents)}
                      </span>
                    </td>
                    <td className="py-3 text-right text-white font-mono">
                      {pkg.credits.toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      {pkg.bonusCredits > 0 ? (
                        <span className="text-purple-neon font-mono">+{pkg.bonusCredits}</span>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
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
                    </td>
                    <td className="py-3 text-center">
                      {pkg.isRecommended ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border bg-amber-400/10 text-amber-400 border-amber-400/30">
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                          推荐
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(pkg)}>
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(pkg.id, pkg.name)}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {packages.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-text-muted">
                      暂无套餐数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {packages.length === 0 && (
              <div className="py-12 text-center text-text-muted">暂无套餐数据</div>
            )}
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="p-4 rounded-xl bg-white/[0.02] border border-space-600/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted font-mono text-xs">#{pkg.id}</span>
                    <span className="text-white font-medium">{pkg.name}</span>
                    {pkg.isRecommended && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border bg-amber-400/10 text-amber-400 border-amber-400/30">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        推荐
                      </span>
                    )}
                  </div>
                  <Badge variant={pkg.isActive ? 'green' : 'gray'} dot>
                    {pkg.isActive ? '上架' : '下架'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-cyan-neon">
                    {formatPrice(pkg.priceCents)}
                  </span>
                  <div className="text-right text-sm">
                    <div className="text-white font-mono">
                      {pkg.credits.toLocaleString()} 积分
                    </div>
                    {pkg.bonusCredits > 0 && (
                      <div className="text-purple-neon font-mono">+{pkg.bonusCredits} 赠送</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-space-600/20">
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
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(pkg)}>
                      <Edit3 className="w-4 h-4" />
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(pkg.id, pkg.name)}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                      删除
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            loading={loading}
            onPageChange={(p) => loadPackages(p)}
            itemName="个套餐"
          />
        </Card>
      </motion.div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? '编辑套餐' : '添加套餐'}
      >
        <div className="space-y-5">
          <div>
            <label className="block mb-1.5 text-sm font-medium text-text-secondary">
              套餐名称
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-space-800 border border-space-600 text-white text-sm focus:outline-none focus:border-cyan-neon focus:shadow-[0_0_12px_var(--color-cyan-glow)] transition-all"
              placeholder="例如：入门套餐"
            />
            <p className="text-xs text-text-muted mt-1.5">用户在充值页面可见的套餐显示名称</p>
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-medium text-text-secondary">
              价格（分）
            </label>
            <div className="relative">
              <input
                type="number"
                value={form.priceCents}
                onChange={(e) =>
                  setForm({ ...form, priceCents: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2.5 pr-12 rounded-xl bg-space-800 border border-space-600 text-white text-sm focus:outline-none focus:border-cyan-neon focus:shadow-[0_0_12px_var(--color-cyan-glow)] transition-all"
                placeholder="600"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                分
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1.5">
              以分为单位，例如 600 = {formatPrice(600)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-text-secondary">
                积分数量
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.credits}
                  onChange={(e) =>
                    setForm({ ...form, credits: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-space-800 border border-space-600 text-white text-sm focus:outline-none focus:border-cyan-neon focus:shadow-[0_0_12px_var(--color-cyan-glow)] transition-all"
                  placeholder="100"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                  积分
                </span>
              </div>
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-medium text-text-secondary">
                赠送积分
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.bonusCredits}
                  onChange={(e) =>
                    setForm({ ...form, bonusCredits: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-space-800 border border-space-600 text-white text-sm focus:outline-none focus:border-cyan-neon focus:shadow-[0_0_12px_var(--color-cyan-glow)] transition-all"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                  积分
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-text-muted -mt-2">
            赠送积分将在用户购买时额外发放，可不填
          </p>
          <div className="flex items-center justify-between p-3 rounded-xl bg-space-900/50 border border-space-600/30">
            <div>
              <span className="text-sm text-text-secondary">标记为推荐套餐</span>
              <p className="text-xs text-text-muted mt-0.5">推荐套餐将在充值页面突出展示</p>
            </div>
            <button
              onClick={() => setForm({ ...form, isRecommended: !form.isRecommended })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.isRecommended ? 'bg-amber-400/30' : 'bg-space-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  form.isRecommended ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
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
