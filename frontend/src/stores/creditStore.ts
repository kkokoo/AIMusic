import { create } from 'zustand'
import apiClient from '@/lib/axios'
import { useUIStore } from './uiStore'
import type { CreditTransaction, CreditPackage, CreditOrder, CreateOrderParams } from '@/types'

interface CreditState {
  balance: number
  transactions: CreditTransaction[]
  packages: CreditPackage[]
  orders: CreditOrder[]
  loading: boolean

  fetchBalance: (userId: number) => Promise<void>
  fetchTransactions: (userId: number) => Promise<void>
  fetchPackages: () => Promise<void>
  createOrder: (userId: number, params: CreateOrderParams) => Promise<CreditOrder>
  payOrder: (orderId: number, userId: number) => Promise<void>
}

export const useCreditStore = create<CreditState>()((set) => ({
  balance: 0,
  transactions: [],
  packages: [],
  orders: [],
  loading: false,

  fetchBalance: async (_userId) => {
    void _userId
    set({ loading: true })
    try {
      const res = await apiClient.get('/credits/balance')
      set({ balance: res.data.balance, loading: false })
    } catch (error: unknown) {
      const err = error as { message?: string; error?: string }
      set({ loading: false })
      useUIStore.getState().toast('error', err?.message || err?.error || '获取积分余额失败')
    }
  },

  fetchTransactions: async (_userId) => {
    void _userId
    set({ loading: true })
    try {
      const res = await apiClient.get('/credits/transactions')
      set({ transactions: res.data.items, loading: false })
    } catch (error: unknown) {
      const err = error as { message?: string; error?: string }
      set({ loading: false })
      useUIStore.getState().toast('error', err?.message || err?.error || '获取交易记录失败')
    }
  },

  fetchPackages: async () => {
    set({ loading: true })
    try {
      const res = await apiClient.get('/credits/packages')
      set({ packages: res.data, loading: false })
    } catch (error: unknown) {
      const err = error as { message?: string; error?: string }
      set({ loading: false })
      useUIStore.getState().toast('error', err?.message || err?.error || '获取套餐列表失败')
    }
  },

  createOrder: async (_userId, params) => {
    void _userId
    set({ loading: true })
    try {
      const res = await apiClient.post('/orders/create', { package_id: params.packageId, payment_method: params.paymentMethod })
      const order = res.data
      set((state) => ({
        orders: [order, ...state.orders],
        loading: false,
      }))
      return order
    } catch (error: unknown) {
      const err = error as { message?: string; error?: string }
      set({ loading: false })
      useUIStore.getState().toast('error', err?.message || err?.error || '创建订单失败')
      throw error
    }
  },

  payOrder: async (orderId, _userId) => {
    void _userId
    set({ loading: true })
    try {
      const res = await apiClient.post(`/orders/${orderId}/pay`)
      const order = res.data
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? order : o)),
        loading: false,
      }))
    } catch (error: unknown) {
      const err = error as { message?: string; error?: string }
      set({ loading: false })
      useUIStore.getState().toast('error', err?.message || err?.error || '支付失败')
      throw error
    }
  },
}))