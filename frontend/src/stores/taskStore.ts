import { create } from 'zustand'
import apiClient from '@/lib/axios'
import { useUIStore } from './uiStore'
import type { GenerationTask, CreateTaskParams } from '@/types'

interface TaskState {
  currentTask: GenerationTask | null
  tasks: GenerationTask[]
  isGenerating: boolean

  submitTask: (params: CreateTaskParams & { userId: number }) => Promise<GenerationTask>
  pollTask: (taskId: number) => Promise<void>
  fetchHistory: (userId: number, page?: number) => Promise<{ total: number; totalPages: number } | undefined>
  deleteTask: (taskId: number) => Promise<void>
  renameTask: (taskId: number, customName: string) => Promise<void>
}

export const useTaskStore = create<TaskState>()((set) => ({
  currentTask: null,
  tasks: [],
  isGenerating: false,

  submitTask: async (params) => {
    set({ isGenerating: true })
    try {
      const res = await apiClient.post('/generation/submit', {
        model_id: params.modelId,
        mode: params.mode,
        prompt: params.prompt,
        lyrics: params.lyrics,
        duration_sec: params.durationSec,
        style: params.style,
        vocal_gender: params.vocalGender,
        vocal_style: params.vocalStyle,
        language: params.language,
        audio_base64: params.audioBase64,
        custom_name: params.customName,
      })
      const task = res.data
      set({ currentTask: task, isGenerating: false })
      return task
    } catch (error: unknown) {
      const err = error as { message?: string; error?: string }
      set({ isGenerating: false })
      useUIStore.getState().toast('error', err?.message || err?.error || '提交任务失败')
      throw error
    }
  },

  pollTask: async (taskId: number) => {
    let polls = 0
    const maxPolls = 30

    const poll = async (): Promise<void> => {
      if (polls >= maxPolls) return

      try {
        const res = await apiClient.get(`/generation/task/${taskId}`)
        const task = res.data
        set({ currentTask: task })

        if (task.status === 'completed' || task.status === 'failed') {
          set((state) => ({
            tasks: [task, ...state.tasks.filter((t) => t.id !== task.id)],
          }))
          return
        }
      } catch {
        return
      }

      polls++
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return poll()
    }

    return poll()
  },

  fetchHistory: async (_userId, page = 1) => {
    void _userId
    try {
      const res = await apiClient.get('/generation/history', { params: { page, page_size: 12 } })
      const data = res.data
      if (page === 1) {
        set({ tasks: data.items })
      } else {
        set((state) => ({
          tasks: [...state.tasks, ...data.items],
        }))
      }
      return { total: data.total as number, totalPages: data.totalPages as number }
    } catch {
      return undefined
    }
  },

  deleteTask: async (taskId) => {
    try {
      await apiClient.delete(`/generation/${taskId}`)
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
        currentTask: state.currentTask?.id === taskId ? null : state.currentTask,
      }))
      useUIStore.getState().toast('success', '作品已删除')
    } catch (error: unknown) {
      const err = error as { message?: string; error?: string }
      useUIStore.getState().toast('error', err?.message || err?.error || '删除失败')
      throw error
    }
  },

  renameTask: async (taskId, customName) => {
    try {
      await apiClient.patch(`/generation/${taskId}/rename`, { custom_name: customName })
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, customName } : t
        ),
        currentTask:
          state.currentTask?.id === taskId
            ? { ...state.currentTask, customName }
            : state.currentTask,
      }))
      useUIStore.getState().toast('success', '改名成功')
    } catch (error: unknown) {
      const err = error as { message?: string; error?: string }
      useUIStore.getState().toast('error', err?.message || err?.error || '改名失败')
      throw error
    }
  },
}))