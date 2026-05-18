import { create } from 'zustand'
import apiClient from '@/lib/axios'
import { useUIStore } from './uiStore'
import type { AIModel } from '@/types'

interface ModelState {
  models: AIModel[]
  selectedModel: AIModel | null
  loading: boolean

  fetchModels: (mode?: string) => Promise<void>
  selectModel: (model: AIModel) => void
}

export const useModelStore = create<ModelState>()((set) => ({
  models: [],
  selectedModel: null,
  loading: false,

  fetchModels: async (mode) => {
    set({ loading: true })
    try {
      const res = await apiClient.get('/models', { params: mode ? { mode } : {} })
      set({ models: res.data, loading: false })
    } catch (error: unknown) {
      const err = error as { message?: string; error?: string }
      set({ loading: false })
      useUIStore.getState().toast('error', err?.message || err?.error || '获取模型列表失败')
    }
  },

  selectModel: (model) => {
    set({ selectedModel: model })
  },
}))