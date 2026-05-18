import { create } from 'zustand'
import apiClient from '@/lib/axios'
import { useUIStore } from './uiStore'

export interface DiscoveryItem {
  id: number
  prompt: string
  customName?: string
  style: string
  mode: string
  modelName: string
  durationSec: number
  playCount: number
  lyrics?: string
  createdAt: string
  audioUrl: string | null
}

interface DiscoveryState {
  leaderboard: DiscoveryItem[]
  leaderboardTotal: number
  leaderboardPage: number
  leaderboardLoading: boolean

  recommendations: DiscoveryItem[]
  recommendationsLoading: boolean

  searchResults: DiscoveryItem[]
  searchTotal: number
  searchQuery: string
  searchPage: number
  searchLoading: boolean

  fetchLeaderboard: (page?: number) => Promise<void>
  fetchRecommendations: () => Promise<void>
  search: (query: string, page?: number) => Promise<void>
  recordPlay: (taskId: number) => Promise<void>
}

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  leaderboard: [],
  leaderboardTotal: 0,
  leaderboardPage: 1,
  leaderboardLoading: false,

  recommendations: [],
  recommendationsLoading: false,

  searchResults: [],
  searchTotal: 0,
  searchQuery: '',
  searchPage: 1,
  searchLoading: false,

  fetchLeaderboard: async (page = 1) => {
    set({ leaderboardLoading: true })
    try {
      const res = await apiClient.get('/discovery/leaderboard', {
        params: { page, pageSize: 20 },
      })
      set({
        leaderboard: res.data?.items || [],
        leaderboardTotal: res.data?.total || 0,
        leaderboardPage: page,
      })
    } catch {
      set({ leaderboard: [] })
    } finally {
      set({ leaderboardLoading: false })
    }
  },

  fetchRecommendations: async () => {
    set({ recommendationsLoading: true })
    try {
      const res = await apiClient.get('/discovery/recommendations', {
        params: { limit: 20 },
      })
      set({ recommendations: res.data?.items || [] })
    } catch {
      set({ recommendations: [] })
    } finally {
      set({ recommendationsLoading: false })
    }
  },

  search: async (query, page = 1) => {
    set({ searchLoading: true, searchQuery: query })
    try {
      const res = await apiClient.get('/discovery/search', {
        params: { q: query, page, pageSize: 20 },
      })
      set({
        searchResults: res.data?.items || [],
        searchTotal: res.data?.total || 0,
        searchPage: page,
      })
    } catch {
      set({ searchResults: [] })
    } finally {
      set({ searchLoading: false })
    }
  },

  recordPlay: async (taskId: number) => {
    try {
      await apiClient.post(`/discovery/play/${taskId}`)
    } catch {
      // silent fail
    }
  },
}))