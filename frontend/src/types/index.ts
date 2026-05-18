export interface User {
  id: number;
  username: string;
  email: string;
  credits: number;
  totalCreditsEarned: number;
  totalCreditsSpent: number;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIModel {
  id: number;
  name: string;
  code: string;
  description: string;
  supportedModes: ('instrumental' | 'song' | 'cover')[];
  supportsLyrics: boolean;
  maxDurationSec: number;
  pricePerSecond: number;
  pricePerSong: number;
  tags: string[];
  apiConfig: Record<string, unknown>;
  adapterName: string | null;
  maxConcurrent: number;
  isActive: boolean;
  consecutiveFailures: number;
}

export interface GenerationTask {
  id: number;
  userId: number;
  modelId: number;
  modelName: string;
  mode: 'instrumental' | 'song' | 'cover';
  prompt?: string;
  lyrics?: string;
  style?: string;
  vocalGender?: string;
  vocalStyle?: string;
  language?: string;
  durationSec: number;
  actualDurationSec?: number;
  costCredits: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  errorMessage?: string;
  isDeleted: boolean;
  customName?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CreditTransaction {
  id: number;
  userId: number;
  amount: number;
  balanceAfter: number;
  type: 'initial' | 'purchase' | 'consumption' | 'refund' | 'manual';
  relatedId?: number;
  description: string;
  createdAt: string;
}

export interface CreditPackage {
  id: number;
  name: string;
  priceCents: number;
  credits: number;
  bonusCredits: number;
  isRecommended: boolean;
  isActive: boolean;
}

export interface CreditOrder {
  id: number;
  orderNo: string;
  userId: number;
  packageId?: number;
  amountCents: number;
  creditsBought: number;
  bonusCredits: number;
  status: 'pending' | 'success' | 'failed';
  paymentMethod?: 'wechat' | 'alipay';
  paidAt?: string;
  createdAt: string;
}

export interface AdminLog {
  id: number;
  adminId: number;
  action: string;
  targetType: string;
  targetId?: number;
  details: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

export interface DashboardStats {
  todayGenerations: number;
  todayRevenue: number;
  activeUsers: number;
  modelUsage: { name: string; count: number }[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateTaskParams {
  modelId: number;
  mode: 'instrumental' | 'song' | 'cover'
  prompt?: string
  lyrics?: string
  style?: string
  vocalGender?: string
  vocalStyle?: string
  language?: string
  durationSec: number
  audioUrl?: string
  audioBase64?: string;
  customName?: string;
}

export interface GenerateLyricsParams {
  prompt: string;
  style?: string;
  language?: string;
  verseCount?: number;
}

export interface GenerateLyricsResult {
  lyrics: string;
  prompt: string;
  style?: string;
  language?: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
  verifyCode: string;
}

export interface CreateOrderParams {
  packageId?: number;
  customCredits?: number;
  paymentMethod: 'wechat' | 'alipay';
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}