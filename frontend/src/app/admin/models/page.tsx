'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Wifi,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Skeleton from '@/components/ui/Skeleton'
import { useUIStore } from '@/stores/uiStore'
import apiClient from '@/lib/axios'
import { cn } from '@/utils/cn'
import type { AIModel } from '@/types'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const MODE_OPTIONS = [
  { value: 'instrumental', label: '纯音乐' },
  { value: 'song', label: '歌曲' },
  { value: 'cover', label: '翻唱/重绘' },
  { value: 'lyrics', label: '歌词生成' },
]

const ADAPTER_OPTIONS = [
  { value: 'minimax', label: 'MiniMax 音乐生成' },
  { value: 'deepseek', label: 'DeepSeek 歌词生成' },
]

const defaultModelForm: Partial<AIModel> = {
  name: '',
  code: '',
  description: '',
  supportedModes: ['instrumental'],
  supportsLyrics: false,
  maxDurationSec: 60,
  pricePerSecond: 1,
  pricePerSong: 0,
  tags: [],
  adapterName: null,
  apiConfig: {},
  maxConcurrent: 5,
}

function modeLabel(mode: string) {
  return MODE_OPTIONS.find((m) => m.value === mode)?.label || mode
}

function modeVariant(mode: string): 'cyan' | 'purple' | 'green' | 'red' {
  if (mode === 'song') return 'purple'
  if (mode === 'cover') return 'red'
  if (mode === 'lyrics') return 'green'
  return 'cyan'
}

function ModelCardMobile({
  model,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  model: AIModel
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}) {
  return (
    <div className="p-4 rounded-xl bg-space-800 border border-space-600/50 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-white font-medium">{model.name}</h3>
          <p className="text-xs text-text-muted font-mono">{model.code}</p>
        </div>
        <button
          onClick={onToggleActive}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            model.isActive ? 'bg-cyan-neon/30' : 'bg-space-600'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 rounded-full bg-white transition-transform',
              model.isActive ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {model.supportedModes.map((mode) => (
          <Badge key={mode} variant={modeVariant(mode)}>
            {modeLabel(mode)}
          </Badge>
        ))}
        {model.tags.includes('Pro') && (
          <Badge variant="purple">Pro</Badge>
        )}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-muted">
          {model.supportsLyrics ? '支持歌词' : '不支持歌词'} | {model.maxDurationSec}s
        </span>
        <span className="text-cyan-neon font-mono">
          {model.pricePerSong > 0 ? (
            <span>
              <span className="text-purple-neon">{model.pricePerSong}</span>
              <span className="text-text-muted text-xs">/首</span>
            </span>
          ) : (
            <span>
              {model.pricePerSecond}
              <span className="text-text-muted text-xs">/秒</span>
            </span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-space-600/30">
        <button
          onClick={onEdit}
          className="flex-1 py-2 rounded-lg text-sm text-cyan-neon border border-cyan-neon/20 hover:bg-cyan-neon/10 transition-colors"
        >
          <Pencil className="w-4 h-4 inline mr-1" />
          编辑
        </button>
        <button
          onClick={onDelete}
          className="flex-1 py-2 rounded-lg text-sm text-red-neon border border-red-neon/20 hover:bg-red-neon/10 transition-colors"
        >
          <Trash2 className="w-4 h-4 inline mr-1" />
          删除
        </button>
      </div>
    </div>
  )
}

export default function ModelsPage() {
  const toast = useUIStore((s) => s.toast)
  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<Partial<AIModel>>({ ...defaultModelForm })
  const [tab, setTab] = useState(0)
  const [saving, setSaving] = useState(false)
  const [tagsInput, setTagsInput] = useState('')
  const [apiConfigText, setApiConfigText] = useState('{}')
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    loadModels()
  }, [])

  async function loadModels() {
    setLoading(true)
    try {
      const res = await apiClient.get('/admin/models')
      setModels(res.data as AIModel[])
    } catch {
      toast('error', '加载模型列表失败')
    }
    setLoading(false)
  }

  function openCreate() {
    setEditingId(null)
    setForm({ ...defaultModelForm })
    setTagsInput('')
    setApiConfigText('{}')
    setTab(0)
    setModalOpen(true)
  }

  function openEdit(model: AIModel) {
    setEditingId(model.id)
    setForm({
      ...model,
      pricePerSecond: model.pricePerSecond || 0,
      pricePerSong: model.pricePerSong || 0,
    })
    setTagsInput((model.tags || []).join(', '))
    setApiConfigText(JSON.stringify(model.apiConfig || {}, null, 2))
    setTab(0)
    setModalOpen(true)
  }

  function updateForm<K extends keyof AIModel>(key: K, value: AIModel[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleMode(mode: string) {
    const current = (form.supportedModes || []) as string[]
    const next = current.includes(mode)
      ? current.filter((m) => m !== mode)
      : [...current, mode]
    updateForm('supportedModes', next as AIModel['supportedModes'])
  }

  async function handleSave() {
    if (!form.name?.trim() || !form.code?.trim()) {
      toast('error', '请填写模型名称和代码')
      return
    }
    setSaving(true)
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      let apiConfig: Record<string, string> = {}
      try {
        apiConfig = JSON.parse(apiConfigText)
      } catch {
        if (form.adapterName && Object.keys(form.apiConfig || {}).length > 0) {
          apiConfig = form.apiConfig as Record<string, string>
        }
      }
      const payload: Record<string, unknown> = {
        ...form,
        tags,
        apiConfig,
      }
      delete (payload as Record<string, unknown>).id

      if (editingId) {
        const updatePayload: Record<string, unknown> = {}
        for (const key of Object.keys(payload) as Array<keyof typeof payload>) {
          const val = payload[key]
          if (val !== undefined && val !== null) {
            updatePayload[key] = val
          }
        }
        await apiClient.put(`/admin/models/${editingId}`, updatePayload)
        toast('success', '模型已更新')
      } else {
        await apiClient.post('/admin/models', payload)
        toast('success', '模型已创建')
      }
      setModalOpen(false)
      await loadModels()
    } catch (err: unknown) {
      const e = err as { error?: string; message?: string }
      toast('error', e?.error || e?.message || '操作失败')
    }
    setSaving(false)
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`确定要删除模型"${name}"吗？此操作不可撤销。`)) return
    try {
      await apiClient.delete(`/admin/models/${id}`)
      toast('success', '模型已删除')
      await loadModels()
    } catch {
      toast('error', '删除失败')
    }
  }

  async function handleToggleActive(model: AIModel) {
    try {
      await apiClient.put(`/admin/models/${model.id}`, { is_active: !model.isActive })
      toast('success', model.isActive ? '模型已禁用' : '模型已启用')
      await loadModels()
    } catch {
      toast('error', '操作失败')
    }
  }

  async function handleTestConnection() {
    if (!editingId) return
    setTesting(true)
    try {
      await apiClient.post(`/admin/models/${editingId}/test`)
      toast('success', '连接测试成功')
    } catch {
      toast('error', '连接测试失败')
    }
    setTesting(false)
  }

  const tabs = ['基本信息', '价格设置', 'API 配置']

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
            <Cpu className="w-5 h-5 text-cyan-neon" />
          </div>
          <h1 className="text-2xl font-bold text-white">AI模型管理</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          添加模型
        </Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted border-b border-space-600/50">
                  <th className="text-left py-3 font-medium">名称</th>
                  <th className="text-left py-3 font-medium">代码</th>
                  <th className="text-left py-3 font-medium">模式</th>
                  <th className="text-center py-3 font-medium">歌词</th>
                  <th className="text-center py-3 font-medium">最长时长</th>
                  <th className="text-right py-3 font-medium">价格</th>
                  <th className="text-center py-3 font-medium">状态</th>
                  <th className="text-right py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr
                    key={model.id}
                    className="border-b border-space-600/20 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 text-white font-medium">{model.name}</td>
                    <td className="py-3 text-text-muted font-mono text-xs">
                      {model.code}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {model.supportedModes.map((mode) => (
                          <Badge key={mode} variant={modeVariant(mode)}>
                            {modeLabel(mode)}
                          </Badge>
                        ))}
                        {model.tags.includes('Pro') && (
                          <Badge variant="purple">Pro</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      {model.supportsLyrics ? (
                        <Check className="w-4 h-4 text-green-neon mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-text-muted mx-auto" />
                      )}
                    </td>
                    <td className="py-3 text-center text-text-secondary">
                      {model.maxDurationSec}s
                    </td>
                    <td className="py-3 text-right text-cyan-neon font-mono text-xs">
                      {model.pricePerSong > 0 ? (
                        <span>
                          <span className="text-purple-neon">{model.pricePerSong}</span>
                          <span className="text-text-muted">/首</span>
                        </span>
                      ) : (
                        <span>
                          {model.pricePerSecond}
                          <span className="text-text-muted">/秒</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(model)}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                          model.isActive ? 'bg-cyan-neon/30' : 'bg-space-600'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                            model.isActive ? 'translate-x-6' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(model)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-cyan-neon hover:bg-cyan-neon/10 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(model.id, model.name)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-neon hover:bg-red-neon/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {models.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-center text-text-muted"
                    >
                      暂无模型数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {models.map((model) => (
              <ModelCardMobile
                key={model.id}
                model={model}
                onEdit={() => openEdit(model)}
                onDelete={() => handleDelete(model.id, model.name)}
                onToggleActive={() => handleToggleActive(model)}
              />
            ))}
            {models.length === 0 && (
              <div className="py-12 text-center text-text-muted">
                暂无模型数据
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? '编辑模型' : '添加模型'}
        size="lg"
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
          <div className="flex gap-1 bg-space-900 rounded-lg p-1">
            {tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                className={cn(
                  'flex-1 py-2 text-sm rounded-md transition-colors',
                  tab === i
                    ? 'bg-cyan-neon/10 text-cyan-neon'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {tab === 0 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="模型名称"
                      value={form.name || ''}
                      onChange={(e) => updateForm('name', e.target.value)}
                      placeholder="如 SonicWave Pro"
                    />
                    <Input
                      label="模型代码"
                      value={form.code || ''}
                      onChange={(e) => updateForm('code', e.target.value)}
                      placeholder="如 sonicwave_pro"
                    />
                  </div>
                  <Input
                    label="描述"
                    value={form.description || ''}
                    onChange={(e) => updateForm('description', e.target.value)}
                    placeholder="模型功能描述..."
                  />
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-text-secondary">
                      支持模式
                    </label>
                    <div className="flex gap-2">
                      {MODE_OPTIONS.map((opt) => {
                        const active = (form.supportedModes || []).includes(
                          opt.value as 'instrumental' | 'song'
                        )
                        return (
                          <button
                            key={opt.value}
                            onClick={() => toggleMode(opt.value)}
                            className={cn(
                              'px-4 py-2 rounded-lg text-sm border transition-all',
                              active
                                ? 'border-cyan-neon bg-cyan-neon/10 text-cyan-neon'
                                : 'border-space-600 text-text-muted hover:border-space-500'
                            )}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-text-secondary">
                      支持歌词生成
                    </span>
                    <button
                      onClick={() =>
                        updateForm('supportsLyrics', !form.supportsLyrics)
                      }
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        form.supportsLyrics
                          ? 'bg-cyan-neon/30'
                          : 'bg-space-600'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                          form.supportsLyrics
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                  <Input
                    label="最长时长（秒）"
                    type="number"
                    value={form.maxDurationSec || ''}
                    onChange={(e) =>
                      updateForm('maxDurationSec', Number(e.target.value))
                    }
                  />
                  <Input
                    label="标签（逗号分隔）"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="如 高音质, 多风格"
                  />
                </>
              )}

              {tab === 1 && (
                <>
                  <Input
                    label="每秒价格（积分）— 按秒计费模型使用"
                    type="number"
                    value={form.pricePerSecond || ''}
                    onChange={(e) =>
                      updateForm('pricePerSecond', Number(e.target.value))
                    }
                  />
                  <Input
                    label="每首价格（积分）— 按首计费模型使用，设为0则按秒计费"
                    type="number"
                    value={form.pricePerSong || ''}
                    onChange={(e) =>
                      updateForm('pricePerSong', Number(e.target.value))
                    }
                  />
                  <Input
                    label="最大并发数"
                    type="number"
                    value={form.maxConcurrent || ''}
                    onChange={(e) =>
                      updateForm('maxConcurrent', Number(e.target.value))
                    }
                  />
                </>
              )}

              {tab === 2 && (
                <>
                  <div className="space-y-4">
                    <Select
                      label="适配器"
                      options={ADAPTER_OPTIONS}
                      value={form.adapterName || ''}
                      onChange={(v) =>
                        updateForm('adapterName', v || null)
                      }
                    />
                    {form.adapterName === 'minimax' && (
                      <div className="space-y-3 p-4 rounded-xl bg-space-900/50 border border-space-600/30">
                        <p className="text-xs text-text-muted">
                          MiniMax 配置将覆盖全局密钥。如需使用默认密钥，保持为空。
                        </p>
                        <Input
                          label="API Key"
                          value={(form.apiConfig as Record<string, string>)?.apiKey || ''}
                          onChange={(e) =>
                            updateForm('apiConfig', {
                              ...((form.apiConfig as Record<string, string>) || {}),
                              apiKey: e.target.value,
                            })
                          }
                          placeholder="sk-xxxxxxxx"
                        />
                        <Input
                          label="Base URL（可选）"
                          value={(form.apiConfig as Record<string, string>)?.baseUrl || ''}
                          onChange={(e) =>
                            updateForm('apiConfig', {
                              ...((form.apiConfig as Record<string, string>) || {}),
                              baseUrl: e.target.value,
                            })
                          }
                          placeholder="留空使用默认地址"
                        />
                      </div>
                    )}
                    {form.adapterName === 'deepseek' && (
                      <div className="space-y-3 p-4 rounded-xl bg-space-900/50 border border-space-600/30">
                        <p className="text-xs text-text-muted">
                          DeepSeek 配置将覆盖全局密钥。如需使用默认密钥，保持为空。
                        </p>
                        <Input
                          label="API Key"
                          value={(form.apiConfig as Record<string, string>)?.apiKey || ''}
                          onChange={(e) =>
                            updateForm('apiConfig', {
                              ...((form.apiConfig as Record<string, string>) || {}),
                              apiKey: e.target.value,
                            })
                          }
                          placeholder="sk-xxxxxxxx"
                        />
                        <Input
                          label="Base URL（可选）"
                          value={(form.apiConfig as Record<string, string>)?.baseUrl || ''}
                          onChange={(e) =>
                            updateForm('apiConfig', {
                              ...((form.apiConfig as Record<string, string>) || {}),
                              baseUrl: e.target.value,
                            })
                          }
                          placeholder="留空使用默认地址"
                        />
                      </div>
                    )}
                    {(!form.adapterName || (!form.apiConfig || Object.keys(form.apiConfig as Record<string, string>).length === 0)) && (
                      <div className="text-sm text-text-muted p-4 rounded-xl bg-space-900/50 border border-space-600/30">
                        {form.adapterName
                          ? '当前使用全局默认配置，无需额外设置'
                          : '请先选择适配器类型以配置API参数'}
                      </div>
                    )}
                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-text-secondary">
                        原始配置 (JSON)
                      </label>
                      <textarea
                        value={apiConfigText}
                        onChange={(e) => setApiConfigText(e.target.value)}
                        rows={4}
                        className="w-full rounded-xl bg-space-800 border border-space-600 px-4 py-2.5 text-sm text-white placeholder:text-text-muted font-mono focus:outline-none focus:border-cyan-neon focus:shadow-[0_0_12px_var(--color-cyan-glow)] transition-all resize-none"
                        placeholder='{"apiKey": "", "baseUrl": ""}'
                      />
                    </div>
                    <Button
                      variant="secondary"
                      onClick={handleTestConnection}
                      loading={testing}
                    >
                      <Wifi className="w-4 h-4" />
                      测试连接
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </Modal>
    </motion.div>
  )
}