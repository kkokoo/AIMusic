import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import apiClient from '@/lib/axios'
import { useUIStore } from './uiStore'
import type { User, LoginParams, RegisterParams } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (params: LoginParams) => Promise<void>
  register: (params: RegisterParams) => Promise<void>
  logout: () => void
  fetchProfile: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (params) => {
        set({ isLoading: true })
        try {
          const res = await apiClient.post('/auth/login', { email: params.email, password: params.password })
          const payload = res.data as { token: string; user: User }
          localStorage.setItem('auth-token', payload.token)
          set({ user: payload.user, token: payload.token, isAuthenticated: true, isLoading: false })
        } catch (error: unknown) {
          const err = error as { message?: string; error?: string }
          set({ isLoading: false })
          useUIStore.getState().toast('error', err?.message || err?.error || '登录失败')
          throw error
        }
      },

      register: async (params) => {
        set({ isLoading: true })
        try {
          const res = await apiClient.post('/auth/register', { username: params.username, email: params.email, password: params.password, verify_code: params.verifyCode })
          const payload = res.data as { token: string; user: User }
          localStorage.setItem('auth-token', payload.token)
          set({ user: payload.user, token: payload.token, isAuthenticated: true, isLoading: false })
        } catch (error: unknown) {
          const err = error as { message?: string; error?: string }
          set({ isLoading: false })
          useUIStore.getState().toast('error', err?.message || err?.error || '注册失败')
          throw error
        }
      },

      logout: () => {
        localStorage.removeItem('auth-token')
        set({ user: null, token: null, isAuthenticated: false, isLoading: false })
      },

      fetchProfile: async () => {
        set({ isLoading: true })
        try {
          const res = await apiClient.get('/user/profile')
          set({ user: res.data as User, isLoading: false })
        } catch (error: unknown) {
          const err = error as { message?: string; error?: string }
          set({ isLoading: false })
          useUIStore.getState().toast('error', err?.message || err?.error || '获取用户信息失败')
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true })
        try {
          const res = await apiClient.put('/user/profile', { username: data.username })
          set({ user: res.data as User, isLoading: false })
        } catch (error: unknown) {
          const err = error as { message?: string; error?: string }
          set({ isLoading: false })
          useUIStore.getState().toast('error', err?.message || err?.error || '更新资料失败')
          throw error
        }
      },

      changePassword: async (oldPassword, newPassword) => {
        set({ isLoading: true })
        try {
          await apiClient.put('/user/password', { old_password: oldPassword, new_password: newPassword })
          set({ isLoading: false })
          useUIStore.getState().toast('success', '密码修改成功')
        } catch (error: unknown) {
          const err = error as { message?: string; error?: string }
          set({ isLoading: false })
          useUIStore.getState().toast('error', err?.message || err?.error || '密码修改失败')
          throw error
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)